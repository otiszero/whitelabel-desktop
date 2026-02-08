"use strict";
/**
 * Bitcoin PSBT Signer
 * Signs PSBTs for BIP84 Native SegWit (P2WPKH) addresses
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
exports.BtcSigner = void 0;
exports.createBtcPsbt = createBtcPsbt;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecc = __importStar(require("@bitcoinerlab/secp256k1"));
// Initialize ECC library
bitcoin.initEccLib(ecc);
class BtcSigner {
    network;
    constructor(testnet = false) {
        this.network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
    }
    validate(input) {
        const errors = [];
        try {
            const psbt = bitcoin.Psbt.fromBase64(input.psbtBase64, { network: this.network });
            // Check that we have inputs
            if (psbt.inputCount === 0) {
                errors.push('PSBT has no inputs');
            }
            // Check that we have outputs
            if (psbt.txOutputs.length === 0) {
                errors.push('PSBT has no outputs');
            }
            // Check each input has witness UTXO
            for (let i = 0; i < psbt.inputCount; i++) {
                const input = psbt.data.inputs[i];
                if (!input.witnessUtxo && !input.nonWitnessUtxo) {
                    errors.push(`Input ${i} missing UTXO data`);
                }
            }
        }
        catch (e) {
            errors.push(`Invalid PSBT: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
        return { valid: errors.length === 0, errors };
    }
    async sign(input, privateKey) {
        // Parse PSBT
        const psbt = bitcoin.Psbt.fromBase64(input.psbtBase64, { network: this.network });
        // Create ECPair from private key
        const keyPair = {
            publicKey: Buffer.from(ecc.pointFromScalar(privateKey)),
            privateKey,
            sign: (hash) => Buffer.from(ecc.sign(hash, privateKey)),
        };
        // Sign all inputs
        for (let i = 0; i < psbt.inputCount; i++) {
            try {
                psbt.signInput(i, keyPair);
            }
            catch (e) {
                // Input may not belong to this key - skip
                console.warn(`Could not sign input ${i}: ${e}`);
            }
        }
        // Validate signatures
        const validated = psbt.validateSignaturesOfAllInputs((pubkey, msghash, signature) => {
            return ecc.verify(msghash, pubkey, signature);
        });
        if (!validated) {
            throw new Error('PSBT signature validation failed');
        }
        // Finalize inputs
        psbt.finalizeAllInputs();
        // Extract transaction
        const tx = psbt.extractTransaction();
        return {
            signedTx: tx.toHex(),
            txHash: tx.getId(),
            metadata: {
                inputCount: psbt.inputCount,
                outputCount: psbt.txOutputs.length,
            },
        };
    }
    /**
     * Sign PSBT without finalizing (for partial signing)
     */
    async signPartial(input, privateKey) {
        const psbt = bitcoin.Psbt.fromBase64(input.psbtBase64, { network: this.network });
        const keyPair = {
            publicKey: Buffer.from(ecc.pointFromScalar(privateKey)),
            privateKey,
            sign: (hash) => Buffer.from(ecc.sign(hash, privateKey)),
        };
        for (let i = 0; i < psbt.inputCount; i++) {
            try {
                psbt.signInput(i, keyPair);
            }
            catch (e) {
                // Skip inputs that don't belong to this key
            }
        }
        return {
            signedTx: psbt.toBase64(),
            txHash: '', // Can't compute txId before finalization
            metadata: {
                inputCount: psbt.inputCount,
                outputCount: psbt.txOutputs.length,
            },
        };
    }
}
exports.BtcSigner = BtcSigner;
/**
 * Helper to create a simple P2WPKH PSBT for sending BTC
 */
function createBtcPsbt(inputs, outputs, network = bitcoin.networks.bitcoin) {
    const psbt = new bitcoin.Psbt({ network });
    for (const input of inputs) {
        psbt.addInput({
            hash: input.txid,
            index: input.vout,
            witnessUtxo: input.witnessUtxo,
        });
    }
    for (const output of outputs) {
        psbt.addOutput({
            address: output.address,
            value: output.value,
        });
    }
    return psbt.toBase64();
}
