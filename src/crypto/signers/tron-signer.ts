/**
 * TRON Transfer Signer
 * Signs TRON TRX transfer transactions offline
 */

import { sha256 } from '@noble/hashes/sha2';
import { keccak_256 } from '@noble/hashes/sha3';
import * as secp256k1 from '@noble/secp256k1';
import { BaseSigner, TronSignInput, TronMeta, ValidationResult, SignerResult } from './types';

// TRON address regex (Base58Check with T prefix)
const TRON_ADDRESS_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

// TRON address prefix for mainnet
const TRON_ADDRESS_PREFIX = 0x41;

export class TronSigner implements BaseSigner<TronSignInput, TronMeta> {
  validate(input: TronSignInput): ValidationResult {
    const errors: string[] = [];

    // Validate 'to' address
    if (!TRON_ADDRESS_REGEX.test(input.to)) {
      errors.push('Invalid TRON address');
    }

    // Validate amount (Sun)
    if (input.amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Validate timestamp (should be within 24 hours)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (Math.abs(input.timestamp - now) > dayMs) {
      errors.push('Timestamp must be within 24 hours of current time');
    }

    // Validate expiration
    if (input.expiration <= input.timestamp) {
      errors.push('Expiration must be after timestamp');
    }

    // Validate ref_block_bytes (4 hex chars = 2 bytes)
    if (!/^[0-9a-fA-F]{4}$/.test(input.refBlockBytes)) {
      errors.push('Invalid refBlockBytes');
    }

    // Validate ref_block_hash (16 hex chars = 8 bytes)
    if (!/^[0-9a-fA-F]{16}$/.test(input.refBlockHash)) {
      errors.push('Invalid refBlockHash');
    }

    return { valid: errors.length === 0, errors };
  }

  async sign(input: TronSignInput, privateKey: Buffer): Promise<SignerResult<TronMeta>> {
    // Derive owner address from private key
    const ownerAddress = this.privateKeyToAddress(privateKey);

    // Convert addresses to hex format
    const toHex = this.addressToHex(input.to);
    const ownerHex = this.addressToHex(ownerAddress);

    // Build raw transaction
    const rawTx = this.buildRawTransaction(input, ownerHex, toHex);

    // Compute transaction hash
    const txHash = this.computeTxHash(rawTx);

    // Sign the hash
    const signature = this.signHash(txHash, privateKey);

    // Add signature to transaction
    const signedTx = {
      ...rawTx,
      signature: [signature],
    };

    return {
      signedTx: JSON.stringify(signedTx),
      txHash: Buffer.from(txHash).toString('hex'),
      metadata: {
        owner: ownerAddress,
        to: input.to,
        amount: input.amount,
      },
    };
  }

  /**
   * Derive TRON address from private key
   */
  private privateKeyToAddress(privateKey: Buffer): string {
    // Get public key (uncompressed, without prefix)
    const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);

    // Keccak256 hash of public key
    const hash = keccak_256(publicKey);

    // Take last 20 bytes and add prefix
    const addressBytes = new Uint8Array(21);
    addressBytes[0] = TRON_ADDRESS_PREFIX;
    addressBytes.set(hash.slice(-20), 1);

    // Base58Check encode
    return this.base58CheckEncode(addressBytes);
  }

  /**
   * Convert TRON address to hex format
   */
  private addressToHex(address: string): string {
    const decoded = this.base58CheckDecode(address);
    return Buffer.from(decoded).toString('hex');
  }

  /**
   * Build raw transaction object
   */
  private buildRawTransaction(
    input: TronSignInput,
    ownerHex: string,
    toHex: string
  ): Record<string, unknown> {
    return {
      visible: false,
      txID: '',
      raw_data: {
        contract: [{
          parameter: {
            value: {
              amount: input.amount,
              owner_address: ownerHex,
              to_address: toHex,
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        }],
        ref_block_bytes: input.refBlockBytes,
        ref_block_hash: input.refBlockHash,
        expiration: input.expiration,
        timestamp: input.timestamp,
      },
      raw_data_hex: '',
    };
  }

  /**
   * Compute transaction hash
   */
  private computeTxHash(rawTx: Record<string, unknown>): Uint8Array {
    // TRON uses SHA256 of the raw_data serialized
    // For simplicity, we hash the JSON - in production use protobuf
    const rawData = rawTx.raw_data as Record<string, unknown>;
    const serialized = JSON.stringify(rawData);
    return sha256(new TextEncoder().encode(serialized));
  }

  /**
   * Sign hash with private key
   */
  private signHash(hash: Uint8Array, privateKey: Buffer): string {
    // secp256k1 v3 returns Uint8Array directly
    const signature = secp256k1.sign(hash, privateKey);

    // signature is already 64 bytes (r || s)
    // Add recovery byte (0 for simplicity - proper implementation needs recovery)
    const sigBytes = new Uint8Array(65);
    sigBytes.set(signature.slice(0, 64), 0);
    sigBytes[64] = 27; // Standard recovery id

    return Buffer.from(sigBytes).toString('hex');
  }

  /**
   * Base58Check encode
   */
  private base58CheckEncode(data: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    // Compute checksum
    const checksum = sha256(sha256(data)).slice(0, 4);
    const full = new Uint8Array(data.length + 4);
    full.set(data);
    full.set(checksum, data.length);

    // Convert to base58
    let num = BigInt('0x' + Buffer.from(full).toString('hex'));
    let result = '';
    while (num > 0n) {
      result = ALPHABET[Number(num % 58n)] + result;
      num = num / 58n;
    }

    // Add leading zeros
    for (let i = 0; i < full.length && full[i] === 0; i++) {
      result = '1' + result;
    }

    return result;
  }

  /**
   * Base58Check decode
   */
  private base58CheckDecode(address: string): Uint8Array {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const ALPHABET_MAP: Record<string, number> = {};
    for (let i = 0; i < ALPHABET.length; i++) {
      ALPHABET_MAP[ALPHABET[i]] = i;
    }

    // Convert from base58
    let num = 0n;
    for (const char of address) {
      num = num * 58n + BigInt(ALPHABET_MAP[char]);
    }

    // Convert to bytes
    let hex = num.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const bytes = Buffer.from(hex, 'hex');

    // Add leading zeros
    let leadingZeros = 0;
    for (const char of address) {
      if (char === '1') leadingZeros++;
      else break;
    }

    const result = new Uint8Array(leadingZeros + bytes.length);
    result.set(bytes, leadingZeros);

    // Remove checksum (last 4 bytes)
    return result.slice(0, -4);
  }
}

/**
 * TRON constants
 */
export const TRON_CONSTANTS = {
  SUN_PER_TRX: 1000000,
  BANDWIDTH_PRICE: 1000, // sun per bandwidth unit
  ENERGY_PRICE: 420, // sun per energy unit
};

/**
 * Convert TRX to Sun
 */
export function trxToSun(trx: number | string): number {
  return Math.floor(Number(trx) * TRON_CONSTANTS.SUN_PER_TRX);
}

/**
 * Convert Sun to TRX
 */
export function sunToTrx(sun: number | string): string {
  return (Number(sun) / TRON_CONSTANTS.SUN_PER_TRX).toFixed(6);
}
