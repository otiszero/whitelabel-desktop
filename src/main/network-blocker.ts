/**
 * Network Blocker - Core security feature for air-gapped operation
 * Blocks ALL HTTP, HTTPS, and WebSocket requests at session level
 */

import { Session, app } from 'electron';

const ALLOWED_PROTOCOLS = ['file:', 'data:', 'blob:'];
const DEV_ALLOWED_ORIGINS = ['http://localhost:5173', 'ws://localhost:5173'];

interface BlockedRequest {
  url: string;
  timestamp: number;
}

// Keep last 100 blocked requests for debugging
const blockedRequests: BlockedRequest[] = [];

/**
 * Block all network requests except local file access
 * In dev mode, allows Vite dev server connections only
 */
export function blockAllNetworkRequests(session: Session): void {
  const isDev = !app.isPackaged;

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
    if (blockedRequests.length > 100) blockedRequests.shift();

    callback({ cancel: true });
  });
}

/**
 * Apply additional command-line security flags
 */
export function applySecurityFlags(): void {
  // Disable Chromium background networking
  app.commandLine.appendSwitch('disable-background-networking');
  app.commandLine.appendSwitch('disable-component-update');
  app.commandLine.appendSwitch('disable-domain-reliability');
  app.commandLine.appendSwitch('disable-sync');

  // Disable crash reporter network calls
  app.commandLine.appendSwitch('disable-breakpad');
}

/**
 * Get list of recently blocked requests (for debugging)
 */
export function getBlockedRequests(): BlockedRequest[] {
  return [...blockedRequests];
}
