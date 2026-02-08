# AirGap Wallet

A secure, air-gapped desktop wallet supporting BTC, ETH, XRP, and TRON. All transaction signing happens offline - your private keys never leave the device.

## Features

- **Air-Gapped Security**: Complete network isolation - no HTTP/WebSocket requests allowed
- **Multi-Chain Support**: Bitcoin, Ethereum, XRP, and TRON
- **UR QR Codes**: Animated QR codes for large transactions (compatible with Keystone, Sparrow)
- **Whitelabel Ready**: Fully customizable branding via JSON configuration
- **Cross-Platform**: Windows, macOS, and Linux builds

## Quick Start

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build:electron
```

## Architecture

```
src/
├── main/           # Electron main process
│   ├── index.ts    # App entry, window creation
│   ├── network-blocker.ts  # Air-gap enforcement
│   ├── keystore-service.ts # Wallet management
│   └── signer-service.ts   # Transaction signing
├── renderer/       # React UI
│   ├── App.tsx     # Main app layout
│   ├── pages/      # Page components
│   ├── components/ # Reusable components
│   └── stores/     # Zustand state management
├── crypto/         # Cryptographic modules
│   ├── key-manager.ts  # BIP39/BIP44 keys
│   ├── keystore.ts     # AES-256-GCM encryption
│   └── signers/        # Chain-specific signers
└── qr/             # QR encoding/decoding
    ├── ur-encoder.ts   # UR fountain codes
    └── ur-decoder.ts   # UR reconstruction
```

## Security Model

### Network Isolation
- All HTTP/HTTPS/WebSocket requests blocked at Electron session level
- CSP: `connect-src 'none'`
- Chromium background networking disabled

### Key Protection
- AES-256-GCM encryption for keystore
- Argon2id KDF (64MB memory, 3 iterations)
- Memory zeroed after cryptographic operations

## Whitelabel Configuration

Edit `src/config/whitelabel.json` to customize:

```json
{
  "appName": "Your Wallet",
  "theme": {
    "primaryColor": "#3B82F6",
    "backgroundColor": "#0F172A"
  },
  "branding": {
    "companyName": "Your Company",
    "tagline": "Your tagline"
  }
}
```

## Supported Transactions

| Chain | Type | Format |
|-------|------|--------|
| BTC | Native SegWit | PSBT |
| ETH | EIP-1559 | RLP-encoded |
| XRP | Payment | XRP binary |
| TRON | Transfer | Protobuf |

## Development

### Prerequisites
- Node.js 18+
- npm 9+

### Commands

```bash
npm run dev          # Start in development mode
npm run build        # Build TypeScript + Vite
npm run build:electron  # Build distributable
npm run typecheck    # Run TypeScript checks
```

## License

MIT
