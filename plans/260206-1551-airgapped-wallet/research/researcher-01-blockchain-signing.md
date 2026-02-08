# Offline Transaction Signing Across 4 Blockchains
**Research Report | 2026-02-06**

---

## 1. Bitcoin (BTC) Offline Signing

### bitcoinjs-lib PSBT Implementation
- **PSBT Standard**: BIP174 format enables multi-sig + offline workflows
- **Required Data**: Full UTXO metadata (witnessUtxo for SegWit, nonWitnessUtxo for legacy)
- **BIP32 Info**: Include master fingerprint + full derivation path for offline signer validation

### Derivation Paths
- **BIP44** (Legacy P2PKH): `m/44'/0'/0'/0/x` → addresses "1..."
- **BIP49** (SegWit-Nested P2SH): `m/49'/0'/0'/0/x` → addresses "3..."
- **BIP84** (Native SegWit Bech32): `m/84'/0'/0'/0/x` → addresses "bc1q..."
- **BIP86** (Taproot): `m/86'/0'/0'/0/x` → addresses "bc1p..."

### Offline Workflow
1. Online device: Construct PSBT with full UTXOs + derivation metadata + sighash type
2. Serialize to Base64, transfer to offline signer
3. Offline signer: Derive key from seed, verify outputs, sign inputs
4. Return partially signed PSBT
5. Online device: Finalize + broadcast

### Key Requirements
- Explicit sighash type (typically SIGHASH_ALL)
- RBF support: Set sequence < 0xffffffff
- Taproot (P2TR) preferred for 2024: Efficiency + privacy
- Use correct xpub/ypub/zpub prefixes for type matching

---

## 2. Ethereum (ETH) Offline Signing

### ethers.js Wallet Class Approach
- **No Provider Required**: Wallet class is standalone signer using only private key
- **Zero Network Calls**: All signing done locally
- Ideal for cold storage + airgapped setups

### EIP-1559 Transaction Structure
Must manually provide all fields (wallet.signTransaction() does NOT auto-populate):

| Field | Example | Purpose |
|-------|---------|---------|
| `type` | `2` | Specifies EIP-1559 |
| `chainId` | `1` (mainnet), `11155111` (Sepolia) | Network identifier |
| `nonce` | Must track manually | Transaction sequence |
| `maxPriorityFeePerGas` | `2 gwei` | Validator tip |
| `maxFeePerGas` | `100 gwei` | Max fee cap |
| `gasLimit` | `21000` (transfer), varies for contract | Execution units |
| `to` | `0x...` | Recipient |
| `value` | `wei` | Amount sent |

### Offline Pattern
```javascript
const signedTx = await wallet.signTransaction({
  type: 2,
  chainId: 1,
  to: "0x...",
  value: ethers.parseEther("1.0"),
  nonce: 0,
  maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
  maxFeePerGas: ethers.parseUnits("100", "gwei"),
  gasLimit: 21000
});
// Returns raw signed transaction hex
```

### Critical Notes
- Online device must provide accurate nonce (track account tx count)
- Gas params must be obtained from online device before signing
- Signed tx is deterministic + can be broadcast anytime
- Private key never exposed to network

---

## 3. XRP (Ripple) Offline Signing

### xrpl.js Architecture
- **Wallet.fromSeed()**: Load key from seed string
- **wallet.sign(txJSON)**: Sign locally, returns signed tx_blob
- **No Provider Connection Needed**: Works fully offline

### Payment Transaction Structure
Required fields for offline construction:

```javascript
{
  "TransactionType": "Payment",
  "Account": wallet.address,
  "Destination": "rN7n7otQDd6FczFgLdhmKiQNaVfnfvZsKg",
  "DeliverMax": "10000000",  // Amount in drops (1 XRP = 1M drops)
  "Fee": "12",               // Minimum 10 drops (2024)
  "Sequence": 12345,         // Current account sequence
  "LastLedgerSequence": 95000020  // Ledger expiry protection
}
```

### Offline Workflow
1. Online device: Query account sequence, current ledger index, fees
2. Offline device: Construct txJSON, call wallet.sign()
3. Return tx_blob (binary blob)
4. Online device: client.submit(signed.tx_blob)

### Key Security Points
- **LastLedgerSequence**: Prevents replay if network stalls
- **Sequence**: Must increment per account tx (online device tracks)
- **Minimum Fee**: 10 drops (12 recommended to avoid congestion)
- Transfer via QR code or physical media

---

## 4. TRON Offline Signing

### Transaction Structure (Protobuf-Based)
TRON uses Protocol Buffers for compact, deterministic encoding:

**Transaction = raw_data + signature**

- **raw_data**: Contains contract operations
  - contract type (TransferContract for TRX transfers)
  - owner_address, to_address, amount
  - timestamp, expiration
- **signature**: Cryptographic signature (offline-generated)

### Transaction Types
- **TRX transfers**: Simple native token transfers
- **TRC-10**: Token movements (deprecated, TRC-20 preferred)
- **TRC-20**: ERC20-compatible contracts (requires contract call data)
- **Smart contracts**: State-changing operations

### Offline Signing Process
1. Online device: Construct Protobuf transaction raw_data
2. Offline device: Serialize, sign with private key
3. Return signed transaction blob
4. Online device: Broadcast to network

### Key Implementation Notes
- No full node connection required for signing
- Protobuf ensures compact + cross-platform compatibility
- Private key never exposed to online environment
- Broadcast can happen from separate device

---

## 5. Common Patterns Across All Chains

### Data Required from Online Device

| Chain | Required Data |
|-------|---------------|
| **Bitcoin** | UTXOs, current tx count, derivation metadata |
| **Ethereum** | Nonce, gas prices (maxPriorityFeePerGas, maxFeePerGas) |
| **XRP** | Account sequence, ledger index, fees |
| **TRON** | Current timestamp, expiration block |

### Transaction Format Standards
- **Bitcoin**: PSBT (BIP174) or raw tx hex
- **Ethereum**: EIP-1559 tx object or raw tx hex
- **XRP**: txJSON object
- **TRON**: Protobuf binary or JSON representation

### Signature Encoding
- **Bitcoin**: Signature in PSBT includes sighash, or raw DER in scripts
- **Ethereum**: Raw tx hash signed with ECDSA, included in tx object
- **XRP**: ED25519 signature encoding, embedded in tx_blob
- **TRON**: Signature appended to transaction, compatible with chain

### Airgapped Device Requirements
1. Local key generation or seed import
2. Standalone signing library (no network calls)
3. Transaction serialization/deserialization
4. Secure data transfer (QR codes, USB, physical media)
5. Timestamp sync (optional for most chains, critical for TRON)

---

## Unresolved Questions

1. How to handle TRON timestamp sync in airgapped scenario (manual entry vs. pre-calculated range)?
2. Best practice for transferring large tx data offline (QR code chunking strategies)?
3. Nonce management for Ethereum in multi-signature scenarios?
4. XRP account reserve handling in offline Payment construction?
