/**
 * ProPresenter AI Studio - Electron Preload Script
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openAudienceWindow: () => ipcRenderer.send('open-audience-window'),
  openStageWindow: () => ipcRenderer.send('open-stage-window'),
  selectMediaFiles: () => ipcRenderer.invoke('select-media-files'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  sendBroadcast: (state) => ipcRenderer.send('broadcast-update', state),
  onBroadcastUpdate: (callback) => ipcRenderer.on('broadcast-update', (event, state) => callback(state))
});
