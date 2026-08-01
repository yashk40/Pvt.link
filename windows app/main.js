const { app, BrowserWindow, ipcMain, desktopCapturer, Menu, Tray, nativeImage, session } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');
const { io } = require('socket.io-client');
// Load PVTLINK_SERVER_URL from a local .env if present (for pointing the agent
// at a local Node backend instead of the default Cloudflare Worker).
require('dotenv').config();

// Prevent multiple instances from running concurrently
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Local Node backend is the target. Override with PVTLINK_SERVER_URL when the
// backend lives elsewhere; PVTLINK_BACKUP_URL is an optional secondary only.
const SERVER_URL = process.env.PVTLINK_SERVER_URL || 'http://localhost:4000';
const BACKUP_URL = process.env.PVTLINK_BACKUP_URL || '';
let activeUrl = SERVER_URL; // Will switch to BACKUP_URL only if one is configured
let mainWindow;
let tray;
let heartbeatTimer;
let pairingStatusTimer;
let isQuitting = false;
let backendQuotaBlocked = false;
let agent = { socket: null, deviceId: null, pairCode: null, agentToken: null, connected: false, owners: [], paired: false };

const configPath = () => path.join(app.getPath('userData'), 'device-agent.json');
const loadConfig = () => { try { return JSON.parse(fs.readFileSync(configPath(), 'utf8')); } catch { return null; } };
const saveConfig = (config) => fs.writeFileSync(configPath(), JSON.stringify(config), 'utf8');
const persistAgent = (data = agent) => saveConfig({
    deviceId: data.deviceId,
    agentToken: data.agentToken,
    pairCode: data.pairCode || null,
    pairCodeExpiresAt: data.pairCodeExpiresAt || null,
    // Preserve the last confirmed pairing state across an app restart. The
    // server refresh below remains authoritative, but the UI must not flash
    // back to "Waiting for pairing" while that request is in flight.
    paired: Boolean(data.paired),
    owners: data.owners || [],
});
const isQuotaExceededError = (error) => /quota exceeded|resource exhausted|rate limit|too many requests/i.test(error?.message || '');
// The backend stores devices in an in-memory store that resets on restart
// (Firestore quota is exhausted). When it no longer knows our deviceId, every
// call returns DEVICE_NOT_FOUND and the agent must abandon the stale identity
// and start a fresh pairing session instead of retrying forever.
const isDeviceNotFoundError = (error) => error?.code === 'DEVICE_NOT_FOUND' || /device not found|device is not registered/i.test(error?.message || '');
// 429 Too Many Requests from express-rate-limit on the /pair routes. Back off
// aggressively — the limit is 30 requests per 15 minutes.
const isRateLimitError = (error) => error?.status === 429 || /rate.limit|too many requests|429/i.test(error?.message || '');
const publicAgentStatus = (data = agent) => {
    const { socket, ...status } = data;
    return status;
};
const notify = (data) => mainWindow?.webContents.send('agent-status', publicAgentStatus(data));
const run = (file, args = []) => new Promise((resolve, reject) => execFile(file, args, { windowsHide: true }, (error, stdout, stderr) => error ? reject(new Error(stderr || error.message)) : resolve(stdout)));

function showWindow() {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
}

function createTray() {
    // Keep the agent discoverable even when the main window is hidden. An inline
    // SVG avoids depending on a platform-specific tray icon during development.
    const icon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#0f766e"/><path d="M9 16h14M16 9v14" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>').toString('base64')}`);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('Pvt.link Remote Agent');
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Open Pvt.link', click: showWindow },
        { type: 'separator' },
        {
            label: 'Quit agent',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ]));
    tray.on('double-click', showWindow);
}

function getDeviceDetails() {
    const network = Object.values(os.networkInterfaces()).flat().find((item) => item && item.family === 'IPv4' && !item.internal);
    return { deviceName: os.hostname(), hostname: os.hostname(), os: 'windows', cpu: os.cpus()[0]?.model || 'Unknown CPU', ram: `${Math.round(os.totalmem() / 1024 ** 3)} GB`, localIp: network?.address || '' };
}

function captureMedia(type) {
    return new Promise(async (resolve, reject) => {
        try {
            let sourceId = null;
            if (type === 'screen') {
                const sources = await desktopCapturer.getSources({ types: ['screen'] });
                if (!sources || !sources[0]) throw new Error('No display is available');
                sourceId = sources[0].id;
            }

            const win = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });

            const cleanUp = () => {
                ipcMain.removeAllListeners('media-captured');
                try { win.close(); } catch {}
            };

            ipcMain.once('media-captured', (event, result) => {
                cleanUp();
                if (result.success) {
                    resolve({ imageBase64: result.base64, mimeType: 'image/jpeg', capturedAt: new Date().toISOString() });
                } else {
                    reject(new Error(result.error || 'Failed to capture media'));
                }
            });

            const htmlPath = path.join(app.getPath('userData'), 'temp-capture.html');
            const html = `<!DOCTYPE html>
            <html>
            <body>
            <script>
              const { ipcRenderer } = require('electron');
              async function capture() {
                try {
                  const isScreen = ${type === 'screen'};
                  const sourceId = '${sourceId}';
                  
                  const constraints = isScreen 
                    ? { video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId } }, audio: false }
                    : { video: true, audio: false };

                  const stream = await navigator.mediaDevices.getUserMedia(constraints);
                  const video = document.createElement('video');
                  video.srcObject = stream;
                  
                  video.onloadedmetadata = () => {
                    video.play();
                    setTimeout(() => {
                      const canvas = document.createElement('canvas');
                      const maxW = isScreen ? 1280 : 640;
                      let w = video.videoWidth || maxW;
                      let h = video.videoHeight || (isScreen ? 720 : 480);
                      if (w > maxW) {
                          h = Math.round((h * maxW) / w);
                          w = maxW;
                      }
                      canvas.width = w;
                      canvas.height = h;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(video, 0, 0, w, h);
                      
                      stream.getTracks().forEach(track => track.stop());
                      
                      const dataUrl = canvas.toDataURL('image/jpeg', isScreen ? 0.6 : 0.6);
                      const base64 = dataUrl.split(',')[1];
                      ipcRenderer.send('media-captured', { success: true, base64 });
                    }, isScreen ? 500 : 1000);
                  };
                } catch (err) {
                  ipcRenderer.send('media-captured', { success: false, error: err.message });
                }
              }
              capture();
            </script>
            </body>
            </html>`;

            fs.writeFileSync(htmlPath, html);
            win.loadFile(htmlPath);

            setTimeout(() => {
                cleanUp();
                reject(new Error('Media capture timed out'));
            }, 10000);

        } catch (err) {
            reject(err);
        }
    });
}

function captureScreen() { return captureMedia('screen'); }
function captureWebcam() { return captureMedia('webcam'); }

async function executeCommand(command) {
    switch (command.type) {
        case 'lock': await run('rundll32.exe', ['user32.dll,LockWorkStation']); return { message: 'Windows lock screen activated' };
        case 'restart': await run('shutdown.exe', ['/r', '/t', '5']); return { message: 'Restart scheduled in 5 seconds' };
        case 'shutdown': await run('shutdown.exe', ['/s', '/t', '5']); return { message: 'Shutdown scheduled in 5 seconds' };
        case 'sleep': await run('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0']); return { message: 'Sleep requested' };
        case 'screenshot': return captureScreen();
        case 'webcam': return captureWebcam();
        // Never bypass the Windows sign-in boundary over the network.
        case 'unlock': throw new Error('Remote unlock is not supported. Sign in locally to unlock Windows.');
        default: throw new Error(`Unsupported command: ${command.type}`);
    }
}

async function fetchWithFallback(path, options = {}) {
    try {
        const response = await fetch(`${activeUrl}${path}`, options);
        return response;
    } catch (err) {
        // Primary failed; switch to backup only if one is explicitly configured.
        if (BACKUP_URL && activeUrl === SERVER_URL) {
            console.log(`Primary server failed, switching to backup: ${BACKUP_URL}`);
            activeUrl = BACKUP_URL;
            const response = await fetch(`${activeUrl}${path}`, options);
            return response;
        }
        throw err;
    }
}

async function createPairingSession() {
    const response = await fetchWithFallback('/pair/desktop/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getDeviceDetails()) });
    if (!response.ok) throw new Error((await response.json()).error?.message || 'Could not create pairing session');
    const session = await response.json();
    agent = { ...agent, ...session, pairCodeExpiresAt: session.expiresAt, connected: false };
    persistAgent(agent);
    notify(agent);
}

async function refreshPairCode() {
    if (backendQuotaBlocked) {
        throw new Error('Backend quota exceeded while refreshing pairing code. Please try again later.');
    }
    const response = await fetchWithFallback('/pair/desktop/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agent.agentToken}` },
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error?.message || data.error || 'Could not refresh pairing code';
        console.error('refreshPairCode failed:', { status: response.status, message, data });
        const err = new Error(message);
        err.status = response.status;
        if (data.error?.code) err.code = data.error.code;
        if (isDeviceNotFoundError(err)) throw err;
        if (isRateLimitError(err)) throw err;
        if (isQuotaExceededError(err)) backendQuotaBlocked = true;
        throw err;
    }
    backendQuotaBlocked = false; // Reset if it succeeds
    const session = await response.json();
    agent = { ...agent, paired: session.paired, owners: session.owners || [], pairCode: session.pairCode, pairCodeExpiresAt: session.expiresAt };
    persistAgent(agent);
    notify(agent);
}

async function syncPairingStatus() {
    if (!agent.deviceId || !agent.agentToken || agent.paired) return;
    const response = await fetchWithFallback('/pair/desktop/status', {
        headers: { Authorization: `Bearer ${agent.agentToken}` },
    });
    if (!response.ok) return;
    const status = await response.json();
    if (status.paired) {
        agent = { ...agent, paired: true, owners: status.owners || [] };
        persistAgent(agent);
        notify(agent);
    }
}

async function ensurePairingCode() {
    if (backendQuotaBlocked) {
        throw new Error('Backend quota exceeded while refreshing pairing code. Please try again later.');
    }
    const expiresAt = agent.pairCodeExpiresAt ? Date.parse(agent.pairCodeExpiresAt) : 0;
    if (agent.pairCode && expiresAt > Date.now() + 5000) return;
    if (agent.deviceId && agent.agentToken) {
        try {
            await refreshPairCode();
            return;
        } catch (error) {
            // Network failures must never replace an existing paired device
            // with a brand-new unpaired session. Keep retrying the saved
            // identity so the phone and desktop continue to refer to the
            // same deviceId.
            if (isDeviceNotFoundError(error)) {
                // The server lost track of this device (its device store is
                // in-memory and resets on restart). Forget the stale identity
                // and start a brand-new session so the UI recovers on its own.
                // startAgent establishes the socket afterward.
                await recoverFromWipedDevice({ connect: false });
                return;
            }
            if (isQuotaExceededError(error)) {
                throw new Error(`Backend quota exceeded while refreshing pairing code. Please try again later.`);
            }
            throw error;
        }
    }
    await createPairingSession();
}

async function unpairDesktop() {
    if (!agent.deviceId || !agent.agentToken) return;
    try {
        const response = await fetchWithFallback('/pair/desktop/unpair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${agent.agentToken}` },
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error?.message || data.error || 'Failed to unpair');
        }
        agent = {
            ...agent,
            paired: false,
            owners: [],
            pairCode: null,
            pairCodeExpiresAt: null,
            connected: false,
        };
        persistAgent(agent);
        notify(agent);
        backendQuotaBlocked = false;
        await refreshPairCode();
    } catch (err) {
        console.error('Unpair failed:', err);
    }
}

async function startAgent(regenerate = false) {
    const saved = regenerate ? null : loadConfig();
    if (saved) agent = { ...agent, ...saved };
    if (regenerate && agent.deviceId && agent.agentToken) await refreshPairCode();
    else if (regenerate) await createPairingSession();
    else await ensurePairingCode();

    clearInterval(heartbeatTimer);
    clearInterval(pairingStatusTimer);
    connectSocket();
}

// The backend's device store is in-memory and resets on restart. When the
// server no longer recognizes this device (HTTP DEVICE_NOT_FOUND or a socket
// identify that says the device isn't registered), forget the stale identity,
// create a brand-new pairing session, and reconnect with the fresh token.
// `connect` is passed false when recovery runs from inside startAgent, which
// establishes its own socket afterward.
async function recoverFromWipedDevice({ connect = true } = {}) {
    console.warn('Device no longer exists on the backend; starting a fresh session.');
    agent = {
        ...agent,
        deviceId: null,
        agentToken: null,
        pairCode: null,
        pairCodeExpiresAt: null,
        paired: false,
        owners: [],
        connected: false,
    };
    persistAgent(agent);
    await createPairingSession();
    if (connect) connectSocket();
    notify(agent);
}

// Build the realtime connection to the backend as a desktop agent.
function connectSocket() {
    if (agent.socket) { try { agent.socket.disconnect(); } catch { } }
    let disconnectTimer = null;

    const socket = io(SERVER_URL, {
        auth: { agentToken: agent.agentToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 30000,
    });
    agent.socket = socket;

    socket.on('connect', () => {
        // Cancel any pending disconnect — the socket recovered.
        if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }

        // Identify this desktop to the backend (marks it online + joins owner rooms).
        socket.emit('device:identify', { deviceId: agent.deviceId }, (ack) => {
            // If the backend wiped this device, recover by starting fresh.
            if (ack && ack.ok === false && isDeviceNotFoundError({ message: ack.error })) {
                recoverFromWipedDevice().catch((error) => console.error('Device recovery failed:', error.message));
            }
        });
        agent.connected = true;
        notify(agent);

        // Clear any lingering timers before restarting to avoid duplicates.
        clearInterval(heartbeatTimer);
        clearInterval(pairingStatusTimer);

        // Heartbeat every 15s to keep the socket active.
        heartbeatTimer = setInterval(() => {
            socket.emit('device:heartbeat');
        }, 15000);

        // Poll pairing status as a reliable fallback until the device is paired.
        pairingStatusTimer = setInterval(() => {
            syncPairingStatus().catch((error) => console.warn('Pairing status check failed:', error.message));
        }, 4000);
        syncPairingStatus().catch(() => {});
    });

    socket.on('command:receive', async (command) => {
        try {
            const result = await executeCommand(command);
            socket.emit('command:acknowledge', { commandId: command.id, status: 'completed', result });
        } catch (error) {
            socket.emit('command:acknowledge', { commandId: command.id, status: 'failed', result: { message: error.message } });
        }
    });

    socket.on('device:paired', () => refreshPairCode().catch((error) => console.warn('Skipping pairing code refresh:', error.message)));
    socket.on('device:unpaired', () => refreshPairCode().catch((error) => console.warn('Skipping pairing code refresh:', error.message)));

    socket.on('disconnect', () => {
        // Debounce: wait 3s before marking offline. Socket.io auto-reconnects
        // with a 2s delay, so brief disconnects (network blip, WS hiccup) are
        // absorbed without flashing "Paired (Offline)" in the UI.
        disconnectTimer = setTimeout(() => {
            disconnectTimer = null;
            agent.connected = false;
            clearInterval(heartbeatTimer);
            clearInterval(pairingStatusTimer);
            notify(agent);
        }, 3000);
        // socket.io auto-reconnects; 'connect' fires again when restored.
    });

    socket.on('connect_error', (error) => {
        notify({ ...agent, connected: false, error: error.message });
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 960, height: 620, minWidth: 800, minHeight: 560, frame: false, transparent: false, backgroundColor: '#08080f',
        webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
        icon: path.join(__dirname, 'assets', 'icon.png'), show: false, titleBarStyle: 'hidden',
    });
    mainWindow.loadFile('renderer/index.html');
    mainWindow.once('ready-to-show', () => {
        if (!process.argv.includes('--background-agent')) mainWindow.show();
    });
    mainWindow.on('close', (event) => {
        if (isQuitting) return;
        event.preventDefault();
        mainWindow.hide();
    });
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
    ipcMain.on('window-close', () => mainWindow.close());
}

app.whenReady().then(async () => {
    // Automatically approve media permissions for webcam and screen capture
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') { callback(true); } else { callback(false); }
    });
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        if (permission === 'media') { return true; }
        return false;
    });

    // A deployed app starts this background agent at Windows sign-in. Keep this
    // disabled for `electron .` development sessions, where the executable is
    // not a stable installed path.
    if (process.platform === 'win32' && app.isPackaged) {
        app.setLoginItemSettings({ openAtLogin: true, args: ['--background-agent'] });
    }
    createWindow();
    createTray();
    const startWithRetry = async () => {
        try {
            await startAgent();
        } catch (error) {
            console.error('startAgent startup error:', error);
            notify({ ...agent, connected: false, error: error.message });
            let retryDelay = 5000;
            if (isRateLimitError(error)) {
                retryDelay = 60000; // Rate limit: back off 60s (limit is 30 req / 15 min)
                console.warn('Rate limited by backend. Retrying in 60 seconds...');
            } else if (isQuotaExceededError(error)) {
                backendQuotaBlocked = true;
                retryDelay = 30000;
                console.warn('Backend quota exhausted. Retrying in 30 seconds...');
            }
            setTimeout(() => { if (!isQuitting) startWithRetry(); }, retryDelay);
        }
    };
    startWithRetry();
});
ipcMain.handle('agent-status', () => publicAgentStatus());
ipcMain.handle('agent-unpair', async () => { await unpairDesktop(); return publicAgentStatus(); });
ipcMain.handle('agent-regenerate', async () => {
    try {
        // Clear the quota block flag on manual request so it retries immediately
        backendQuotaBlocked = false;
        if (agent.deviceId && agent.agentToken) {
            try {
                await refreshPairCode();
            } catch (error) {
                if (isDeviceNotFoundError(error)) await recoverFromWipedDevice();
                else throw error;
            }
        } else await startAgent();
        return publicAgentStatus();
    } catch (error) {
        return publicAgentStatus({ ...agent, error: error.message });
    }
});
app.on('before-quit', () => { isQuitting = true; });
app.on('window-all-closed', (event) => event.preventDefault());
app.on('activate', () => showWindow());

// Clipboard IPC: navigator.clipboard is unavailable on file:// in the renderer,
// so the preload calls this handler which uses Electron's full clipboard module.
ipcMain.handle('clipboard-copy', (_event, text) => {
    if (typeof text === 'string' && text.length > 0) {
        const { clipboard } = require('electron');
        clipboard.writeText(text);
        return true;
    }
    return false;
});
