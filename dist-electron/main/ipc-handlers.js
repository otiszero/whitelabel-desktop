/**
 * IPC Handlers - Handle all IPC messages from renderer process
 */
import { ipcMain } from 'electron';
import { getBlockedRequests } from './network-blocker.js';
import { createNewKeystore, unlockKeystore, lockKeystore, isUnlocked, getWallets, deleteWallet, getAddress, keystoreExists, createWallet, } from './keystore-service.js';
import { signTransaction, signBtc, signEth, signXrp, signTron } from './signer-service.js';
export function registerIpcHandlers() {
    // ==================== Keystore Handlers ====================
    ipcMain.handle('keystore:create', async (_event, password, mnemonic) => {
        return createNewKeystore(password, mnemonic);
    });
    ipcMain.handle('keystore:unlock', async (_event, password) => {
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
    ipcMain.handle('keystore:createWallet', async (_event, chain, name, password) => {
        return createWallet(chain, name, password);
    });
    ipcMain.handle('keystore:deleteWallet', async (_event, walletId, password) => {
        return deleteWallet(walletId, password);
    });
    // ==================== Signing Handlers ====================
    ipcMain.handle('signing:signTransaction', async (_event, chain, walletId, txData) => {
        return signTransaction(chain, walletId, txData);
    });
    ipcMain.handle('signing:btc', async (_event, walletId, input, testnet) => {
        return signBtc(walletId, input, testnet);
    });
    ipcMain.handle('signing:eth', async (_event, walletId, input) => {
        return signEth(walletId, input);
    });
    ipcMain.handle('signing:xrp', async (_event, walletId, input) => {
        return signXrp(walletId, input);
    });
    ipcMain.handle('signing:tron', async (_event, walletId, input) => {
        return signTron(walletId, input);
    });
    ipcMain.handle('signing:getAddress', async (_event, walletId) => {
        return getAddress(walletId);
    });
    // ==================== Address Book Handlers ====================
    ipcMain.handle('addressBook:getAll', async () => {
        // TODO: Implement in Phase 5
        return [];
    });
    ipcMain.handle('addressBook:add', async (_event, entry) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] addressBook:add called:', entry);
        return { id: crypto.randomUUID(), ...entry };
    });
    ipcMain.handle('addressBook:update', async (_event, id, entry) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] addressBook:update called:', { id, entry });
        return { id, ...entry };
    });
    ipcMain.handle('addressBook:delete', async (_event, id) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] addressBook:delete called:', id);
    });
    // ==================== History Handlers ====================
    ipcMain.handle('history:getAll', async () => {
        // TODO: Implement in Phase 5
        return [];
    });
    ipcMain.handle('history:add', async (_event, record) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] history:add called:', record);
        return { id: crypto.randomUUID(), ...record };
    });
    // ==================== Settings Handlers ====================
    ipcMain.handle('settings:get', async (_event, key) => {
        // TODO: Implement persistent settings
        console.log('[IPC] settings:get called:', key);
        return null;
    });
    ipcMain.handle('settings:set', async (_event, key, value) => {
        // TODO: Implement persistent settings
        console.log('[IPC] settings:set called:', { key, value });
    });
    // ==================== Security Handlers ====================
    ipcMain.handle('security:getBlockedRequests', async () => {
        return getBlockedRequests();
    });
}
