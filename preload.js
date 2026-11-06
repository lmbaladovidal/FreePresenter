/**
 * ProPresenter AI Studio - Electron Preload Script
 */
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPathForFile: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (e) {}
    return file?.path || '';
  },
  openAudienceWindow: () => ipcRenderer.send('open-audience-window'),
  openStageWindow: () => ipcRenderer.send('open-stage-window'),
  focusMainWindow: () => ipcRenderer.send('focus-main-window'),
  selectMediaFiles: () => ipcRenderer.invoke('select-media-files'),
  selectPhysicalFolder: () => ipcRenderer.invoke('select-physical-folder'),
  syncPhysicalFolders: (folderPaths) => ipcRenderer.invoke('sync-physical-folders', folderPaths),
  unwatchPhysicalFolder: (folderPath) => ipcRenderer.invoke('unwatch-physical-folder', folderPath),
  onPhysicalFolderUpdated: (callback) => ipcRenderer.on('physical-folder-updated', (event, payload) => callback(payload)),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  sendBroadcast: (state) => ipcRenderer.send('broadcast-update', state),
  onBroadcastUpdate: (callback) => ipcRenderer.on('broadcast-update', (event, state) => callback(state)),
  isAudienceOpen: () => ipcRenderer.invoke('is-audience-open'),
  onAudienceStatusChanged: (callback) => ipcRenderer.on('audience-status-changed', (event, isOpen) => callback(isOpen))
});

