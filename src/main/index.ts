/**
 * Electron Main Process Entry Point
 * Air-gapped wallet with complete network isolation
 */

import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { blockAllNetworkRequests, applySecurityFlags } from './network-blocker.js';
import { registerIpcHandlers } from './ipc-handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Apply security flags before app is ready
applySecurityFlags();

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'AirGap Wallet',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false,
  });

  // Show window when ready to avoid visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Block all network requests
  blockAllNetworkRequests(session.defaultSession);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowedOrigins = ['http://localhost:5173', 'file://'];
    if (!allowedOrigins.some(origin => url.startsWith(origin))) {
      console.warn(`[AIRGAP] Blocked navigation to: ${url}`);
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
