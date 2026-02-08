# UR QR Codes & Security Research
**Research Report | 2026-02-06**

---

## 1. UR (Uniform Resources) Format

### BC-UR Specification (Blockchain Commons)
- **Purpose**: Transport large data payloads via animated QR sequences
- **Encoding**: CBOR data → Bytewords encoding → Fountain codes for chunking
- **Fountain Codes**: Rateless erasure codes allowing recovery from any subset of fragments

### Key Libraries
| Library | Platform | Notes |
|---------|----------|-------|
| `@ngraveio/bc-ur` | JS/TS | Most active, TypeScript support |
| `bc-ur` | JS | Original Blockchain Commons |
| `URKit` | Swift | iOS native |
| `ur-rs` | Rust | High performance |

### UR Types for Wallets
- `crypto-psbt`: Bitcoin PSBTs
- `crypto-account`: Account descriptors
- `crypto-hdkey`: HD key export
- `crypto-request`: Generic signing requests
- `eth-sign-request`: Ethereum tx signing (EIP-4527)

### Animated QR Flow
1. Encoder splits payload into fragments using fountain codes
2. Each fragment → QR code frame
3. Display cycles through frames (100-300ms intervals)
4. Decoder captures any sufficient subset → reconstructs original

---

## 2. QR Code Implementation

### Rendering Libraries
```javascript
// qrcode (recommended)
import QRCode from 'qrcode';
const dataUrl = await QRCode.toDataURL(data, { errorCorrectionLevel: 'M' });

// For canvas rendering
await QRCode.toCanvas(canvasElement, data);
```

### Camera Scanning
```javascript
// html5-qrcode (recommended for Electron)
import { Html5Qrcode } from 'html5-qrcode';
const scanner = new Html5Qrcode("reader");
await scanner.start(cameraId, config, onSuccess, onError);
```

### Best Practices
- **Error Correction**: Level M (15%) balances size vs reliability
- **Frame Rate**: 150-200ms per frame for animated QR
- **Module Size**: Minimum 4px per module for reliable scanning
- **Quiet Zone**: Maintain 4-module white border

---

## 3. Secure Key Storage

### AES-256-GCM Encryption (Node.js crypto)
```javascript
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';

// Encryption
const iv = randomBytes(12); // 96-bit IV for GCM
const key = await deriveKey(password, salt);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
const authTag = cipher.getAuthTag(); // 16 bytes
```

### Key Derivation: Argon2id vs PBKDF2
| Algorithm | Recommendation | Parameters |
|-----------|----------------|------------|
| **Argon2id** | Preferred (memory-hard) | m=64MB, t=3, p=4 |
| **PBKDF2** | Fallback (widely supported) | 600,000 iterations, SHA-256 |

```javascript
// Argon2id via argon2 package
import argon2 from 'argon2';
const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536, // 64MB
  timeCost: 3,
  parallelism: 4
});
```

### Keystore File Format (JSON)
```json
{
  "version": 1,
  "id": "uuid-v4",
  "crypto": {
    "cipher": "aes-256-gcm",
    "ciphertext": "hex-encoded",
    "cipherparams": { "iv": "hex-12-bytes" },
    "kdf": "argon2id",
    "kdfparams": { "salt": "hex", "m": 65536, "t": 3, "p": 4 },
    "mac": "hex-auth-tag"
  },
  "wallets": [{ "chain": "btc", "path": "m/84'/0'/0'" }]
}
```

---

## 4. Air-Gapped Security Patterns

### Disable Network in Electron
```javascript
// main.js - Block all network requests
const { session } = require('electron');

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (details.url.startsWith('http')) {
      callback({ cancel: true });
    } else {
      callback({});
    }
  });
});

// Also disable Node.js network modules
app.commandLine.appendSwitch('disable-background-networking');
```

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  connect-src 'none';
  img-src 'self' data: blob:;
">
```

### Memory Security
- Use `sodium-native` for secure memory allocation
- Zero-fill buffers after use: `buffer.fill(0)`
- Avoid string concatenation with keys (immutable strings persist)
- Use WeakRef for key objects when possible

### Input Validation
- Validate transaction JSON schema before parsing
- Check address checksums (Base58Check, EIP-55, X-address)
- Verify amount ranges and fee sanity
- Sanitize all QR-scanned input

---

## 5. Reference Implementations

### Keystone (formerly Cobo Vault)
- Uses BC-UR for all QR communication
- Supports `crypto-psbt`, `eth-sign-request`
- Open-source firmware: github.com/KeystoneHQ

### AirGap Vault
- Two-app architecture (Vault offline, Wallet online)
- Uses custom QR protocol (not UR)
- Supports 50+ chains

### Sparrow Wallet
- Bitcoin-focused desktop wallet
- Full PSBT/UR support
- Excellent reference for BTC signing flow

---

## Recommended Stack

| Component | Library | Reason |
|-----------|---------|--------|
| UR Encoding | `@ngraveio/bc-ur` | Active maintenance, TS |
| QR Render | `qrcode` | Lightweight, flexible |
| QR Scan | `html5-qrcode` | Works in Electron |
| Encryption | `crypto` (Node) | Native, audited |
| KDF | `argon2` | Memory-hard, secure |
| Secure Memory | `sodium-native` | Zeroing, locking |

---

## Unresolved Questions

1. Should we support legacy non-UR QR formats for compatibility?
2. Optimal fountain code fragment size for mobile scanning?
3. Hardware security module (HSM) integration for enterprise?
