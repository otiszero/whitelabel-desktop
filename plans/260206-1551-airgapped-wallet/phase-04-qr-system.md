# Phase 4: QR System (UR + Camera)

## Context
Depends on Phase 1 (UI shell). Implements UR (Uniform Resources) animated QR codes for air-gapped data transfer. Used for both input (scanning) and output (display).

## Overview
- UR encoder/decoder using @ngraveio/bc-ur
- Animated QR display with fountain codes
- Camera QR scanner with frame reconstruction
- Text paste fallback for large payloads

## Requirements
- Support payloads up to 10KB+
- Compatible with Keystone, Sparrow, BlueWallet
- Frame rate: 150-200ms per frame
- Error correction: Level M (15%)

## Architecture

### QR Module Structure
```
src/qr/
├── ur-encoder.ts         # Payload → UR frames
├── ur-decoder.ts         # UR frames → payload
├── types.ts              # UR type definitions
└── constants.ts          # Frame timing, sizes

src/renderer/components/qr/
├── animated-qr-display.tsx   # Render animated QR
├── qr-scanner.tsx            # Camera scanning
└── text-fallback.tsx         # Paste/copy UI
```

### UR Types Used
```typescript
type URType =
  | 'crypto-psbt'        // Bitcoin PSBT
  | 'eth-sign-request'   // Ethereum tx (EIP-4527)
  | 'xrp-tx'             // XRP transaction
  | 'bytes'              // Generic binary (TRON)
  | 'crypto-signature';  // Signed result
```

## Implementation Steps

### 4.1 Install Dependencies (1h)
```bash
npm install @ngraveio/bc-ur
npm install qrcode html5-qrcode
npm install -D @types/qrcode
```

### 4.2 UR Encoder (4h)
**src/qr/ur-encoder.ts**

```typescript
import { UREncoder, UR } from '@ngraveio/bc-ur';

interface EncodeOptions {
  type: URType;
  maxFragmentLength?: number;  // Default 100 bytes
}

export class AnimatedUREncoder {
  private encoder: UREncoder;
  private frames: string[] = [];

  constructor(data: Buffer, options: EncodeOptions) {
    const ur = UR.fromBuffer(data, options.type);
    this.encoder = new UREncoder(ur, options.maxFragmentLength ?? 100);
  }

  // Get all frames for pre-rendering
  getAllFrames(): string[] {
    if (this.frames.length === 0) {
      while (!this.encoder.isComplete()) {
        this.frames.push(this.encoder.nextPart().toUpperCase());
      }
      // Add redundant frames for reliability
      for (let i = 0; i < 5; i++) {
        this.frames.push(this.encoder.nextPart().toUpperCase());
      }
    }
    return this.frames;
  }

  get fragmentCount(): number {
    return this.encoder.fragmentsLength;
  }
}
```

### 4.3 UR Decoder (4h)
**src/qr/ur-decoder.ts**

```typescript
import { URDecoder } from '@ngraveio/bc-ur';

export class AnimatedURDecoder {
  private decoder = new URDecoder();

  // Returns progress 0-100
  receive(frame: string): number {
    this.decoder.receivePart(frame);
    return Math.round(this.decoder.estimatedPercentComplete() * 100);
  }

  isComplete(): boolean {
    return this.decoder.isComplete();
  }

  getResult(): { type: string; data: Buffer } | null {
    if (!this.isComplete()) return null;

    const ur = this.decoder.resultUR();
    return {
      type: ur.type,
      data: ur.decodeCBOR()
    };
  }

  reset(): void {
    this.decoder = new URDecoder();
  }
}
```

### 4.4 Animated QR Display Component (3h)
**src/renderer/components/qr/animated-qr-display.tsx**

```typescript
interface AnimatedQRProps {
  data: Buffer;
  urType: URType;
  size?: number;           // Default 300px
  frameInterval?: number;  // Default 150ms
}

export function AnimatedQRDisplay({ data, urType, size = 300, frameInterval = 150 }: AnimatedQRProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [qrDataUrls, setQrDataUrls] = useState<string[]>([]);

  useEffect(() => {
    const encoder = new AnimatedUREncoder(data, { type: urType });
    const frames = encoder.getAllFrames();

    // Pre-render all QR codes
    Promise.all(frames.map(f => QRCode.toDataURL(f, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size
    }))).then(setQrDataUrls);
  }, [data, urType, size]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(f => (f + 1) % qrDataUrls.length);
    }, frameInterval);
    return () => clearInterval(interval);
  }, [qrDataUrls.length, frameInterval]);

  return (
    <div className="qr-container">
      <img src={qrDataUrls[currentFrame]} alt="QR Code" />
      <div className="progress">Frame {currentFrame + 1} / {qrDataUrls.length}</div>
    </div>
  );
}
```

### 4.5 QR Scanner Component (4h)
**src/renderer/components/qr/qr-scanner.tsx**

```typescript
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onComplete: (result: { type: string; data: Buffer }) => void;
  onError: (error: Error) => void;
}

export function QRScanner({ onComplete, onError }: QRScannerProps) {
  const [progress, setProgress] = useState(0);
  const decoderRef = useRef(new AnimatedURDecoder());
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleScan = useCallback((text: string) => {
    // Check if UR format
    if (text.toLowerCase().startsWith('ur:')) {
      const pct = decoderRef.current.receive(text);
      setProgress(pct);

      if (decoderRef.current.isComplete()) {
        const result = decoderRef.current.getResult();
        if (result) onComplete(result);
      }
    }
  }, [onComplete]);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      handleScan,
      () => {} // Ignore non-QR frames
    ).catch(onError);

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [handleScan, onError]);

  return (
    <div>
      <div id="qr-reader" />
      <progress value={progress} max={100} />
      <span>{progress}% complete</span>
    </div>
  );
}
```

## Todo Checklist
- [ ] Install QR dependencies
- [ ] Define UR types and constants
- [ ] Implement ur-encoder.ts
  - [ ] Fragment generation
  - [ ] Fountain code support
- [ ] Implement ur-decoder.ts
  - [ ] Frame reception
  - [ ] Progress tracking
  - [ ] Result extraction
- [ ] Implement animated-qr-display.tsx
  - [ ] Pre-render all frames
  - [ ] Animation loop
  - [ ] Frame counter display
- [ ] Implement qr-scanner.tsx
  - [ ] Camera permission handling
  - [ ] Frame capture
  - [ ] UR reconstruction
  - [ ] Progress display
- [ ] Implement text-fallback.tsx
  - [ ] Copy to clipboard
  - [ ] Paste from clipboard
- [ ] Test with Keystone/Sparrow QR codes
- [ ] Test large payload (10KB PSBT)

## Success Criteria
1. Animated QR cycles through frames at 150ms intervals
2. Scanner reconstructs payload from any 80% of frames
3. Interoperable with Keystone wallet QR codes
4. Progress indicator shows accurate completion %
5. Text fallback works for devices without camera

## Risks
| Risk | Mitigation |
|------|------------|
| Camera permission denied | Text paste fallback always available |
| QR too small to scan | Minimum 300px, adjustable size |
| Frame rate too fast | User-adjustable 100-500ms |

## Estimated Effort: 16h
