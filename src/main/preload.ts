/**
 * Preload Script - Secure bridge between main and renderer processes
 * Exposes only safe IPC methods via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for the exposed API
export interface ElectronAPI {
  // Keystore operations
  keystore: {
    create: (password: string, mnemonic?: string) => Promise<{ success: boolean; error?: string }>;
    unlock: (password: string) => Promise<{ success: boolean; error?: string }>;
    lock: () => Promise<void>;
    isUnlocked: () => Promise<boolean>;
    getWallets: () => Promise<WalletInfo[]>;
    deleteWallet: (walletId: string) => Promise<{ success: boolean; error?: string }>;
  };

  // Signing operations
  signing: {
    signTransaction: (
      chain: ChainType,
      walletId: string,
      unsignedTx: string
    ) => Promise<{ signedTx: string; error?: string }>;
    getAddress: (chain: ChainType, walletId: string) => Promise<string>;
  };

  // Address book
  addressBook: {
    getAll: () => Promise<AddressEntry[]>;
    add: (entry: Omit<AddressEntry, 'id'>) => Promise<AddressEntry>;
    update: (id: string, entry: Partial<AddressEntry>) => Promise<AddressEntry>;
    delete: (id: string) => Promise<void>;
  };

  // Transaction history
  history: {
    getAll: () => Promise<TransactionRecord[]>;
    add: (record: Omit<TransactionRecord, 'id'>) => Promise<TransactionRecord>;
  };

  // App settings
  settings: {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T) => Promise<void>;
  };

  // Security
  security: {
    getBlockedRequests: () => Promise<{ url: string; timestamp: number }[]>;
  };
}

export type ChainType = 'btc' | 'eth' | 'xrp' | 'tron';

export interface WalletInfo {
  id: string;
  name: string;
  chain: ChainType;
  address: string;
  createdAt: number;
}

export interface AddressEntry {
  id: string;
  name: string;
  address: string;
  chain: ChainType;
  notes?: string;
}

export interface TransactionRecord {
  id: string;
  chain: ChainType;
  walletId: string;
  signedTx: string;
  timestamp: number;
  notes?: string;
}

// Expose the API to renderer process
const electronAPI: ElectronAPI = {
  keystore: {
    create: (password, mnemonic) =>
      ipcRenderer.invoke('keystore:create', password, mnemonic),
    unlock: (password) => ipcRenderer.invoke('keystore:unlock', password),
    lock: () => ipcRenderer.invoke('keystore:lock'),
    isUnlocked: () => ipcRenderer.invoke('keystore:isUnlocked'),
    getWallets: () => ipcRenderer.invoke('keystore:getWallets'),
    deleteWallet: (walletId) => ipcRenderer.invoke('keystore:deleteWallet', walletId),
  },

  signing: {
    signTransaction: (chain, walletId, unsignedTx) =>
      ipcRenderer.invoke('signing:signTransaction', chain, walletId, unsignedTx),
    getAddress: (chain, walletId) =>
      ipcRenderer.invoke('signing:getAddress', chain, walletId),
  },

  addressBook: {
    getAll: () => ipcRenderer.invoke('addressBook:getAll'),
    add: (entry) => ipcRenderer.invoke('addressBook:add', entry),
    update: (id, entry) => ipcRenderer.invoke('addressBook:update', id, entry),
    delete: (id) => ipcRenderer.invoke('addressBook:delete', id),
  },

  history: {
    getAll: () => ipcRenderer.invoke('history:getAll'),
    add: (record) => ipcRenderer.invoke('history:add', record),
  },

  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  },

  security: {
    getBlockedRequests: () => ipcRenderer.invoke('security:getBlockedRequests'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
