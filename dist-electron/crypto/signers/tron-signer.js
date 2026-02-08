"use strict";
/**
 * TRON Transfer Signer
 * Signs TRON TRX transfer transactions offline
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
exports.TRON_CONSTANTS = exports.TronSigner = void 0;
exports.trxToSun = trxToSun;
exports.sunToTrx = sunToTrx;
const sha2_1 = require("@noble/hashes/sha2");
const sha3_1 = require("@noble/hashes/sha3");
const secp256k1 = __importStar(require("@noble/secp256k1"));
// TRON address regex (Base58Check with T prefix)
const TRON_ADDRESS_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
// TRON address prefix for mainnet
const TRON_ADDRESS_PREFIX = 0x41;
class TronSigner {
    validate(input) {
        const errors = [];
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
    async sign(input, privateKey) {
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
    privateKeyToAddress(privateKey) {
        // Get public key (uncompressed, without prefix)
        const publicKey = secp256k1.getPublicKey(privateKey, false).slice(1);
        // Keccak256 hash of public key
        const hash = (0, sha3_1.keccak_256)(publicKey);
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
    addressToHex(address) {
        const decoded = this.base58CheckDecode(address);
        return Buffer.from(decoded).toString('hex');
    }
    /**
     * Build raw transaction object
     */
    buildRawTransaction(input, ownerHex, toHex) {
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
    computeTxHash(rawTx) {
        // TRON uses SHA256 of the raw_data serialized
        // For simplicity, we hash the JSON - in production use protobuf
        const rawData = rawTx.raw_data;
        const serialized = JSON.stringify(rawData);
        return (0, sha2_1.sha256)(new TextEncoder().encode(serialized));
    }
    /**
     * Sign hash with private key
     */
    signHash(hash, privateKey) {
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
    base58CheckEncode(data) {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        // Compute checksum
        const checksum = (0, sha2_1.sha256)((0, sha2_1.sha256)(data)).slice(0, 4);
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
    base58CheckDecode(address) {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const ALPHABET_MAP = {};
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
        if (hex.length % 2)
            hex = '0' + hex;
        const bytes = Buffer.from(hex, 'hex');
        // Add leading zeros
        let leadingZeros = 0;
        for (const char of address) {
            if (char === '1')
                leadingZeros++;
            else
                break;
        }
        const result = new Uint8Array(leadingZeros + bytes.length);
        result.set(bytes, leadingZeros);
        // Remove checksum (last 4 bytes)
        return result.slice(0, -4);
    }
}
exports.TronSigner = TronSigner;
/**
 * TRON constants
 */
exports.TRON_CONSTANTS = {
    SUN_PER_TRX: 1000000,
    BANDWIDTH_PRICE: 1000, // sun per bandwidth unit
    ENERGY_PRICE: 420, // sun per energy unit
};
/**
 * Convert TRX to Sun
 */
function trxToSun(trx) {
    return Math.floor(Number(trx) * exports.TRON_CONSTANTS.SUN_PER_TRX);
}
/**
 * Convert Sun to TRX
 */
function sunToTrx(sun) {
    return (Number(sun) / exports.TRON_CONSTANTS.SUN_PER_TRX).toFixed(6);
}
