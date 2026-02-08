"use strict";
/**
 * Electron Main Process Entry Point
 * Air-gapped wallet with complete network isolation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const network_blocker_1 = require("./network-blocker");
const ipc_handlers_1 = require("./ipc-handlers");
// Apply security flags before app is ready
(0, network_blocker_1.applySecurityFlags)();
let mainWindow = null;
function createWindow() {
    const isDev = !electron_1.app.isPackaged;
    mainWindow = new electron_1.BrowserWindow({
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
    (0, network_blocker_1.blockAllNetworkRequests)(electron_1.session.defaultSession);
    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Prevent multiple instances
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
}
electron_1.app.whenReady().then(() => {
    (0, ipc_handlers_1.registerIpcHandlers)();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Security: Prevent navigation to external URLs
electron_1.app.on('web-contents-created', (_event, contents) => {
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
