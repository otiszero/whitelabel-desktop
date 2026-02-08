/**
 * Bitcoin PSBT Signer
 * Signs PSBTs for BIP84 Native SegWit (P2WPKH) addresses
 */

import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';
import { BaseSigner, BtcSignInput, BtcMeta, ValidationResult, SignerResult } from './types';

// Initialize ECC library
bitcoin.initEccLib(ecc);

export class BtcSigner implements BaseSigner<BtcSignInput, BtcMeta> {
  private network: bitcoin.Network;

  constructor(testnet: boolean = false) {
    this.network = testnet ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  }

  validate(input: BtcSignInput): ValidationResult {
    const errors: string[] = [];

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
    } catch (e) {
      errors.push(`Invalid PSBT: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return { valid: errors.length === 0, errors };
  }

  async sign(input: BtcSignInput, privateKey: Buffer): Promise<SignerResult<BtcMeta>> {
    // Parse PSBT
    const psbt = bitcoin.Psbt.fromBase64(input.psbtBase64, { network: this.network });

    // Create ECPair from private key
    const keyPair = {
      publicKey: Buffer.from(ecc.pointFromScalar(privateKey)!),
      privateKey,
      sign: (hash: Buffer) => Buffer.from(ecc.sign(hash, privateKey)),
    };

    // Sign all inputs
    for (let i = 0; i < psbt.inputCount; i++) {
      try {
        psbt.signInput(i, keyPair);
      } catch (e) {
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
  async signPartial(input: BtcSignInput, privateKey: Buffer): Promise<SignerResult<BtcMeta>> {
    const psbt = bitcoin.Psbt.fromBase64(input.psbtBase64, { network: this.network });

    const keyPair = {
      publicKey: Buffer.from(ecc.pointFromScalar(privateKey)!),
      privateKey,
      sign: (hash: Buffer) => Buffer.from(ecc.sign(hash, privateKey)),
    };

    for (let i = 0; i < psbt.inputCount; i++) {
      try {
        psbt.signInput(i, keyPair);
      } catch (e) {
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

/**
 * Helper to create a simple P2WPKH PSBT for sending BTC
 */
export function createBtcPsbt(
  inputs: Array<{
    txid: string;
    vout: number;
    witnessUtxo: { script: Buffer; value: bigint };
  }>,
  outputs: Array<{ address: string; value: bigint }>,
  network: bitcoin.Network = bitcoin.networks.bitcoin
): string {
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
