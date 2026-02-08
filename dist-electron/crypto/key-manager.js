/**
 * Key Manager - BIP39/BIP44 Key Generation and Derivation
 * Handles mnemonic generation and HD key derivation for all supported chains
 */
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { DERIVATION_PATHS } from './types.js';
/**
 * Generate a new BIP39 mnemonic
 * @param strength 128 for 12 words, 256 for 24 words
 */
export function generateMnemonic(strength = 256) {
    return bip39.generateMnemonic(wordlist, strength);
}
/**
 * Validate a BIP39 mnemonic
 */
export function validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic, wordlist);
}
/**
 * Convert mnemonic to seed
 */
export function mnemonicToSeed(mnemonic, passphrase = '') {
    const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
    return Buffer.from(seed);
}
/**
 * Derive a key pair for a specific chain and address index
 */
export function deriveKeyPair(seed, chain, addressIndex = 0) {
    const basePath = DERIVATION_PATHS[chain];
    const fullPath = `${basePath}/0/${addressIndex}`;
    const hdKey = HDKey.fromMasterSeed(seed);
    const derived = hdKey.derive(fullPath);
    if (!derived.privateKey || !derived.publicKey) {
        throw new Error('Failed to derive key pair');
    }
    const privateKey = Buffer.from(derived.privateKey);
    const publicKey = Buffer.from(derived.publicKey);
    const address = deriveAddress(chain, publicKey, privateKey);
    return { privateKey, publicKey, address };
}
/**
 * Derive address from public key based on chain type
 */
function deriveAddress(chain, publicKey, privateKey) {
    switch (chain) {
        case 'btc':
            return deriveBtcAddress(publicKey);
        case 'eth':
            return deriveEthAddress(publicKey);
        case 'xrp':
            return deriveXrpAddress(publicKey);
        case 'tron':
            return deriveTronAddress(publicKey);
        default:
            throw new Error(`Unsupported chain: ${chain}`);
    }
}
/**
 * BTC Native SegWit (Bech32) address - P2WPKH
 */
function deriveBtcAddress(publicKey) {
    // Hash160 = RIPEMD160(SHA256(pubkey))
    const sha = sha256(publicKey);
    const hash160 = ripemd160(sha);
    // Bech32 encoding for native SegWit
    return bech32Encode('bc', 0, Buffer.from(hash160));
}
/**
 * ETH address - last 20 bytes of Keccak256(uncompressed pubkey without prefix)
 */
function deriveEthAddress(publicKey) {
    // Remove the 0x04 prefix if present (uncompressed public key marker)
    // For compressed keys, we need to decompress first
    // @scure/bip32 gives us compressed keys (33 bytes starting with 02 or 03)
    const uncompressed = decompressPublicKey(publicKey);
    // Keccak256 of the 64-byte public key (without 04 prefix)
    const hash = keccak_256(uncompressed.slice(1));
    // Take last 20 bytes
    const address = Buffer.from(hash.slice(-20));
    return '0x' + address.toString('hex');
}
/**
 * XRP address - Base58Check with version byte 0x00
 */
function deriveXrpAddress(publicKey) {
    const sha = sha256(publicKey);
    const hash160 = ripemd160(sha);
    // XRP uses its own alphabet
    return base58CheckEncode(Buffer.from(hash160), 0x00, 'ripple');
}
/**
 * TRON address - Similar to ETH but with different prefix and Base58Check
 */
function deriveTronAddress(publicKey) {
    const uncompressed = decompressPublicKey(publicKey);
    const hash = keccak_256(uncompressed.slice(1));
    // Take last 20 bytes
    const addressBytes = Buffer.from(hash.slice(-20));
    // Add TRON mainnet prefix (0x41)
    const prefixed = Buffer.concat([Buffer.from([0x41]), addressBytes]);
    // Base58Check encode
    return base58CheckEncode(prefixed, null, 'bitcoin');
}
// ==================== Helper Functions ====================
/**
 * Decompress a 33-byte compressed public key to 65-byte uncompressed
 */
function decompressPublicKey(compressed) {
    if (compressed.length === 65)
        return compressed;
    if (compressed.length !== 33) {
        throw new Error('Invalid compressed public key length');
    }
    // Use secp256k1 curve math
    // y² = x³ + 7 (mod p)
    const p = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F');
    const prefix = compressed[0];
    const x = BigInt('0x' + compressed.slice(1).toString('hex'));
    // Calculate y² = x³ + 7
    const ySquared = (x ** 3n + 7n) % p;
    // Calculate modular square root using Tonelli-Shanks
    const y = modSqrt(ySquared, p);
    // Choose correct y based on prefix (02 = even, 03 = odd)
    const isEven = prefix === 0x02;
    const finalY = (y % 2n === 0n) === isEven ? y : p - y;
    // Convert to buffer
    const xBuf = Buffer.from(x.toString(16).padStart(64, '0'), 'hex');
    const yBuf = Buffer.from(finalY.toString(16).padStart(64, '0'), 'hex');
    return Buffer.concat([Buffer.from([0x04]), xBuf, yBuf]);
}
/**
 * Modular square root using Tonelli-Shanks (for p ≡ 3 mod 4)
 */
function modSqrt(a, p) {
    // For secp256k1, p ≡ 3 (mod 4), so we can use: sqrt(a) = a^((p+1)/4)
    return modPow(a, (p + 1n) / 4n, p);
}
function modPow(base, exp, mod) {
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod;
        }
        exp = exp / 2n;
        base = (base * base) % mod;
    }
    return result;
}
/**
 * Bech32 encoding for Bitcoin addresses
 */
function bech32Encode(hrp, version, data) {
    const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    function polymod(values) {
        let chk = 1;
        for (const v of values) {
            const top = chk >> 25;
            chk = ((chk & 0x1ffffff) << 5) ^ v;
            for (let i = 0; i < 5; i++) {
                if ((top >> i) & 1)
                    chk ^= GENERATOR[i];
            }
        }
        return chk;
    }
    function hrpExpand(hrp) {
        const ret = [];
        for (const c of hrp)
            ret.push(c.charCodeAt(0) >> 5);
        ret.push(0);
        for (const c of hrp)
            ret.push(c.charCodeAt(0) & 31);
        return ret;
    }
    function convertBits(data, fromBits, toBits, pad) {
        let acc = 0, bits = 0;
        const ret = [], maxv = (1 << toBits) - 1;
        for (const value of data) {
            acc = (acc << fromBits) | value;
            bits += fromBits;
            while (bits >= toBits) {
                bits -= toBits;
                ret.push((acc >> bits) & maxv);
            }
        }
        if (pad && bits > 0)
            ret.push((acc << (toBits - bits)) & maxv);
        return ret;
    }
    const converted = [version, ...convertBits(data, 8, 5, true)];
    const checksum = polymod([...hrpExpand(hrp), ...converted, 0, 0, 0, 0, 0, 0]) ^ 1;
    const checksumChars = [];
    for (let i = 0; i < 6; i++)
        checksumChars.push((checksum >> (5 * (5 - i))) & 31);
    return hrp + '1' + [...converted, ...checksumChars].map(i => CHARSET[i]).join('');
}
/**
 * Base58Check encoding
 */
function base58CheckEncode(payload, version, alphabet) {
    const ALPHABETS = {
        bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
        ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'
    };
    const chars = ALPHABETS[alphabet];
    let data = version !== null ? Buffer.concat([Buffer.from([version]), payload]) : payload;
    // Double SHA256 checksum
    const checksum = sha256(sha256(data)).slice(0, 4);
    data = Buffer.concat([data, Buffer.from(checksum)]);
    // Convert to base58
    let num = BigInt('0x' + data.toString('hex'));
    let result = '';
    while (num > 0n) {
        result = chars[Number(num % 58n)] + result;
        num = num / 58n;
    }
    // Add leading zeros
    for (let i = 0; i < data.length && data[i] === 0; i++) {
        result = chars[0] + result;
    }
    return result;
}
