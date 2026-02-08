# Phase 3: Blockchain Signers

## Context
Depends on Phase 2 (key manager). Implements offline transaction signing for BTC, ETH, XRP, TRON. Each signer is standalone - no network calls.

## Overview
- Bitcoin PSBT signing (BIP84 Native SegWit)
- Ethereum EIP-1559 transaction signing
- XRP Payment transaction signing
- TRON TRX transfer signing

## Requirements
- Sign transactions using derived private keys
- Return serialized signed transactions
- Validate transaction structure before signing
- Support common transaction types per chain

## Architecture

### Signer Module Structure
```
src/crypto/signers/
├── types.ts              # Shared signer interfaces
├── btc-signer.ts         # Bitcoin PSBT
├── eth-signer.ts         # Ethereum EIP-1559
├── xrp-signer.ts         # XRP Payment
└── tron-signer.ts        # TRON Transfer
```

### Common Signer Interface
```typescript
interface SignerResult<T> {
  signedTx: string;      // Hex or base64 encoded
  txHash: string;        // Transaction ID
  metadata: T;           // Chain-specific metadata
}

interface Signer<TxInput, TxMeta> {
  validate(tx: TxInput): ValidationResult;
  sign(tx: TxInput, privateKey: Buffer): Promise<SignerResult<TxMeta>>;
}
```

## Implementation Steps

### 3.1 Install Dependencies (1h)
```bash
npm install bitcoinjs-lib @bitcoinerlab/secp256k1
npm install ethers@6
npm install xrpl ripple-keypairs
npm install tronweb
```

### 3.2 Bitcoin PSBT Signer (8h)
**src/crypto/signers/btc-signer.ts**

```typescript
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';

bitcoin.initEccLib(ecc);

interface BtcSignInput {
  psbtBase64: string;     // PSBT from online device
  derivationPath: string; // e.g., m/84'/0'/0'/0/0
}

export class BtcSigner implements Signer<BtcSignInput, BtcMeta> {
  validate(input: BtcSignInput): ValidationResult {
    // Parse PSBT, verify inputs have witnessUtxo
    // Check derivation path matches BIP32 info
  }

  async sign(input: BtcSignInput, privateKey: Buffer): Promise<SignerResult<BtcMeta>> {
    const psbt = bitcoin.Psbt.fromBase64(input.psbtBase64);
    const keyPair = ECPair.fromPrivateKey(privateKey);

    psbt.signAllInputs(keyPair);
    // Do NOT finalize - return partially signed

    return {
      signedTx: psbt.toBase64(),
      txHash: psbt.extractTransaction().getId(),
      metadata: { inputCount: psbt.inputCount }
    };
  }
}
```

Key considerations:
- Support BIP84 (bc1q) addresses primarily
- Include witness UTXO validation
- Don't finalize PSBT (online device does this)

### 3.3 Ethereum EIP-1559 Signer (6h)
**src/crypto/signers/eth-signer.ts**

```typescript
import { Wallet, Transaction } from 'ethers';

interface EthSignInput {
  chainId: number;
  nonce: number;
  to: string;
  value: string;              // Wei as string
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  gasLimit: number;
  data?: string;              // For contract calls
}

export class EthSigner implements Signer<EthSignInput, EthMeta> {
  validate(input: EthSignInput): ValidationResult {
    // Validate address checksum (EIP-55)
    // Check gasLimit > 21000
    // Verify nonce is non-negative
  }

  async sign(input: EthSignInput, privateKey: Buffer): Promise<SignerResult<EthMeta>> {
    const wallet = new Wallet(privateKey);

    const tx: Transaction = {
      type: 2,  // EIP-1559
      chainId: input.chainId,
      nonce: input.nonce,
      to: input.to,
      value: BigInt(input.value),
      maxPriorityFeePerGas: BigInt(input.maxPriorityFeePerGas),
      maxFeePerGas: BigInt(input.maxFeePerGas),
      gasLimit: BigInt(input.gasLimit),
      data: input.data || '0x'
    };

    const signedTx = await wallet.signTransaction(tx);
    return {
      signedTx,
      txHash: Transaction.from(signedTx).hash!,
      metadata: { from: wallet.address }
    };
  }
}
```

### 3.4 XRP Payment Signer (6h)
**src/crypto/signers/xrp-signer.ts**

```typescript
import { Wallet, Payment, encode } from 'xrpl';

interface XrpSignInput {
  destination: string;
  amount: string;           // Drops (1 XRP = 1,000,000 drops)
  fee: string;              // Drops
  sequence: number;
  lastLedgerSequence: number;
  destinationTag?: number;
}

export class XrpSigner implements Signer<XrpSignInput, XrpMeta> {
  validate(input: XrpSignInput): ValidationResult {
    // Validate r-address format
    // Check sequence > 0
    // Verify lastLedgerSequence reasonable
  }

  async sign(input: XrpSignInput, privateKey: Buffer): Promise<SignerResult<XrpMeta>> {
    const wallet = Wallet.fromSeed(/* derive seed from privateKey */);

    const payment: Payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: input.destination,
      Amount: input.amount,
      Fee: input.fee,
      Sequence: input.sequence,
      LastLedgerSequence: input.lastLedgerSequence
    };

    if (input.destinationTag) {
      payment.DestinationTag = input.destinationTag;
    }

    const signed = wallet.sign(payment);
    return {
      signedTx: signed.tx_blob,
      txHash: signed.hash,
      metadata: { account: wallet.address }
    };
  }
}
```

### 3.5 TRON Transfer Signer (8h)
**src/crypto/signers/tron-signer.ts**

```typescript
import TronWeb from 'tronweb';

interface TronSignInput {
  to: string;               // T... address
  amount: number;           // Sun (1 TRX = 1,000,000 Sun)
  timestamp: number;        // From online device
  expiration: number;       // Block expiration
  refBlockBytes: string;
  refBlockHash: string;
}

export class TronSigner implements Signer<TronSignInput, TronMeta> {
  validate(input: TronSignInput): ValidationResult {
    // Validate T-address format
    // Check timestamp within 24h
    // Verify expiration > timestamp
  }

  async sign(input: TronSignInput, privateKey: Buffer): Promise<SignerResult<TronMeta>> {
    // Construct raw transaction protobuf
    const rawTx = {
      txID: '',
      raw_data: {
        contract: [{
          type: 'TransferContract',
          parameter: {
            value: {
              to_address: TronWeb.address.toHex(input.to),
              owner_address: TronWeb.address.toHex(ownerAddress),
              amount: input.amount
            }
          }
        }],
        timestamp: input.timestamp,
        expiration: input.expiration,
        ref_block_bytes: input.refBlockBytes,
        ref_block_hash: input.refBlockHash
      }
    };

    const signedTx = TronWeb.utils.crypto.signTransaction(privateKey, rawTx);
    return {
      signedTx: JSON.stringify(signedTx),
      txHash: signedTx.txID,
      metadata: { owner: ownerAddress }
    };
  }
}
```

### 3.6 Signer Service (IPC) (3h)
**src/main/signer-service.ts**

IPC handlers:
- `signer:btc:sign` - Sign Bitcoin PSBT
- `signer:eth:sign` - Sign Ethereum tx
- `signer:xrp:sign` - Sign XRP payment
- `signer:tron:sign` - Sign TRON transfer

Each handler: unlock keystore → get private key → sign → zero-fill → return

## Todo Checklist
- [ ] Install blockchain dependencies
- [ ] Define shared signer types
- [ ] Implement btc-signer.ts
  - [ ] PSBT parsing
  - [ ] Input validation
  - [ ] Signing logic
- [ ] Implement eth-signer.ts
  - [ ] EIP-1559 tx construction
  - [ ] Address validation
  - [ ] Signing logic
- [ ] Implement xrp-signer.ts
  - [ ] Payment construction
  - [ ] Address validation
  - [ ] Signing logic
- [ ] Implement tron-signer.ts
  - [ ] Protobuf construction
  - [ ] Address validation
  - [ ] Signing logic
- [ ] Implement signer-service.ts (IPC)
- [ ] Add preload API for signing
- [ ] Unit tests with known test vectors
- [ ] Integration tests (sign → verify)

## Success Criteria
1. BTC: Signed PSBT validates in Sparrow Wallet
2. ETH: Signed tx decodes correctly (ethers.js Transaction.from)
3. XRP: Signed tx_blob verifies with xrpl.js
4. TRON: Signed tx accepted by TronGrid testnet

## Risks
| Risk | Mitigation |
|------|------------|
| TronWeb bundle size large | Tree-shake, use only crypto utils |
| bitcoinjs-lib needs secp256k1 | Use @bitcoinerlab/secp256k1 (pure JS) |

## Estimated Effort: 32h
