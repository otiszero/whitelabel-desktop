/**
 * Crypto Module Type Definitions
 */
// Derivation paths per chain (BIP44/84)
export const DERIVATION_PATHS = {
    btc: "m/84'/0'/0'", // BIP84 Native SegWit
    eth: "m/44'/60'/0'", // Standard Ethereum
    xrp: "m/44'/144'/0'", // XRP standard
    tron: "m/44'/195'/0'", // TRON standard
};
// Coin types for BIP44
export const COIN_TYPES = {
    btc: 0,
    eth: 60,
    xrp: 144,
    tron: 195,
};
