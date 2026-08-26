/**
 * ProPresenter AI Studio - Electron Main Process
 * Manages Native Windows, Multi-Monitor Projections & Desktop IPC
 */
const { app, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');

// Optimize Chromium GPU Hardware Acceleration & Video Decoding Performance
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-accelerated-video-decode');

let mainWindow = null;
let audienceWindow = null;
let stageWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DEV_PORT = process.env.PORT || 3001;
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

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
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
    audienceWindow.loadURL(`${DEV_URL}/audience.html`);
  } else {
    audienceWindow.loadFile(path.join(__dirname, 'dist/audience.html'));
  }

  audienceWindow.on('closed', () => {
    audienceWindow = null;
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
    stageWindow.loadURL(`${DEV_URL}/stage.html`);
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
