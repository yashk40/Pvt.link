const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    getAgentStatus: () => ipcRenderer.invoke('agent-status'),
    regeneratePairCode: () => ipcRenderer.invoke('agent-regenerate'),
    unpair: () => ipcRenderer.invoke('agent-unpair'),
    onAgentStatus: (callback) => ipcRenderer.on('agent-status', (_event, data) => callback(data)),
    // navigator.clipboard is unavailable on file:// protocol in Electron.
    // Delegate to the main process where the full Electron clipboard API works.
    copyText: (text) => ipcRenderer.invoke('clipboard-copy', text),
});
