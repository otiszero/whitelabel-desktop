"use strict";
/**
 * Keystore Service - Main Process Service for Wallet Management
 * Handles encrypted storage and key operations
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
exports.keystoreExists = keystoreExists;
exports.createNewKeystore = createNewKeystore;
exports.unlockKeystore = unlockKeystore;
exports.lockKeystore = lockKeystore;
exports.isUnlocked = isUnlocked;
exports.getWallets = getWallets;
exports.createWallet = createWallet;
exports.deleteWallet = deleteWallet;
exports.getPrivateKey = getPrivateKey;
exports.getAddress = getAddress;
exports.getMnemonic = getMnemonic;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const keystore_1 = require("../crypto/keystore");
const key_manager_1 = require("../crypto/key-manager");
const memory_utils_1 = require("../crypto/memory-utils");
// In-memory cache for unlocked state
let unlockedKeystore = null;
// Keystore file path
function getKeystorePath() {
    const userDataPath = electron_1.app.getPath('userData');
    const keystoreDir = path.join(userDataPath, 'keystores');
    if (!fs.existsSync(keystoreDir)) {
        fs.mkdirSync(keystoreDir, { recursive: true });
    }
    return path.join(keystoreDir, 'keystore.json');
}
/**
 * Check if keystore exists
 */
function keystoreExists() {
    return fs.existsSync(getKeystorePath());
}
/**
 * Create a new keystore with generated or provided mnemonic
 */
async function createNewKeystore(password, mnemonic) {
    try {
        // Validate password
        const passwordCheck = (0, keystore_1.validatePassword)(password);
        if (!passwordCheck.valid) {
            return { success: false, error: passwordCheck.errors.join(', ') };
        }
        // Generate or validate mnemonic
        const finalMnemonic = mnemonic ?? (0, key_manager_1.generateMnemonic)(256);
        if (!(0, key_manager_1.validateMnemonic)(finalMnemonic)) {
            return { success: false, error: 'Invalid mnemonic phrase' };
        }
        // Check if keystore already exists
        if (keystoreExists()) {
            return { success: false, error: 'Keystore already exists. Delete it first to create a new one.' };
        }
        // Create encrypted keystore
        const keystore = await (0, keystore_1.createKeystore)(finalMnemonic, password, []);
        // Save to file
        fs.writeFileSync(getKeystorePath(), JSON.stringify(keystore, null, 2));
        return { success: true };
    }
    catch (error) {
        console.error('[KeystoreService] Create error:', error);
        return { success: false, error: 'Failed to create keystore' };
    }
}
/**
 * Unlock keystore with password
 */
async function unlockKeystore(password) {
    try {
        if (!keystoreExists()) {
            return { success: false, error: 'No keystore found. Create one first.' };
        }
        const keystoreData = fs.readFileSync(getKeystorePath(), 'utf-8');
        const keystoreFile = JSON.parse(keystoreData);
        const decrypted = await (0, keystore_1.decryptKeystore)(keystoreFile, password);
        const seed = (0, key_manager_1.mnemonicToSeed)(decrypted.mnemonic);
        // Cache unlocked state
        unlockedKeystore = {
            keystoreFile,
            mnemonic: decrypted.mnemonic,
            seed,
        };
        return { success: true };
    }
    catch (error) {
        console.error('[KeystoreService] Unlock error:', error);
        return { success: false, error: 'Invalid password' };
    }
}
/**
 * Lock keystore - clear cached keys
 */
function lockKeystore() {
    if (unlockedKeystore) {
        (0, memory_utils_1.secureZeroFill)(unlockedKeystore.seed);
        unlockedKeystore = null;
    }
}
/**
 * Check if keystore is unlocked
 */
function isUnlocked() {
    return unlockedKeystore !== null;
}
/**
 * Get all wallets (without private keys)
 */
function getWallets() {
    if (!unlockedKeystore) {
        return [];
    }
    return unlockedKeystore.keystoreFile.wallets.map(wallet => ({
        id: wallet.id,
        name: wallet.name,
        chain: wallet.chain,
        address: (0, key_manager_1.deriveKeyPair)(unlockedKeystore.seed, wallet.chain, wallet.addressIndex).address,
        createdAt: Date.now(),
    }));
}
/**
 * Create a new wallet for a specific chain
 */
async function createWallet(chain, name, password) {
    if (!unlockedKeystore) {
        return { success: false, error: 'Keystore is locked' };
    }
    try {
        // Verify password before modifying
        const valid = await (0, keystore_1.verifyPassword)(unlockedKeystore.keystoreFile, password);
        if (!valid) {
            return { success: false, error: 'Invalid password' };
        }
        // Find next address index for this chain
        const existingWallets = unlockedKeystore.keystoreFile.wallets.filter(w => w.chain === chain);
        const nextIndex = existingWallets.length;
        // Derive address
        const keyPair = (0, key_manager_1.deriveKeyPair)(unlockedKeystore.seed, chain, nextIndex);
        // Create wallet metadata
        const newWallet = {
            id: (0, uuid_1.v4)(),
            chain,
            name,
            path: `${chain}/${nextIndex}`,
            addressIndex: nextIndex,
        };
        // Update keystore
        const updatedWallets = [...unlockedKeystore.keystoreFile.wallets, newWallet];
        const newKeystore = await (0, keystore_1.updateKeystoreWallets)(unlockedKeystore.keystoreFile, password, updatedWallets);
        // Save and update cache
        fs.writeFileSync(getKeystorePath(), JSON.stringify(newKeystore, null, 2));
        unlockedKeystore.keystoreFile = newKeystore;
        return {
            success: true,
            wallet: {
                id: newWallet.id,
                name: newWallet.name,
                chain: newWallet.chain,
                address: keyPair.address,
                createdAt: Date.now(),
            },
        };
    }
    catch (error) {
        console.error('[KeystoreService] Create wallet error:', error);
        return { success: false, error: 'Failed to create wallet' };
    }
}
/**
 * Delete a wallet
 */
async function deleteWallet(walletId, password) {
    if (!unlockedKeystore) {
        return { success: false, error: 'Keystore is locked' };
    }
    try {
        const valid = await (0, keystore_1.verifyPassword)(unlockedKeystore.keystoreFile, password);
        if (!valid) {
            return { success: false, error: 'Invalid password' };
        }
        const updatedWallets = unlockedKeystore.keystoreFile.wallets.filter(w => w.id !== walletId);
        if (updatedWallets.length === unlockedKeystore.keystoreFile.wallets.length) {
            return { success: false, error: 'Wallet not found' };
        }
        const newKeystore = await (0, keystore_1.updateKeystoreWallets)(unlockedKeystore.keystoreFile, password, updatedWallets);
        fs.writeFileSync(getKeystorePath(), JSON.stringify(newKeystore, null, 2));
        unlockedKeystore.keystoreFile = newKeystore;
        return { success: true };
    }
    catch (error) {
        console.error('[KeystoreService] Delete wallet error:', error);
        return { success: false, error: 'Failed to delete wallet' };
    }
}
/**
 * Get private key for signing (use with caution)
 */
function getPrivateKey(walletId) {
    if (!unlockedKeystore) {
        return null;
    }
    const wallet = unlockedKeystore.keystoreFile.wallets.find(w => w.id === walletId);
    if (!wallet) {
        return null;
    }
    const keyPair = (0, key_manager_1.deriveKeyPair)(unlockedKeystore.seed, wallet.chain, wallet.addressIndex);
    return keyPair.privateKey;
}
/**
 * Get address for a wallet
 */
function getAddress(walletId) {
    if (!unlockedKeystore) {
        return null;
    }
    const wallet = unlockedKeystore.keystoreFile.wallets.find(w => w.id === walletId);
    if (!wallet) {
        return null;
    }
    const keyPair = (0, key_manager_1.deriveKeyPair)(unlockedKeystore.seed, wallet.chain, wallet.addressIndex);
    return keyPair.address;
}
/**
 * Get the current mnemonic (for backup display)
 */
function getMnemonic() {
    if (!unlockedKeystore) {
        return null;
    }
    return unlockedKeystore.mnemonic;
}
