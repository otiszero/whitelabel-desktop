/**
 * Ethereum EIP-1559 Transaction Signer
 * Signs EIP-1559 (type 2) transactions for ETH transfers and contract calls
 */

import { Wallet, Transaction, getAddress, isAddress } from 'ethers';
import { BaseSigner, EthSignInput, EthMeta, ValidationResult, SignerResult } from './types.js';

export class EthSigner implements BaseSigner<EthSignInput, EthMeta> {
  validate(input: EthSignInput): ValidationResult {
    const errors: string[] = [];

    // Validate 'to' address
    if (!isAddress(input.to)) {
      errors.push('Invalid recipient address');
    }

    // Validate chainId
    if (input.chainId <= 0) {
      errors.push('Invalid chainId');
    }

    // Validate nonce
    if (input.nonce < 0) {
      errors.push('Invalid nonce');
    }

    // Validate gas limit
    if (input.gasLimit < 21000) {
      errors.push('Gas limit must be at least 21000');
    }

    // Validate fee values
    try {
      const maxFee = BigInt(input.maxFeePerGas);
      const maxPriorityFee = BigInt(input.maxPriorityFeePerGas);

      if (maxFee < 0n) {
        errors.push('maxFeePerGas cannot be negative');
      }
      if (maxPriorityFee < 0n) {
        errors.push('maxPriorityFeePerGas cannot be negative');
      }
      if (maxPriorityFee > maxFee) {
        errors.push('maxPriorityFeePerGas cannot exceed maxFeePerGas');
      }
    } catch {
      errors.push('Invalid fee values');
    }

    // Validate value
    try {
      const value = BigInt(input.value);
      if (value < 0n) {
        errors.push('Value cannot be negative');
      }
    } catch {
      errors.push('Invalid value');
    }

    // Validate data if present
    if (input.data && !/^0x[0-9a-fA-F]*$/.test(input.data)) {
      errors.push('Invalid data format (must be hex string)');
    }

    return { valid: errors.length === 0, errors };
  }

  async sign(input: EthSignInput, privateKey: Buffer): Promise<SignerResult<EthMeta>> {
    // Create wallet from private key (convert Buffer to hex string)
    const wallet = new Wallet('0x' + privateKey.toString('hex'));

    // Checksummed addresses
    const toAddress = getAddress(input.to);

    // Build EIP-1559 transaction
    const tx = Transaction.from({
      type: 2,
      chainId: input.chainId,
      nonce: input.nonce,
      to: toAddress,
      value: BigInt(input.value),
      maxPriorityFeePerGas: BigInt(input.maxPriorityFeePerGas),
      maxFeePerGas: BigInt(input.maxFeePerGas),
      gasLimit: BigInt(input.gasLimit),
      data: input.data || '0x',
    });

    // Sign the transaction
    const signedTx = await wallet.signTransaction(tx);

    // Parse signed transaction to get hash
    const parsedTx = Transaction.from(signedTx);

    return {
      signedTx,
      txHash: parsedTx.hash!,
      metadata: {
        from: wallet.address,
        to: toAddress,
        chainId: input.chainId,
      },
    };
  }
}

/**
 * Helper to estimate gas for common operations
 */
export const ETH_GAS_ESTIMATES = {
  TRANSFER: 21000,
  ERC20_TRANSFER: 65000,
  CONTRACT_CALL: 100000,
};

/**
 * Common chain IDs
 */
export const ETH_CHAIN_IDS = {
  MAINNET: 1,
  GOERLI: 5,
  SEPOLIA: 11155111,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
};
