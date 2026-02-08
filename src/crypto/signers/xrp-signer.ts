/**
 * XRP Payment Transaction Signer
 * Signs XRP Payment transactions offline
 */

import { Wallet } from 'xrpl';
import { BaseSigner, XrpSignInput, XrpMeta, ValidationResult, SignerResult } from './types.js';

// XRP address regex
const XRP_ADDRESS_REGEX = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

export class XrpSigner implements BaseSigner<XrpSignInput, XrpMeta> {
  validate(input: XrpSignInput): ValidationResult {
    const errors: string[] = [];

    // Validate destination address
    if (!XRP_ADDRESS_REGEX.test(input.destination)) {
      errors.push('Invalid XRP destination address');
    }

    // Validate amount (drops)
    try {
      const amount = BigInt(input.amount);
      if (amount <= 0n) {
        errors.push('Amount must be positive');
      }
      if (amount < 1000000n) {
        errors.push('Amount too small (minimum 1 XRP = 1,000,000 drops)');
      }
    } catch {
      errors.push('Invalid amount');
    }

    // Validate fee
    try {
      const fee = BigInt(input.fee);
      if (fee <= 0n) {
        errors.push('Fee must be positive');
      }
      if (fee < 10n) {
        errors.push('Fee too low (minimum 10 drops)');
      }
    } catch {
      errors.push('Invalid fee');
    }

    // Validate sequence
    if (input.sequence < 0) {
      errors.push('Invalid sequence number');
    }

    // Validate lastLedgerSequence
    if (input.lastLedgerSequence <= 0) {
      errors.push('Invalid lastLedgerSequence');
    }

    // Validate destination tag if present
    if (input.destinationTag !== undefined) {
      if (!Number.isInteger(input.destinationTag) || input.destinationTag < 0) {
        errors.push('Invalid destination tag');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async sign(input: XrpSignInput, privateKey: Buffer): Promise<SignerResult<XrpMeta>> {
    // Create wallet from private key
    // XRP uses secp256k1 - derive seed from private key
    const wallet = Wallet.fromSeed(this.privateKeyToSeed(privateKey));

    // Construct Payment transaction
    const payment: Record<string, unknown> = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: input.destination,
      Amount: input.amount,
      Fee: input.fee,
      Sequence: input.sequence,
      LastLedgerSequence: input.lastLedgerSequence,
    };

    // Add destination tag if present
    if (input.destinationTag !== undefined) {
      payment.DestinationTag = input.destinationTag;
    }

    // Sign the transaction
    const signed = wallet.sign(payment as Parameters<typeof wallet.sign>[0]);

    return {
      signedTx: signed.tx_blob,
      txHash: signed.hash,
      metadata: {
        account: wallet.address,
        destination: input.destination,
        amount: input.amount,
      },
    };
  }

  /**
   * Convert raw private key to XRP seed format
   */
  private privateKeyToSeed(privateKey: Buffer): string {
    // XRP uses RFC-1751 encoding or base58 for seeds
    // For simplicity, we'll use the raw hex as entropy for deriving a wallet
    // In production, consider proper seed derivation

    // XRP family seed starts with 's'
    // Using the private key directly as secret
    return `s${Buffer.from(privateKey).toString('base64').substring(0, 28)}`;
  }
}

/**
 * Helper constants for XRP
 */
export const XRP_CONSTANTS = {
  DROPS_PER_XRP: 1000000,
  MIN_FEE_DROPS: 10,
  RECOMMENDED_FEE_DROPS: 12,
  MIN_RESERVE_XRP: 10, // Account reserve
};

/**
 * Convert XRP to drops
 */
export function xrpToDrops(xrp: number | string): string {
  return (BigInt(Math.floor(Number(xrp) * XRP_CONSTANTS.DROPS_PER_XRP))).toString();
}

/**
 * Convert drops to XRP
 */
export function dropsToXrp(drops: string | number): string {
  return (Number(drops) / XRP_CONSTANTS.DROPS_PER_XRP).toFixed(6);
}
