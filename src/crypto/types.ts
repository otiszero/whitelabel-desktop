/**
 * Crypto Module Type Definitions
 */

export type ChainType = 'btc' | 'eth' | 'xrp' | 'tron';

export interface KeyPair {
  privateKey: Buffer;
  publicKey: Buffer;
  address: string;
}

export interface WalletInfo {
  id: string;
  name: string;
  chain: ChainType;
  address: string;
  createdAt: number;
}

export interface KeystoreFile {
  version: number;
  id: string;
  crypto: {
    cipher: 'aes-256-gcm';
    ciphertext: string; // hex
    cipherparams: {
      iv: string; // hex, 12 bytes
    };
    kdf: 'argon2id';
    kdfparams: {
      salt: string; // hex, 16 bytes
      m: number;    // memory cost (KB)
      t: number;    // time cost (iterations)
      p: number;    // parallelism
    };
    mac: string; // hex, auth tag
  };
  wallets: WalletMeta[];
}

export interface WalletMeta {
  id: string;
  chain: ChainType;
  name: string;
  path: string;
  addressIndex: number;
}

export interface DecryptedKeystore {
  mnemonic: string;
  wallets: WalletMeta[];
}

// Derivation paths per chain (BIP44/84)
export const DERIVATION_PATHS: Record<ChainType, string> = {
  btc: "m/84'/0'/0'",    // BIP84 Native SegWit
  eth: "m/44'/60'/0'",   // Standard Ethereum
  xrp: "m/44'/144'/0'",  // XRP standard
  tron: "m/44'/195'/0'", // TRON standard
};

// Coin types for BIP44
export const COIN_TYPES: Record<ChainType, number> = {
  btc: 0,
  eth: 60,
  xrp: 144,
  tron: 195,
};
