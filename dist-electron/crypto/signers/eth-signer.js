"use strict";
/**
 * Ethereum EIP-1559 Transaction Signer
 * Signs EIP-1559 (type 2) transactions for ETH transfers and contract calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETH_CHAIN_IDS = exports.ETH_GAS_ESTIMATES = exports.EthSigner = void 0;
const ethers_1 = require("ethers");
class EthSigner {
    validate(input) {
        const errors = [];
        // Validate 'to' address
        if (!(0, ethers_1.isAddress)(input.to)) {
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
        }
        catch {
            errors.push('Invalid fee values');
        }
        // Validate value
        try {
            const value = BigInt(input.value);
            if (value < 0n) {
                errors.push('Value cannot be negative');
            }
        }
        catch {
            errors.push('Invalid value');
        }
        // Validate data if present
        if (input.data && !/^0x[0-9a-fA-F]*$/.test(input.data)) {
            errors.push('Invalid data format (must be hex string)');
        }
        return { valid: errors.length === 0, errors };
    }
    async sign(input, privateKey) {
        // Create wallet from private key (convert Buffer to hex string)
        const wallet = new ethers_1.Wallet('0x' + privateKey.toString('hex'));
        // Checksummed addresses
        const toAddress = (0, ethers_1.getAddress)(input.to);
        // Build EIP-1559 transaction
        const tx = ethers_1.Transaction.from({
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
        const parsedTx = ethers_1.Transaction.from(signedTx);
        return {
            signedTx,
            txHash: parsedTx.hash,
            metadata: {
                from: wallet.address,
                to: toAddress,
                chainId: input.chainId,
            },
        };
    }
}
exports.EthSigner = EthSigner;
/**
 * Helper to estimate gas for common operations
 */
exports.ETH_GAS_ESTIMATES = {
    TRANSFER: 21000,
    ERC20_TRANSFER: 65000,
    CONTRACT_CALL: 100000,
};
/**
 * Common chain IDs
 */
exports.ETH_CHAIN_IDS = {
    MAINNET: 1,
    GOERLI: 5,
    SEPOLIA: 11155111,
    POLYGON: 137,
    ARBITRUM: 42161,
    OPTIMISM: 10,
};
