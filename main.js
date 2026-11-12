/**
 * ProPresenter AI Studio - Electron Main Process
 * Manages Native Windows, Multi-Monitor Projections & Desktop IPC
 */
const { app, BrowserWindow, ipcMain, dialog, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { PresentationImporter, SUPPORTED_EXTENSIONS } = require('./electron/presentation-importer');

let presentationImporter = null;
function getPresentationImporter() {
  if (!presentationImporter) {
    presentationImporter = new PresentationImporter({
      assetsRoot: path.join(app.getPath('userData'), 'presentations'),
      makeThumbnail: async (srcPath, destPath) => {
        try {
          const img = nativeImage.createFromPath(srcPath);
          if (img.isEmpty()) return false;
          const resized = img.resize({ width: 420 });
          await fs.promises.writeFile(destPath, resized.toJPEG(82));
          return true;
        } catch {
          return false;
        }
      }
    });
  }
  return presentationImporter;
}

// Optimize Chromium GPU Hardware Acceleration & Video Decoding Performance
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');


let mainWindow = null;
let audienceWindow = null;
let stageWindow = null;

const isDev = process.env.NODE_ENV === 'development' || (!app.isPackaged && process.env.NODE_ENV !== 'production');
const DEV_PORT = process.env.PORT || 3000;
const DEV_URL = `http://localhost:${DEV_PORT}`;

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1366, width),
    height: Math.min(768, height),
    minWidth: 1024,
    minHeight: 640,
    title: "ProPresenter AI Studio - Production Control",
    backgroundColor: '#0a0c10',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allows loading local file:// video paths directly
    }
  });

  mainWindow.maximize();

  let usingLocalDist = !isDev;

  if (isDev) {
    mainWindow.loadURL(DEV_URL).catch(() => {
      usingLocalDist = true;
      mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    for (const folderPath of physicalFolderWatchers.keys()) {
      unwatchPhysicalFolder(folderPath);
    }
    if (audienceWindow) audienceWindow.close();
    if (stageWindow) stageWindow.close();
  });
}

function openAudienceWindow() {
  if (audienceWindow && !audienceWindow.isDestroyed()) {
    audienceWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  // Target secondary display if available, otherwise display 1
  const secondaryDisplay = displays.find(d => d.id !== primaryDisplay.id) || displays[0];

  audienceWindow = new BrowserWindow({
    x: secondaryDisplay.bounds.x,
    y: secondaryDisplay.bounds.y,
    width: secondaryDisplay.bounds.width,
    height: secondaryDisplay.bounds.height,
    fullscreen: displays.length > 1, // Auto-fullscreen on secondary screen
    frame: false,
    autoHideMenuBar: true,
    title: "ProPresenter AI Studio - Salida Audiencia (OBS / Proyector)",
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  audienceWindow.maximize();

  if (isDev) {
    audienceWindow.loadURL(`${DEV_URL}/audience.html`).catch(() => {
      audienceWindow.loadFile(path.join(__dirname, 'dist/audience.html'));
    });
  } else {
    audienceWindow.loadFile(path.join(__dirname, 'dist/audience.html'));
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('audience-status-changed', true);
  }

  audienceWindow.on('closed', () => {
    audienceWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('audience-status-changed', false);
    }
  });
}


function openStageWindow() {
  if (stageWindow && !stageWindow.isDestroyed()) {
    stageWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  // Target display 3 if available, otherwise display 2 or 1
  const targetDisplay = displays[2] || displays[1] || displays[0];

  stageWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: displays.length > 2,
    frame: false,
    autoHideMenuBar: true,
    title: "ProPresenter AI Studio - Stage Display (Monitor Orador)",
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  if (isDev) {
    stageWindow.loadURL(`${DEV_URL}/stage.html`).catch(() => {
      stageWindow.loadFile(path.join(__dirname, 'dist/stage.html'));
    });
  } else {
    stageWindow.loadFile(path.join(__dirname, 'dist/stage.html'));
  }

  stageWindow.on('closed', () => {
    stageWindow = null;
  });
}

// Electron IPC Events Handling
ipcMain.on('open-audience-window', () => openAudienceWindow());
ipcMain.on('open-stage-window', () => openStageWindow());
ipcMain.handle('is-audience-open', () => !!(audienceWindow && !audienceWindow.isDestroyed()));

ipcMain.on('focus-main-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    mainWindow.webContents.focus();
  }
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => app.quit());

ipcMain.handle('get-displays', () => {
  return screen.getAllDisplays().map((d, index) => ({
    id: d.id,
    index: index + 1,
    bounds: d.bounds,
    isPrimary: d.id === screen.getPrimaryDisplay().id
  }));
});

// Native Windows File Selector Dialog
ipcMain.handle('select-media-files', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Seleccionar Archivos de Video o Imágenes",
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Archivos Multimedia', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav'] },
      { name: 'Todos los Archivos', extensions: ['*'] }
    ]
  });

  if (result.canceled) return [];
  return result.filePaths.map(filePath => {
    const name = path.basename(filePath);
    return {
      name,
      filePath,
      url: `file:///${filePath.replace(/\\/g, '/')}`
    };
  });
});

// Physical Disk Folders Real-Time Watching & Synchronization
const MEDIA_EXT_REGEX = /\.(mp4|webm|mov|avi|mkv|png|jpg|jpeg|gif|webp|svg|bmp)$/i;
const IMAGE_EXT_REGEX = /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i;
const physicalFolderWatchers = new Map();

async function scanPhysicalFolder(folderPath) {
  try {
    if (!folderPath) return [];
    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (entry.isFile() && MEDIA_EXT_REGEX.test(entry.name)) {
        const fullPath = path.join(folderPath, entry.name);
        const isImg = IMAGE_EXT_REGEX.test(entry.name);
        files.push({
          name: entry.name,
          filePath: fullPath,
          url: `file:///${fullPath.replace(/\\/g, '/')}`,
          type: isImg ? 'image/png' : 'video/mp4'
        });
      }
    }
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    return files;
  } catch (err) {
    console.warn('[PhysicalFolder] Error scanning folder:', folderPath, err.message);
    return [];
  }
}

function unwatchPhysicalFolder(folderPath) {
  const existing = physicalFolderWatchers.get(folderPath);
  if (existing) {
    if (existing.watcher) {
      try { existing.watcher.close(); } catch (e) { }
    }
    if (existing.debounceTimer) {
      clearTimeout(existing.debounceTimer);
    }
    if (existing.pollInterval) {
      clearInterval(existing.pollInterval);
    }
    physicalFolderWatchers.delete(folderPath);
  }
}

async function watchPhysicalFolder(folderPath) {
  if (!folderPath) return [];
  try {
    await fs.promises.access(folderPath);
  } catch {
    return [];
  }
  unwatchPhysicalFolder(folderPath);

  const folderName = path.basename(folderPath) || folderPath;
  let lastFilesSignature = '';
  let isScanning = false;

  const emitIfChanged = async (force = false) => {
    if (isScanning) return [];
    isScanning = true;
    try {
      const files = await scanPhysicalFolder(folderPath);
      const sig = files.map(f => f.name).join('|');
      if (force || sig !== lastFilesSignature) {
        lastFilesSignature = sig;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('physical-folder-updated', {
            path: folderPath,
            name: folderName,
            folderPath,
            folderName,
            files
          });
        }
      }
      return files;
    } finally {
      isScanning = false;
    }
  };

  const initialFiles = await scanPhysicalFolder(folderPath);
  lastFilesSignature = initialFiles.map(f => f.name).join('|');

  let watcher = null;
  const record = { watcher: null, debounceTimer: null, pollInterval: null };

  try {
    watcher = fs.watch(folderPath, { persistent: false }, () => {
      if (record.debounceTimer) clearTimeout(record.debounceTimer);
      record.debounceTimer = setTimeout(() => {
        emitIfChanged(false);
      }, 280);
    });
    watcher.on('error', () => { });
    record.watcher = watcher;
  } catch (e) {
    console.warn('[PhysicalFolder] fs.watch fallback to polling for:', folderPath);
  }

  // Lightweight polling backup so external drives / bulk copy operations never miss an update
  record.pollInterval = setInterval(() => {
    emitIfChanged(false);
  }, 3000);

  physicalFolderWatchers.set(folderPath, record);
  return initialFiles;
}

ipcMain.handle('select-physical-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Vincular Carpeta Física de Medios (Actualización en Tiempo Real)",
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const folderName = path.basename(folderPath) || folderPath;
  const files = await watchPhysicalFolder(folderPath);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    mainWindow.webContents.focus();
  }

  return {
    path: folderPath,
    name: folderName,
    folderPath,
    folderName,
    files
  };
});

ipcMain.handle('sync-physical-folders', async (event, folderPaths) => {
  if (!Array.isArray(folderPaths)) return [];
  const synced = [];
  for (const rawPath of folderPaths) {
    if (!rawPath || typeof rawPath !== 'string') continue;
    let exists = false;
    try {
      await fs.promises.access(rawPath);
      exists = true;
    } catch {
      exists = false;
    }
    const folderName = path.basename(rawPath) || rawPath;
    const files = exists ? await watchPhysicalFolder(rawPath) : [];
    synced.push({
      path: rawPath,
      name: folderName,
      folderPath: rawPath,
      folderName,
      exists,
      files
    });
  }
  return synced;
});

ipcMain.handle('unwatch-physical-folder', async (event, folderPath) => {
  if (folderPath) {
    unwatchPhysicalFolder(folderPath);
  }
  return true;
});

// =========================================================================
// IMPORTACIÓN NATIVA DE PRESENTACIONES (PPTX / PPT / PPSX / ODP / PDF)
// =========================================================================
ipcMain.handle('select-presentation-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Importar Presentación (PowerPoint / Impress / PDF)',
    properties: ['openFile'],
    filters: [
      { name: 'Presentaciones y PDF', extensions: SUPPORTED_EXTENSIONS },
      { name: 'PowerPoint / Impress', extensions: ['pptx', 'ppt', 'ppsx', 'pps', 'pptm', 'potx', 'odp'] },
      { name: 'Documento PDF', extensions: ['pdf'] }
    ]
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    mainWindow.webContents.focus();
  }

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  return {
    filePath,
    name: path.basename(filePath),
    title: path.basename(filePath, path.extname(filePath))
  };
});

ipcMain.handle('get-presentation-engines', async () => {
  try {
    return await getPresentationImporter().getEngines();
  } catch {
    return { powerpoint: false, libreoffice: false, pdf: true };
  }
});

ipcMain.handle('import-presentation-file', async (_event, filePath) => {
  try {
    const importer = getPresentationImporter();
    const res = await importer.importFile(filePath, {
      onProgress: (payload) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('presentation-import-progress', payload);
        }
      }
    });
    return { ok: true, ...res };
  } catch (err) {
    return {
      ok: false,
      code: err?.code || 'IMPORT_ERROR',
      error: err?.message || 'Error al importar la presentación.'
    };
  }
});

ipcMain.handle('save-presentation-slide-image', async (_event, { assetId, index, data } = {}) => {
  try {
    const saved = await getPresentationImporter().saveSlideImage(assetId, index, data);
    return { ok: true, ...saved };
  } catch (err) {
    return { ok: false, error: err?.message || 'No se pudo guardar la imagen de la diapositiva.' };
  }
});

ipcMain.handle('cancel-presentation-import', () => {
  try {
    return getPresentationImporter().cancel();
  } catch {
    return false;
  }
});

ipcMain.handle('delete-presentation-assets', async (_event, assetId) => {
  try {
    return await getPresentationImporter().deleteAssets(assetId);
  } catch {
    return false;
  }
});

// Real-Time High Performance Local IPC Broadcast Synchronization
ipcMain.on('broadcast-update', (event, state) => {
  if (audienceWindow && !audienceWindow.isDestroyed()) {
    audienceWindow.webContents.send('broadcast-update', state);
  }
  if (stageWindow && !stageWindow.isDestroyed()) {
    stageWindow.webContents.send('broadcast-update', state);
  }
});

app.whenReady().then(() => {
  createMainWindow();

  // Auto-launch Audience Window on secondary screen if multiple displays are connected
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  const hasSecondaryDisplay = displays.some(d => d.id !== primaryDisplay.id);

  if (hasSecondaryDisplay) {
    openAudienceWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
