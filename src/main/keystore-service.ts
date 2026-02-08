/**
 * Keystore Service - Main Process Service for Wallet Management
 * Handles encrypted storage and key operations
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  createKeystore,
  decryptKeystore,
  updateKeystoreWallets,
  verifyPassword,
  validatePassword,
} from '../crypto/keystore.js';
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeed,
  deriveKeyPair,
} from '../crypto/key-manager.js';
import { secureZeroFill } from '../crypto/memory-utils.js';
import { ChainType, KeystoreFile, WalletMeta, WalletInfo, KeyPair } from '../crypto/types.js';

// In-memory cache for unlocked state
let unlockedKeystore: {
  keystoreFile: KeystoreFile;
  mnemonic: string;
  seed: Buffer;
} | null = null;

// Keystore file path
function getKeystorePath(): string {
  const userDataPath = app.getPath('userData');
  const keystoreDir = path.join(userDataPath, 'keystores');

  if (!fs.existsSync(keystoreDir)) {
    fs.mkdirSync(keystoreDir, { recursive: true });
  }

  return path.join(keystoreDir, 'keystore.json');
}

/**
 * Check if keystore exists
 */
export function keystoreExists(): boolean {
  return fs.existsSync(getKeystorePath());
}

/**
 * Create a new keystore with generated or provided mnemonic
 */
export async function createNewKeystore(
  password: string,
  mnemonic?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.errors.join(', ') };
    }

    // Generate or validate mnemonic
    const finalMnemonic = mnemonic ?? generateMnemonic(256);
    if (!validateMnemonic(finalMnemonic)) {
      return { success: false, error: 'Invalid mnemonic phrase' };
    }

    // Check if keystore already exists
    if (keystoreExists()) {
      return { success: false, error: 'Keystore already exists. Delete it first to create a new one.' };
    }

    // Create encrypted keystore
    const keystore = await createKeystore(finalMnemonic, password, []);

    // Save to file
    fs.writeFileSync(getKeystorePath(), JSON.stringify(keystore, null, 2));

    return { success: true };
  } catch (error) {
    console.error('[KeystoreService] Create error:', error);
    return { success: false, error: 'Failed to create keystore' };
  }
}

/**
 * Unlock keystore with password
 */
export async function unlockKeystore(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!keystoreExists()) {
      return { success: false, error: 'No keystore found. Create one first.' };
    }

    const keystoreData = fs.readFileSync(getKeystorePath(), 'utf-8');
    const keystoreFile: KeystoreFile = JSON.parse(keystoreData);

    const decrypted = await decryptKeystore(keystoreFile, password);
    const seed = mnemonicToSeed(decrypted.mnemonic);

    // Cache unlocked state
    unlockedKeystore = {
      keystoreFile,
      mnemonic: decrypted.mnemonic,
      seed,
    };

    return { success: true };
  } catch (error) {
    console.error('[KeystoreService] Unlock error:', error);
    return { success: false, error: 'Invalid password' };
  }
}

/**
 * Lock keystore - clear cached keys
 */
export function lockKeystore(): void {
  if (unlockedKeystore) {
    secureZeroFill(unlockedKeystore.seed);
    unlockedKeystore = null;
  }
}

/**
 * Check if keystore is unlocked
 */
export function isUnlocked(): boolean {
  return unlockedKeystore !== null;
}

/**
 * Get all wallets (without private keys)
 */
export function getWallets(): WalletInfo[] {
  if (!unlockedKeystore) {
    return [];
  }

  return unlockedKeystore.keystoreFile.wallets.map(wallet => ({
    id: wallet.id,
    name: wallet.name,
    chain: wallet.chain,
    address: deriveKeyPair(unlockedKeystore!.seed, wallet.chain, wallet.addressIndex).address,
    createdAt: Date.now(),
  }));
}

/**
 * Create a new wallet for a specific chain
 */
export async function createWallet(
  chain: ChainType,
  name: string,
  password: string
): Promise<{ success: boolean; wallet?: WalletInfo; error?: string }> {
  if (!unlockedKeystore) {
    return { success: false, error: 'Keystore is locked' };
  }

  try {
    // Verify password before modifying
    const valid = await verifyPassword(unlockedKeystore.keystoreFile, password);
    if (!valid) {
      return { success: false, error: 'Invalid password' };
    }

    // Find next address index for this chain
    const existingWallets = unlockedKeystore.keystoreFile.wallets.filter(w => w.chain === chain);
    const nextIndex = existingWallets.length;

    // Derive address
    const keyPair = deriveKeyPair(unlockedKeystore.seed, chain, nextIndex);

    // Create wallet metadata
    const newWallet: WalletMeta = {
      id: uuidv4(),
      chain,
      name,
      path: `${chain}/${nextIndex}`,
      addressIndex: nextIndex,
    };

    // Update keystore
    const updatedWallets = [...unlockedKeystore.keystoreFile.wallets, newWallet];
    const newKeystore = await updateKeystoreWallets(
      unlockedKeystore.keystoreFile,
      password,
      updatedWallets
    );

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
  } catch (error) {
    console.error('[KeystoreService] Create wallet error:', error);
    return { success: false, error: 'Failed to create wallet' };
  }
}

/**
 * Delete a wallet
 */
export async function deleteWallet(
  walletId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!unlockedKeystore) {
    return { success: false, error: 'Keystore is locked' };
  }

  try {
    const valid = await verifyPassword(unlockedKeystore.keystoreFile, password);
    if (!valid) {
      return { success: false, error: 'Invalid password' };
    }

    const updatedWallets = unlockedKeystore.keystoreFile.wallets.filter(w => w.id !== walletId);

    if (updatedWallets.length === unlockedKeystore.keystoreFile.wallets.length) {
      return { success: false, error: 'Wallet not found' };
    }

    const newKeystore = await updateKeystoreWallets(
      unlockedKeystore.keystoreFile,
      password,
      updatedWallets
    );

    fs.writeFileSync(getKeystorePath(), JSON.stringify(newKeystore, null, 2));
    unlockedKeystore.keystoreFile = newKeystore;

    return { success: true };
  } catch (error) {
    console.error('[KeystoreService] Delete wallet error:', error);
    return { success: false, error: 'Failed to delete wallet' };
  }
}

/**
 * Get private key for signing (use with caution)
 */
export function getPrivateKey(walletId: string): Buffer | null {
  if (!unlockedKeystore) {
    return null;
  }

  const wallet = unlockedKeystore.keystoreFile.wallets.find(w => w.id === walletId);
  if (!wallet) {
    return null;
  }

  const keyPair = deriveKeyPair(unlockedKeystore.seed, wallet.chain, wallet.addressIndex);
  return keyPair.privateKey;
}

/**
 * Get address for a wallet
 */
export function getAddress(walletId: string): string | null {
  if (!unlockedKeystore) {
    return null;
  }

  const wallet = unlockedKeystore.keystoreFile.wallets.find(w => w.id === walletId);
  if (!wallet) {
    return null;
  }

  const keyPair = deriveKeyPair(unlockedKeystore.seed, wallet.chain, wallet.addressIndex);
  return keyPair.address;
}

/**
 * Get the current mnemonic (for backup display)
 */
export function getMnemonic(): string | null {
  if (!unlockedKeystore) {
    return null;
  }
  return unlockedKeystore.mnemonic;
}
