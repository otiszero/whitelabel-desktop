/**
 * Signer Service - IPC handlers for transaction signing
 */
import { getPrivateKey, isUnlocked } from './keystore-service.js';
import { BtcSigner } from '../crypto/signers/btc-signer.js';
import { EthSigner } from '../crypto/signers/eth-signer.js';
import { XrpSigner } from '../crypto/signers/xrp-signer.js';
import { TronSigner } from '../crypto/signers/tron-signer.js';
import { secureZeroFill } from '../crypto/memory-utils.js';
// Initialize signers
const btcSigner = new BtcSigner(false);
const btcTestnetSigner = new BtcSigner(true);
const ethSigner = new EthSigner();
const xrpSigner = new XrpSigner();
const tronSigner = new TronSigner();
/**
 * Sign a Bitcoin PSBT
 */
export async function signBtc(walletId, input, testnet = false) {
    if (!isUnlocked()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = getPrivateKey(walletId);
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
        secureZeroFill(privateKey);
    }
}
/**
 * Sign an Ethereum transaction
 */
export async function signEth(walletId, input) {
    if (!isUnlocked()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = getPrivateKey(walletId);
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
        secureZeroFill(privateKey);
    }
}
/**
 * Sign an XRP Payment transaction
 */
export async function signXrp(walletId, input) {
    if (!isUnlocked()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = getPrivateKey(walletId);
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
        secureZeroFill(privateKey);
    }
}
/**
 * Sign a TRON Transfer transaction
 */
export async function signTron(walletId, input) {
    if (!isUnlocked()) {
        return { success: false, error: 'Keystore is locked' };
    }
    const privateKey = getPrivateKey(walletId);
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
        secureZeroFill(privateKey);
    }
}
/**
 * Generic sign function that routes to the appropriate signer
 */
export async function signTransaction(chain, walletId, input) {
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
