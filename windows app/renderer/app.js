/* ─── Frameless Window Control IPCs ──────────────────────────────── */
document.getElementById('btn-min').addEventListener('click', () => window.electronAPI?.minimize());
document.getElementById('btn-max').addEventListener('click', () => window.electronAPI?.maximize());
document.getElementById('btn-close').addEventListener('click', () => window.electronAPI?.close());

/* ─── State & Modal ──────────────────────────────────────────────── */
const pairingModal = document.getElementById('pairing-modal');
const pairingBtn = document.getElementById('pairing-btn');
const modalClose = document.getElementById('modal-close');
const modalCopy = document.getElementById('modal-copy');
const modalRegen = document.getElementById('modal-regen');
const pairingCode = document.getElementById('pairing-code');
const countdownText = document.getElementById('qr-timer');
const unpairBtn = document.getElementById('unpair-all-btn');
// New inline code display elements
const qrCodeInline = document.getElementById('qr-code-inline');
const qrCodeInlineValue = document.getElementById('qr-code-inline-value');
const qrCodeCopyBtn = document.getElementById('qr-code-copy-btn');
const qrTimerInline = document.getElementById('qr-timer-inline');

if (unpairBtn) {
    unpairBtn.addEventListener('click', () => {
        unpairBtn.textContent = 'Unpairing...';
        unpairBtn.disabled = true;
        window.electronAPI?.unpair()
            .then((status) => {
                renderAgentStatus(status);
            })
            .catch((error) => {
                console.error('Unpair failed:', error);
            })
            .finally(() => {
                unpairBtn.textContent = 'Unpair All';
                unpairBtn.disabled = false;
                window.electronAPI?.getAgentStatus().then(renderAgentStatus).catch(() => {});
            });
    });
}

function renderAgentStatus(status) {
    const running = document.querySelector('.status-running');
    const qrTitle = document.querySelector('.qr-card-title');
    const qrDesc = document.querySelector('.qr-card-desc');

    // Handle paired accounts list
    const pairedSection = document.getElementById('paired-accounts-section');
    const pairedList = document.getElementById('paired-accounts-list');

    if (status?.owners && status.owners.length > 0) {
        if (pairedSection) pairedSection.style.display = 'block';
        if (pairedList) {
            pairedList.innerHTML = status.owners.map(owner => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span style="font-size: 0.75rem; color: #e4e4e7;">${owner.email}</span>
                    </div>
                </div>
            `).join('');
        }
    } else {
        if (pairedSection) pairedSection.style.display = 'none';
        if (pairedList) pairedList.innerHTML = '';
    }

    const isPaired = Boolean(status?.paired);
    const qrWrapper = document.querySelector('.qr-wrapper');

    // A pairing code is only useful until the first account has paired.
    if (qrWrapper) qrWrapper.style.display = isPaired ? 'none' : '';
    if (qrCodeInline) qrCodeInline.style.display = isPaired ? 'none' : '';
    if (isPaired) pairingModal?.classList.add('hidden');

    // Update pairing code text UI (both modal and inline)
    if (pairingCode) {
        pairingCode.textContent = status?.pairCode || 'Loading...';
        pairingCode.dataset.ready = status?.pairCode ? 'true' : 'false';
    }
    if (qrCodeInlineValue) {
        qrCodeInlineValue.textContent = status?.pairCode || '—';
    }
    if (modalCopy) modalCopy.disabled = !status?.pairCode;
    if (qrCodeCopyBtn) qrCodeCopyBtn.disabled = !status?.pairCode;
    if (pairingBtn) {
        pairingBtn.disabled = !status?.pairCode || isPaired;
        pairingBtn.textContent = 'Show Pairing Code';
        pairingBtn.style.backgroundColor = '';
        pairingBtn.style.display = isPaired ? 'none' : '';
    }
    if (!isPaired && status?.pairCodeExpiresAt) syncPairCodeTimer(status.pairCodeExpiresAt);
    else if (timerHandle) clearInterval(timerHandle);

    if (isPaired) {
        if (running) running.textContent = status?.connected ? 'Paired & Protected' : 'Paired (Offline)';
        if (qrTitle) qrTitle.textContent = 'Add another device?';
        if (qrDesc) qrDesc.innerHTML = 'This Windows PC is paired. Scan the<br />code to add another mobile app.';
    } else {
        if (running) running.textContent = status?.connected ? 'Connected' : (status?.error ? 'Connection issue' : 'Waiting for pairing');
        if (qrTitle) qrTitle.textContent = 'Connect Your Mobile Device';
        if (qrDesc) qrDesc.innerHTML = 'Scan the QR code using your mobile app<br />to pair with this device.';
    }

    // Render real QR code for the current pair code
    renderQRCode(status?.pairCode || null);

    if (status?.error) console.warn('Device agent:', status.error);
}

window.electronAPI?.getAgentStatus().then(renderAgentStatus);
window.electronAPI?.onAgentStatus(renderAgentStatus);

/* ─── Real QR Code Generator (uses qrcode.js from CDN) ──────────── */
let lastRenderedPairCode = null;
let qrInstance = null;

function renderQRCode(code) {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;

    // Don't re-render if code hasn't changed
    if (code === lastRenderedPairCode) return;
    lastRenderedPairCode = code;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!code) {
        // Loading placeholder
        ctx.fillStyle = '#27272a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#3f3f46';
        const cell = 26;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                ctx.fillRect(8 + i * cell, 8 + j * cell, cell - 4, cell - 4);
            }
        }
        return;
    }

    // Use qrcode.js if available (loaded from CDN in index.html)
    if (typeof QRCode !== 'undefined') {
        try {
            // QRCode.js needs a container element — use a hidden div
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
            document.body.appendChild(tempDiv);

            new QRCode(tempDiv, {
                text: code,
                width: canvas.width,
                height: canvas.height,
                colorDark: '#0f0f15',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M,
            });

            // Draw the generated QR into our canvas
            const qrCanvas = tempDiv.querySelector('canvas');
            const qrImg = tempDiv.querySelector('img');

            if (qrCanvas) {
                ctx.drawImage(qrCanvas, 0, 0, canvas.width, canvas.height);
                document.body.removeChild(tempDiv);
            } else if (qrImg) {
                const onLoad = () => {
                    ctx.drawImage(qrImg, 0, 0, canvas.width, canvas.height);
                    try { document.body.removeChild(tempDiv); } catch {}
                };
                if (qrImg.complete) { onLoad(); } else { qrImg.onload = onLoad; }
            } else {
                document.body.removeChild(tempDiv);
            }
        } catch (e) {
            console.warn('QR code generation failed:', e);
            drawOfflineFallback(ctx, canvas, code);
        }
    } else {
        // CDN not loaded (offline) — show code as text
        drawOfflineFallback(ctx, canvas, code);
    }
}

function drawOfflineFallback(ctx, canvas, code) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#14b8a6';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN UNAVAILABLE', canvas.width / 2, canvas.height / 2 - 14);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '11px monospace';
    ctx.fillText('Use code below:', canvas.width / 2, canvas.height / 2 + 6);
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(code, canvas.width / 2, canvas.height / 2 + 26);
}

// Initialize with loading placeholder
renderQRCode(null);

/* ─── Pairing Modal ──────────────────────────────────────────────── */
pairingBtn?.addEventListener('click', () => {
    pairingModal.classList.remove('hidden');
});

modalClose?.addEventListener('click', () => {
    pairingModal.classList.add('hidden');
});

pairingModal?.addEventListener('click', (e) => {
    if (e.target === pairingModal) {
        pairingModal.classList.add('hidden');
    }
});

modalCopy?.addEventListener('click', () => {
    if (!pairingCode?.dataset.ready) return;
    const text = pairingCode.textContent;
    // Electron's navigator.clipboard is unavailable on file:// — use the IPC
    // bridge that delegates to Electron's clipboard module in the main process.
    const done = (ok) => {
        if (!ok) return;
        const tempVal = modalCopy.textContent;
        modalCopy.textContent = 'Copied!';
        setTimeout(() => { modalCopy.textContent = tempVal; }, 1500);
    };
    if (window.electronAPI?.copyText) {
        window.electronAPI.copyText(text).then(done).catch(() => {});
    } else {
        // Fallback for non-Electron contexts (e.g. testing in a browser)
        navigator.clipboard?.writeText(text).then(() => done(true)).catch(() => {});
    }
});

/* ─── Inline Copy Button ──────────────────────────────────────── */
qrCodeCopyBtn?.addEventListener('click', () => {
    const text = qrCodeInlineValue?.textContent;
    if (!text || text === '—' || text === 'Loading...') return;
    const flash = () => {
        qrCodeInlineValue?.classList.add('flash');
        setTimeout(() => qrCodeInlineValue?.classList.remove('flash'), 600);
    };
    if (window.electronAPI?.copyText) {
        window.electronAPI.copyText(text).then((ok) => { if (ok) flash(); }).catch(() => {});
    } else {
        navigator.clipboard?.writeText(text).then(flash).catch(() => {});
    }
});

/* ─── Pair Code Countdown Timer ──────────────────────────────────── */
let timerHandle = null;
function syncPairCodeTimer(expiresAt) {
    if (timerHandle) clearInterval(timerHandle);
    const expiryMs = Date.parse(expiresAt);
    const updateTimeout = () => {
        const remaining = Math.max(0, Math.ceil((expiryMs - Date.now()) / 1000));
        const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
        const secs = (remaining % 60).toString().padStart(2, '0');
        const text = remaining <= 0 ? 'Expired' : `${mins}:${secs}`;
        if (countdownText) countdownText.textContent = text;
        if (qrTimerInline) qrTimerInline.textContent = text;
        if (remaining <= 0) {
            clearInterval(timerHandle);
            timerHandle = null;
            lastRenderedPairCode = null;
            renderQRCode(null);
        }
    };
    updateTimeout();
    timerHandle = setInterval(updateTimeout, 1000);
}

/* ─── Regenerate Pair Code ───────────────────────────────────────── */
modalRegen?.addEventListener('click', () => {
    modalRegen.disabled = true;
    window.electronAPI?.regeneratePairCode()
        .then(renderAgentStatus)
        .catch(console.warn)
        .finally(() => { modalRegen.disabled = false; });
});
