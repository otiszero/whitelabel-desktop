"use strict";
/**
 * Crypto Module Type Definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COIN_TYPES = exports.DERIVATION_PATHS = void 0;
// Derivation paths per chain (BIP44/84)
exports.DERIVATION_PATHS = {
    btc: "m/84'/0'/0'", // BIP84 Native SegWit
    eth: "m/44'/60'/0'", // Standard Ethereum
    xrp: "m/44'/144'/0'", // XRP standard
    tron: "m/44'/195'/0'", // TRON standard
};
// Coin types for BIP44
exports.COIN_TYPES = {
    btc: 0,
    eth: 60,
    xrp: 144,
    tron: 195,
};
