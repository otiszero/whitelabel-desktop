"use strict";
/**
 * Signer Service - IPC handlers for transaction signing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.signBtc = signBtc;
exports.signEth = signEth;
exports.signXrp = signXrp;
exports.signTron = signTron;
exports.signTransaction = signTransaction;
const keystore_service_1 = require("./keystore-service");
const btc_signer_1 = require("../crypto/signers/btc-signer");
const eth_signer_1 = require("../crypto/signers/eth-signer");
const xrp_signer_1 = require("../crypto/signers/xrp-signer");
const tron_signer_1 = require("../crypto/signers/tron-signer");
const memory_utils_1 = require("../crypto/memory-utils");
// Initialize signers
const btcSigner = new btc_signer_1.BtcSigner(false);
const btcTestnetSigner = new btc_signer_1.BtcSigner(true);
const ethSigner = new eth_signer_1.EthSigner();
const xrpSigner = new xrp_signer_1.XrpSigner();
const tronSigner = new tron_signer_1.TronSigner();
/**
 * Sign a Bitcoin PSBT
 */
async function signBtc(walletId, input, testnet = false) {
    if (!(0, keystore_service_1.isUnlocked)()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = (0, keystore_service_1.getPrivateKey)(walletId);
    if (!privateKey) {
        return { success: false, error: 'Wallet not found' };
    }
    try {
        const signer = testnet ? btcTestnetSigner : btcSigner;
        // Validate input
        const validation = signer.validate(input);
        if (!validation.valid) {
            return { success: false, error: validation.errors.join(', ') };
        }
        // Sign
        const result = await signer.sign(input, privateKey);
        return { success: true, data: result };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Signing failed',
        };
    }
    finally {
        (0, memory_utils_1.secureZeroFill)(privateKey);
    }
}
/**
 * Sign an Ethereum transaction
 */
async function signEth(walletId, input) {
    if (!(0, keystore_service_1.isUnlocked)()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = (0, keystore_service_1.getPrivateKey)(walletId);
    if (!privateKey) {
        return { success: false, error: 'Wallet not found' };
    }
    try {
        // Validate input
        const validation = ethSigner.validate(input);
        if (!validation.valid) {
            return { success: false, error: validation.errors.join(', ') };
        }
        // Sign
        const result = await ethSigner.sign(input, privateKey);
        return { success: true, data: result };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Signing failed',
        };
    }
    finally {
        (0, memory_utils_1.secureZeroFill)(privateKey);
    }
}
/**
 * Sign an XRP Payment transaction
 */
async function signXrp(walletId, input) {
    if (!(0, keystore_service_1.isUnlocked)()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = (0, keystore_service_1.getPrivateKey)(walletId);
    if (!privateKey) {
        return { success: false, error: 'Wallet not found' };
    }
    try {
        // Validate input
        const validation = xrpSigner.validate(input);
        if (!validation.valid) {
            return { success: false, error: validation.errors.join(', ') };
        }
        // Sign
        const result = await xrpSigner.sign(input, privateKey);
        return { success: true, data: result };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Signing failed',
        };
    }
    finally {
        (0, memory_utils_1.secureZeroFill)(privateKey);
    }
}
/**
 * Sign a TRON Transfer transaction
 */
async function signTron(walletId, input) {
    if (!(0, keystore_service_1.isUnlocked)()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = (0, keystore_service_1.getPrivateKey)(walletId);
    if (!privateKey) {
        return { success: false, error: 'Wallet not found' };
    }
    try {
        // Validate input
        const validation = tronSigner.validate(input);
        if (!validation.valid) {
            return { success: false, error: validation.errors.join(', ') };
        }
        // Sign
        const result = await tronSigner.sign(input, privateKey);
        return { success: true, data: result };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Signing failed',
        };
    }
    finally {
        (0, memory_utils_1.secureZeroFill)(privateKey);
    }
}
/**
 * Generic sign function that routes to the appropriate signer
 */
async function signTransaction(chain, walletId, input) {
    switch (chain) {
        case 'btc':
            return signBtc(walletId, input);
        case 'eth':
            return signEth(walletId, input);
        case 'xrp':
            return signXrp(walletId, input);
        case 'tron':
            return signTron(walletId, input);
        default:
            return { success: false, error: `Unsupported chain: ${chain}` };
    }
}
