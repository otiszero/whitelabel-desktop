"use strict";
/**
 * IPC Handlers - Handle all IPC messages from renderer process
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const network_blocker_1 = require("./network-blocker");
const keystore_service_1 = require("./keystore-service");
const signer_service_1 = require("./signer-service");
function registerIpcHandlers() {
    // ==================== Keystore Handlers ====================
    electron_1.ipcMain.handle('keystore:create', async (_event, password, mnemonic) => {
        return (0, keystore_service_1.createNewKeystore)(password, mnemonic);
    });
    electron_1.ipcMain.handle('keystore:unlock', async (_event, password) => {
        return (0, keystore_service_1.unlockKeystore)(password);
    });
    electron_1.ipcMain.handle('keystore:lock', async () => {
        (0, keystore_service_1.lockKeystore)();
    });
    electron_1.ipcMain.handle('keystore:isUnlocked', async () => {
        return (0, keystore_service_1.isUnlocked)();
    });
    electron_1.ipcMain.handle('keystore:exists', async () => {
        return (0, keystore_service_1.keystoreExists)();
    });
    electron_1.ipcMain.handle('keystore:getWallets', async () => {
        return (0, keystore_service_1.getWallets)();
    });
    electron_1.ipcMain.handle('keystore:createWallet', async (_event, chain, name, password) => {
        return (0, keystore_service_1.createWallet)(chain, name, password);
    });
    electron_1.ipcMain.handle('keystore:deleteWallet', async (_event, walletId, password) => {
        return (0, keystore_service_1.deleteWallet)(walletId, password);
    });
    // ==================== Signing Handlers ====================
    electron_1.ipcMain.handle('signing:signTransaction', async (_event, chain, walletId, txData) => {
        return (0, signer_service_1.signTransaction)(chain, walletId, txData);
    });
    electron_1.ipcMain.handle('signing:btc', async (_event, walletId, input, testnet) => {
        return (0, signer_service_1.signBtc)(walletId, input, testnet);
    });
    electron_1.ipcMain.handle('signing:eth', async (_event, walletId, input) => {
        return (0, signer_service_1.signEth)(walletId, input);
    });
    electron_1.ipcMain.handle('signing:xrp', async (_event, walletId, input) => {
        return (0, signer_service_1.signXrp)(walletId, input);
    });
    electron_1.ipcMain.handle('signing:tron', async (_event, walletId, input) => {
        return (0, signer_service_1.signTron)(walletId, input);
    });
    electron_1.ipcMain.handle('signing:getAddress', async (_event, walletId) => {
        return (0, keystore_service_1.getAddress)(walletId);
    });
    // ==================== Address Book Handlers ====================
    electron_1.ipcMain.handle('addressBook:getAll', async () => {
        // TODO: Implement in Phase 5
        return [];
    });
    electron_1.ipcMain.handle('addressBook:add', async (_event, entry) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] addressBook:add called:', entry);
        return { id: crypto.randomUUID(), ...entry };
    });
    electron_1.ipcMain.handle('addressBook:update', async (_event, id, entry) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] addressBook:update called:', { id, entry });
        return { id, ...entry };
    });
    electron_1.ipcMain.handle('addressBook:delete', async (_event, id) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] addressBook:delete called:', id);
    });
    // ==================== History Handlers ====================
    electron_1.ipcMain.handle('history:getAll', async () => {
        // TODO: Implement in Phase 5
        return [];
    });
    electron_1.ipcMain.handle('history:add', async (_event, record) => {
        // TODO: Implement in Phase 5
        console.log('[IPC] history:add called:', record);
        return { id: crypto.randomUUID(), ...record };
    });
    // ==================== Settings Handlers ====================
    electron_1.ipcMain.handle('settings:get', async (_event, key) => {
        // TODO: Implement persistent settings
        console.log('[IPC] settings:get called:', key);
        return null;
    });
    electron_1.ipcMain.handle('settings:set', async (_event, key, value) => {
        // TODO: Implement persistent settings
        console.log('[IPC] settings:set called:', { key, value });
    });
    // ==================== Security Handlers ====================
    electron_1.ipcMain.handle('security:getBlockedRequests', async () => {
        return (0, network_blocker_1.getBlockedRequests)();
    });
}
