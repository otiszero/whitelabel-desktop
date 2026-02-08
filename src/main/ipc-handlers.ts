/**
 * IPC Handlers - Handle all IPC messages from renderer process
 */

import { ipcMain } from 'electron';
import { getBlockedRequests } from './network-blocker.js';
import {
  createNewKeystore,
  unlockKeystore,
  lockKeystore,
  isUnlocked,
  getWallets,
  deleteWallet,
  getAddress,
  keystoreExists,
  createWallet,
} from './keystore-service.js';
import { signTransaction, signBtc, signEth, signXrp, signTron } from './signer-service.js';
import { ChainType } from '../crypto/types.js';

export function registerIpcHandlers(): void {
  // ==================== Keystore Handlers ====================
  ipcMain.handle('keystore:create', async (_event, password: string, mnemonic?: string) => {
    return createNewKeystore(password, mnemonic);
  });

  ipcMain.handle('keystore:unlock', async (_event, password: string) => {
    return unlockKeystore(password);
  });

  ipcMain.handle('keystore:lock', async () => {
    lockKeystore();
  });

  ipcMain.handle('keystore:isUnlocked', async () => {
    return isUnlocked();
  });

  ipcMain.handle('keystore:exists', async () => {
    return keystoreExists();
  });

  ipcMain.handle('keystore:getWallets', async () => {
    return getWallets();
  });

  ipcMain.handle('keystore:createWallet', async (
    _event,
    chain: ChainType,
    name: string,
    password: string
  ) => {
    return createWallet(chain, name, password);
  });

  ipcMain.handle('keystore:deleteWallet', async (_event, walletId: string, password: string) => {
    return deleteWallet(walletId, password);
  });

  // ==================== Signing Handlers ====================
  ipcMain.handle('signing:signTransaction', async (
    _event,
    chain: ChainType,
    walletId: string,
    txData: unknown
  ) => {
    return signTransaction(chain, walletId, txData);
  });

  ipcMain.handle('signing:btc', async (_event, walletId: string, input: unknown, testnet?: boolean) => {
    return signBtc(walletId, input as Parameters<typeof signBtc>[1], testnet);
  });

  ipcMain.handle('signing:eth', async (_event, walletId: string, input: unknown) => {
    return signEth(walletId, input as Parameters<typeof signEth>[1]);
  });

  ipcMain.handle('signing:xrp', async (_event, walletId: string, input: unknown) => {
    return signXrp(walletId, input as Parameters<typeof signXrp>[1]);
  });

  ipcMain.handle('signing:tron', async (_event, walletId: string, input: unknown) => {
    return signTron(walletId, input as Parameters<typeof signTron>[1]);
  });

  ipcMain.handle('signing:getAddress', async (_event, walletId: string) => {
    return getAddress(walletId);
  });

  // ==================== Address Book Handlers ====================
  ipcMain.handle('addressBook:getAll', async () => {
    // TODO: Implement in Phase 5
    return [];
  });

  ipcMain.handle('addressBook:add', async (_event, entry: unknown) => {
    // TODO: Implement in Phase 5
    console.log('[IPC] addressBook:add called:', entry);
    return { id: crypto.randomUUID(), ...entry as object };
  });

  ipcMain.handle('addressBook:update', async (_event, id: string, entry: unknown) => {
    // TODO: Implement in Phase 5
    console.log('[IPC] addressBook:update called:', { id, entry });
    return { id, ...entry as object };
  });

  ipcMain.handle('addressBook:delete', async (_event, id: string) => {
    // TODO: Implement in Phase 5
    console.log('[IPC] addressBook:delete called:', id);
  });

  // ==================== History Handlers ====================
  ipcMain.handle('history:getAll', async () => {
    // TODO: Implement in Phase 5
    return [];
  });

  ipcMain.handle('history:add', async (_event, record: unknown) => {
    // TODO: Implement in Phase 5
    console.log('[IPC] history:add called:', record);
    return { id: crypto.randomUUID(), ...record as object };
  });

  // ==================== Settings Handlers ====================
  ipcMain.handle('settings:get', async (_event, key: string) => {
    // TODO: Implement persistent settings
    console.log('[IPC] settings:get called:', key);
    return null;
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: unknown) => {
    // TODO: Implement persistent settings
    console.log('[IPC] settings:set called:', { key, value });
  });

  // ==================== Security Handlers ====================
  ipcMain.handle('security:getBlockedRequests', async () => {
    return getBlockedRequests();
  });
}
