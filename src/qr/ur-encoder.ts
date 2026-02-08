/**
 * UR (Uniform Resources) Encoder
 * Encodes data into animated QR code frames using fountain codes
 */

import { UREncoder, UR } from '@ngraveio/bc-ur';
import { QREncodeOptions, QR_DEFAULTS } from './types';

export class AnimatedUREncoder {
  private encoder: UREncoder;
  private frames: string[] = [];
  private _fragmentCount: number = 0;
  private generatedFrames: number = 0;

  constructor(data: Buffer, options: QREncodeOptions) {
    const maxFragmentLength = options.maxFragmentLength ?? QR_DEFAULTS.MAX_FRAGMENT_LENGTH;

    // Create UR from buffer
    const ur = UR.fromBuffer(data);

    // Create encoder with fragment size
    this.encoder = new UREncoder(ur, maxFragmentLength);
    this._fragmentCount = this.encoder.fragmentsLength;
  }

  /**
   * Get all frames for pre-rendering
   * Includes redundant frames for better scanning reliability
   */
  getAllFrames(): string[] {
    if (this.frames.length === 0) {
      // Generate enough frames (fragments + some redundancy)
      const totalFrames = this._fragmentCount + QR_DEFAULTS.REDUNDANT_FRAMES;

      for (let i = 0; i < totalFrames; i++) {
        const frame = this.encoder.nextPart().toUpperCase();
        this.frames.push(frame);
      }
    }

    return [...this.frames];
  }

  /**
   * Get next frame for incremental display
   */
  nextFrame(): string {
    this.generatedFrames++;
    return this.encoder.nextPart().toUpperCase();
  }

  /**
   * Number of unique fragments needed
   */
  get fragmentCount(): number {
    return this._fragmentCount;
  }
}

/**
 * Create a simple UR string for small payloads (single QR)
 */
export function encodeToURString(data: Buffer): string {
  const ur = UR.fromBuffer(data);
  const encoder = new UREncoder(ur, data.length + 100); // Single fragment
  return encoder.nextPart().toUpperCase();
}

/**
 * Check if data needs animated QR (multiple frames)
 */
export function needsAnimatedQR(data: Buffer, maxFragmentLength: number = QR_DEFAULTS.MAX_FRAGMENT_LENGTH): boolean {
  // Account for CBOR and UR encoding overhead (~20%)
  const estimatedSize = data.length * 1.2;
  return estimatedSize > maxFragmentLength;
}
