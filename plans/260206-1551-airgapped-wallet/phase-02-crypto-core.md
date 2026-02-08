# Phase 2: Crypto Core (Keys + Keystore)

## Context
Depends on Phase 1. Implements secure key generation, derivation, and encrypted storage. Foundation for all blockchain signers.

## Overview
- BIP39 mnemonic generation (12/24 words)
- BIP44 HD key derivation for all 4 chains
- AES-256-GCM encrypted keystore
- Argon2id password-based key derivation

## Requirements
- Cryptographically secure random generation
- Standard derivation paths per chain
- Memory-safe key handling
- Password strength validation

## Architecture

### Crypto Module Structure
```
src/crypto/
├── key-manager.ts        # BIP39/BIP44 operations
├── keystore.ts           # Encryption/decryption
├── memory-utils.ts       # Secure buffer handling
└── types.ts              # TypeScript interfaces
```

### Keystore File Format
```json
{
  "version": 1,
  "id": "uuid-v4",
  "crypto": {
    "cipher": "aes-256-gcm",
    "ciphertext": "hex",
    "cipherparams": { "iv": "hex-12-bytes" },
    "kdf": "argon2id",
    "kdfparams": { "salt": "hex-16-bytes", "m": 65536, "t": 3, "p": 4 },
    "mac": "hex-auth-tag-16-bytes"
  },
  "wallets": [
    { "chain": "btc", "name": "Main BTC", "path": "m/84'/0'/0'" },
    { "chain": "eth", "name": "Main ETH", "path": "m/44'/60'/0'" }
  ]
}
```

## Implementation Steps

### 2.1 Install Dependencies (1h)
```bash
npm install bip39 bip32 @scure/bip32 tiny-secp256k1
npm install argon2 uuid
npm install -D @types/uuid
```

Note: Use @scure/bip32 for audited implementation

### 2.2 Key Manager (6h)
**src/crypto/key-manager.ts**

```typescript
import * as bip39 from 'bip39';
import { HDKey } from '@scure/bip32';

// Derivation paths per chain
const DERIVATION_PATHS = {
  btc: "m/84'/0'/0'",   // BIP84 Native SegWit
  eth: "m/44'/60'/0'",  // Standard Ethereum
  xrp: "m/44'/144'/0'", // XRP standard
  tron: "m/44'/195'/0'" // TRON standard
};

export function generateMnemonic(strength: 128 | 256 = 256): string;
export function validateMnemonic(mnemonic: string): boolean;
export function mnemonicToSeed(mnemonic: string, passphrase?: string): Buffer;
export function deriveKeyPair(seed: Buffer, chain: Chain, index: number): KeyPair;
```

Key functions:
- `generateMnemonic`: 12 or 24 words
- `deriveKeyPair`: Returns { privateKey, publicKey, address }
- Chain-specific address derivation (internal)

### 2.3 Memory Security Utils (2h)
**src/crypto/memory-utils.ts**

```typescript
export function secureZeroFill(buffer: Buffer): void {
  buffer.fill(0);
}

export function withSecureBuffer<T>(
  data: Buffer,
  fn: (buf: Buffer) => T
): T {
  try {
    return fn(data);
  } finally {
    secureZeroFill(data);
  }
}
```

### 2.4 Keystore Encryption (8h)
**src/crypto/keystore.ts**

```typescript
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import argon2 from 'argon2';

interface EncryptParams {
  plaintext: Buffer;
  password: string;
}

export async function encryptKeystore(params: EncryptParams): Promise<KeystoreFile>;
export async function decryptKeystore(keystore: KeystoreFile, password: string): Promise<Buffer>;
```

Encryption flow:
1. Generate 16-byte random salt
2. Derive 32-byte key via Argon2id (m=64MB, t=3, p=4)
3. Generate 12-byte random IV
4. Encrypt with AES-256-GCM
5. Store ciphertext + authTag + params

### 2.5 Keystore Service (IPC) (3h)
**src/main/keystore-service.ts**

IPC handlers exposed to renderer:
- `keystore:create` - New wallet from mnemonic
- `keystore:import` - Import existing mnemonic
- `keystore:unlock` - Decrypt and cache keys
- `keystore:lock` - Clear cached keys
- `keystore:list` - List wallets (no secrets)
- `keystore:getAddress` - Get address for chain/index

File storage: `app.getPath('userData')/keystores/`

## Todo Checklist
- [ ] Install crypto dependencies
- [ ] Define TypeScript types (Chain, KeyPair, KeystoreFile)
- [ ] Implement key-manager.ts
  - [ ] generateMnemonic
  - [ ] validateMnemonic
  - [ ] mnemonicToSeed
  - [ ] deriveKeyPair (BTC)
  - [ ] deriveKeyPair (ETH)
  - [ ] deriveKeyPair (XRP)
  - [ ] deriveKeyPair (TRON)
- [ ] Implement memory-utils.ts
- [ ] Implement keystore.ts
  - [ ] Argon2id key derivation
  - [ ] AES-256-GCM encryption
  - [ ] AES-256-GCM decryption
- [ ] Implement keystore-service.ts (IPC handlers)
- [ ] Add preload API for keystore operations
- [ ] Write unit tests for key derivation
- [ ] Write unit tests for encryption/decryption

## Success Criteria
1. Generated mnemonics pass BIP39 validation
2. Derived addresses match reference implementations
3. Encrypted keystore decrypts correctly with right password
4. Wrong password throws error (not garbage data)
5. Memory cleared after operations (buffer.length shows zeros)

## Risks
| Risk | Mitigation |
|------|------------|
| Argon2 native compilation | Provide prebuilt binaries, PBKDF2 fallback |
| Key in memory too long | Auto-lock after timeout, clear on app blur |

## Test Vectors

### BIP39 Test
- Mnemonic: "abandon abandon ... about"
- Seed: 5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4

### Address Derivation
| Chain | Path | Expected Address Pattern |
|-------|------|--------------------------|
| BTC | m/84'/0'/0'/0/0 | bc1q... |
| ETH | m/44'/60'/0'/0/0 | 0x... (40 hex) |
| XRP | m/44'/144'/0'/0/0 | r... |
| TRON | m/44'/195'/0'/0/0 | T... |

## Estimated Effort: 20h
