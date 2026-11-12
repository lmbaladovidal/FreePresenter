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
  onPhysicalFolderUpdated: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('physical-folder-updated', handler);
    return () => ipcRenderer.removeListener('physical-folder-updated', handler);
  },
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  sendBroadcast: (state) => ipcRenderer.send('broadcast-update', state),
  onBroadcastUpdate: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('broadcast-update', handler);
    return () => ipcRenderer.removeListener('broadcast-update', handler);
  },
  isAudienceOpen: () => ipcRenderer.invoke('is-audience-open'),
  onAudienceStatusChanged: (callback) => {
    const handler = (_event, isOpen) => callback(isOpen);
    ipcRenderer.on('audience-status-changed', handler);
    return () => ipcRenderer.removeListener('audience-status-changed', handler);
  },
  // Importación de Presentaciones (PPTX / PPT / PPSX / ODP / PDF)
  selectPresentationFile: () => ipcRenderer.invoke('select-presentation-file'),
  getPresentationEngines: () => ipcRenderer.invoke('get-presentation-engines'),
  importPresentationFile: (filePath) => ipcRenderer.invoke('import-presentation-file', filePath),
  savePresentationSlideImage: (assetId, index, data) => ipcRenderer.invoke('save-presentation-slide-image', { assetId, index, data }),
  cancelPresentationImport: () => ipcRenderer.invoke('cancel-presentation-import'),
  deletePresentationAssets: (assetId) => ipcRenderer.invoke('delete-presentation-assets', assetId),
  onPresentationImportProgress: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('presentation-import-progress', handler);
    return () => ipcRenderer.removeListener('presentation-import-progress', handler);
  }
});

