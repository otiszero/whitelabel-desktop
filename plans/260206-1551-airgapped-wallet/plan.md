---
title: "Air-Gapped Whitelabel Desktop Wallet"
description: "Electron-based offline wallet supporting BTC, ETH, XRP, TRON with UR QR codes"
status: pending
priority: P1
effort: 120h
branch: main
tags: [electron, wallet, air-gapped, security, blockchain]
created: 2026-02-06
---

# Air-Gapped Whitelabel Desktop Wallet

## Executive Summary

Build a secure, air-gapped desktop wallet using Electron that supports 4 blockchains (BTC, ETH, XRP, TRON) with offline transaction signing via UR-encoded animated QR codes. Fully isolated from network - no HTTP/WebSocket requests allowed.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron Main Process                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Network     │  │ Keystore     │  │ IPC Bridge         │ │
│  │ Blocker     │  │ Manager      │  │ (contextBridge)    │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Renderer Process                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    React Application                     ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ ││
│  │  │ Wallet   │  │ Signing  │  │ QR       │  │ Address │ ││
│  │  │ Manager  │  │ Workflow │  │ System   │  │ Book    │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Crypto Core                           ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ ││
│  │  │ BTC      │  │ ETH      │  │ XRP      │  │ TRON    │ ││
│  │  │ Signer   │  │ Signer   │  │ Signer   │  │ Signer  │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Electron 28+ | Desktop runtime |
| UI | React 18 + TypeScript | Component framework |
| Styling | Tailwind CSS 3.4 | Utility-first CSS |
| Build | Vite + electron-builder | Fast dev + cross-platform builds |
| Crypto | Node.js crypto | AES-256-GCM encryption |
| KDF | argon2 | Memory-hard key derivation |
| BTC | bitcoinjs-lib + bip39/bip32 | PSBT signing |
| ETH | ethers.js v6 | EIP-1559 signing |
| XRP | xrpl.js | Payment signing |
| TRON | tronweb | Protobuf signing |
| QR Encode | @ngraveio/bc-ur + qrcode | UR animated QR |
| QR Scan | html5-qrcode | Camera scanning |

## Phase Summary

| Phase | Focus | Effort | Dependencies |
|-------|-------|--------|--------------|
| 1 | Project Setup & Security Foundation | 16h | None |
| 2 | Crypto Core (Keys + Keystore) | 20h | Phase 1 |
| 3 | Blockchain Signers | 32h | Phase 2 |
| 4 | QR System (UR + Camera) | 16h | Phase 1 |
| 5 | Wallet UI | 24h | Phases 2-4 |
| 6 | Whitelabel & Polish | 12h | Phase 5 |

## Security Model

### Network Isolation (Air-Gap)
- Block ALL HTTP/HTTPS/WebSocket requests at session level
- CSP: `connect-src 'none'`
- Disable Chromium background networking
- No external asset loading

### Key Protection
- AES-256-GCM encryption for keystore
- Argon2id KDF (64MB memory, 3 iterations, 4 parallelism)
- Zero-fill buffers after cryptographic operations
- No plaintext keys in logs or error messages

### Input Validation
- Schema validation for all transaction JSON
- Address checksum verification (Base58Check, EIP-55)
- Amount and fee sanity checks
- QR content sanitization

## Directory Structure

```
src/
├── main/                     # Electron main process
│   ├── index.ts              # Entry point
│   ├── network-blocker.ts    # Request interception
│   ├── keystore-service.ts   # Encrypted storage
│   └── preload.ts            # Context bridge
├── renderer/                 # React UI
│   ├── App.tsx
│   ├── components/
│   │   ├── wallet/           # Wallet management
│   │   ├── signing/          # Transaction signing
│   │   ├── qr/               # QR display/scan
│   │   └── common/           # Shared components
│   ├── hooks/
│   ├── stores/               # State management
│   └── utils/
├── crypto/                   # Cryptographic modules
│   ├── key-manager.ts        # BIP39/BIP44
│   ├── keystore.ts           # Encryption/decryption
│   └── signers/
│       ├── btc-signer.ts
│       ├── eth-signer.ts
│       ├── xrp-signer.ts
│       └── tron-signer.ts
├── qr/                       # QR system
│   ├── ur-encoder.ts
│   ├── ur-decoder.ts
│   └── animated-qr.ts
└── config/
    └── whitelabel.ts         # Branding config
```

## Deliverables per Phase

### Phase 1: Project Setup
- Electron + React + TypeScript scaffolding
- Network blocking verified
- CSP configured
- Build scripts for Win/Mac/Linux

### Phase 2: Crypto Core
- BIP39 mnemonic generation
- BIP44 key derivation (all 4 chains)
- AES-256-GCM encrypted keystore
- Argon2id password protection

### Phase 3: Blockchain Signers
- BTC PSBT signing (BIP84 native SegWit)
- ETH EIP-1559 transaction signing
- XRP Payment signing
- TRON transfer signing

### Phase 4: QR System
- UR encoder/decoder with fountain codes
- Animated QR display component
- Camera QR scanner with UR reconstruction

### Phase 5: Wallet UI
- Wallet creation/import wizard
- Transaction signing workflow
- Address book CRUD
- Transaction history (local)

### Phase 6: Whitelabel
- JSON-based branding config
- Runtime theme application
- Logo/color customization
- Build-time asset injection

## Success Criteria

1. **Security**: No network requests possible (verified via DevTools Network tab)
2. **Signing**: All 4 chains sign valid transactions offline
3. **QR**: Animated UR QR codes compatible with Keystone/Sparrow
4. **Cross-platform**: Builds run on Windows, macOS, Linux
5. **Whitelabel**: Branding changeable via config file

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TRON timestamp drift | High | Accept timestamp via QR, validate range |
| Large PSBT exceeds QR capacity | Medium | Fountain codes handle 10KB+ payloads |
| Argon2 native build fails | Medium | Fallback to PBKDF2 with 600K iterations |
| Camera permission denied | Low | Support text paste as fallback |

## Unresolved Questions

1. TRON timestamp: Accept from online device or system clock with manual override?
2. Legacy QR format support for non-UR wallets?
3. HSM integration for enterprise tier?
