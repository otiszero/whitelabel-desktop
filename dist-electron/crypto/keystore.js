"use strict";
/**
 * Keystore - Encrypted Storage for Wallet Keys
 * AES-256-GCM encryption with Argon2id key derivation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeystore = createKeystore;
exports.decryptKeystore = decryptKeystore;
exports.updateKeystoreWallets = updateKeystoreWallets;
exports.verifyPassword = verifyPassword;
exports.validatePassword = validatePassword;
const crypto_1 = require("crypto");
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
// Argon2id parameters (OWASP recommendations for high security)
const ARGON2_MEMORY = 65536; // 64 MB
const ARGON2_ITERATIONS = 3; // Time cost
const ARGON2_PARALLELISM = 4; // Parallelism
const CIPHER_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
/**
 * Create a new encrypted keystore from a mnemonic
 */
async function createKeystore(mnemonic, password, wallets = []) {
    // Generate random salt and IV
    const salt = (0, crypto_1.randomBytes)(SALT_LENGTH);
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    // Derive encryption key using Argon2id
    const key = await deriveKey(password, salt);
    // Prepare plaintext (mnemonic)
    const plaintext = Buffer.from(mnemonic, 'utf-8');
    // Encrypt with AES-256-GCM
    const cipher = (0, crypto_1.createCipheriv)(CIPHER_ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Zero-fill sensitive data
    key.fill(0);
    plaintext.fill(0);
    return {
        version: 1,
        id: (0, uuid_1.v4)(),
        crypto: {
            cipher: 'aes-256-gcm',
            ciphertext: ciphertext.toString('hex'),
            cipherparams: {
                iv: iv.toString('hex'),
            },
            kdf: 'argon2id',
            kdfparams: {
                salt: salt.toString('hex'),
                m: ARGON2_MEMORY,
                t: ARGON2_ITERATIONS,
                p: ARGON2_PARALLELISM,
            },
            mac: authTag.toString('hex'),
        },
        wallets,
    };
}
/**
 * Decrypt a keystore file
 */
async function decryptKeystore(keystore, password) {
    const { crypto, wallets } = keystore;
    // Parse hex values
    const salt = Buffer.from(crypto.kdfparams.salt, 'hex');
    const iv = Buffer.from(crypto.cipherparams.iv, 'hex');
    const ciphertext = Buffer.from(crypto.ciphertext, 'hex');
    const authTag = Buffer.from(crypto.mac, 'hex');
    // Derive key with same parameters
    const key = await deriveKey(password, salt, {
        m: crypto.kdfparams.m,
        t: crypto.kdfparams.t,
        p: crypto.kdfparams.p,
    });
    try {
        // Decrypt
        const decipher = (0, crypto_1.createDecipheriv)(CIPHER_ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        const mnemonic = plaintext.toString('utf-8');
        // Zero-fill
        key.fill(0);
        plaintext.fill(0);
        return { mnemonic, wallets };
    }
    catch (error) {
        key.fill(0);
        throw new Error('Invalid password or corrupted keystore');
    }
}
/**
 * Update wallets in keystore (re-encrypts with same password)
 */
async function updateKeystoreWallets(keystore, password, wallets) {
    const decrypted = await decryptKeystore(keystore, password);
    return createKeystore(decrypted.mnemonic, password, wallets);
}
/**
 * Verify password without decrypting full content
 */
async function verifyPassword(keystore, password) {
    try {
        await decryptKeystore(keystore, password);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Derive encryption key using Argon2id
 */
async function deriveKey(password, salt, params) {
    const options = {
        type: argon2_1.default.argon2id,
        memoryCost: params?.m ?? ARGON2_MEMORY,
        timeCost: params?.t ?? ARGON2_ITERATIONS,
        parallelism: params?.p ?? ARGON2_PARALLELISM,
        hashLength: 32, // 256 bits for AES-256
        salt,
        raw: true,
    };
    const hash = await argon2_1.default.hash(password, options);
    return Buffer.from(hash);
}
/**
 * Validate password strength
 */
function validatePassword(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    return { valid: errors.length === 0, errors };
}
