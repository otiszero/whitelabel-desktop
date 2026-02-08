"use strict";
/**
 * Preload Script - Secure bridge between main and renderer processes
 * Exposes only safe IPC methods via contextBridge
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose the API to renderer process
const electronAPI = {
    keystore: {
        create: (password, mnemonic) => electron_1.ipcRenderer.invoke('keystore:create', password, mnemonic),
        unlock: (password) => electron_1.ipcRenderer.invoke('keystore:unlock', password),
        lock: () => electron_1.ipcRenderer.invoke('keystore:lock'),
        isUnlocked: () => electron_1.ipcRenderer.invoke('keystore:isUnlocked'),
        getWallets: () => electron_1.ipcRenderer.invoke('keystore:getWallets'),
        deleteWallet: (walletId) => electron_1.ipcRenderer.invoke('keystore:deleteWallet', walletId),
    },
    signing: {
        signTransaction: (chain, walletId, unsignedTx) => electron_1.ipcRenderer.invoke('signing:signTransaction', chain, walletId, unsignedTx),
        getAddress: (chain, walletId) => electron_1.ipcRenderer.invoke('signing:getAddress', chain, walletId),
    },
    addressBook: {
        getAll: () => electron_1.ipcRenderer.invoke('addressBook:getAll'),
        add: (entry) => electron_1.ipcRenderer.invoke('addressBook:add', entry),
        update: (id, entry) => electron_1.ipcRenderer.invoke('addressBook:update', id, entry),
        delete: (id) => electron_1.ipcRenderer.invoke('addressBook:delete', id),
    },
    history: {
        getAll: () => electron_1.ipcRenderer.invoke('history:getAll'),
        add: (record) => electron_1.ipcRenderer.invoke('history:add', record),
    },
    settings: {
        get: (key) => electron_1.ipcRenderer.invoke('settings:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('settings:set', key, value),
    },
    security: {
        getBlockedRequests: () => electron_1.ipcRenderer.invoke('security:getBlockedRequests'),
    },
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
