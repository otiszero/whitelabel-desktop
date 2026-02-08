"use strict";
/**
 * Network Blocker - Core security feature for air-gapped operation
 * Blocks ALL HTTP, HTTPS, and WebSocket requests at session level
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockAllNetworkRequests = blockAllNetworkRequests;
exports.applySecurityFlags = applySecurityFlags;
exports.getBlockedRequests = getBlockedRequests;
const electron_1 = require("electron");
const ALLOWED_PROTOCOLS = ['file:', 'data:', 'blob:'];
const DEV_ALLOWED_ORIGINS = ['http://localhost:5173', 'ws://localhost:5173'];
// Keep last 100 blocked requests for debugging
const blockedRequests = [];
/**
 * Block all network requests except local file access
 * In dev mode, allows Vite dev server connections only
 */
function blockAllNetworkRequests(session) {
    const isDev = !electron_1.app.isPackaged;
    session.webRequest.onBeforeRequest((details, callback) => {
        const { url } = details;
        // Always allow local protocols
        if (ALLOWED_PROTOCOLS.some(p => url.startsWith(p))) {
            callback({ cancel: false });
            return;
        }
        // In dev mode, allow Vite dev server only
        if (isDev && DEV_ALLOWED_ORIGINS.some(origin => url.startsWith(origin))) {
            callback({ cancel: false });
            return;
        }
        // Block everything else
        console.warn(`[AIRGAP] Network request blocked: ${url}`);
        blockedRequests.push({ url, timestamp: Date.now() });
        if (blockedRequests.length > 100)
            blockedRequests.shift();
        callback({ cancel: true });
    });
}
/**
 * Apply additional command-line security flags
 */
function applySecurityFlags() {
    // Disable Chromium background networking
    electron_1.app.commandLine.appendSwitch('disable-background-networking');
    electron_1.app.commandLine.appendSwitch('disable-component-update');
    electron_1.app.commandLine.appendSwitch('disable-domain-reliability');
    electron_1.app.commandLine.appendSwitch('disable-sync');
    // Disable crash reporter network calls
    electron_1.app.commandLine.appendSwitch('disable-breakpad');
}
/**
 * Get list of recently blocked requests (for debugging)
 */
function getBlockedRequests() {
    return [...blockedRequests];
}
