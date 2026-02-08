/**
 * UR (Uniform Resources) Decoder
 * Decodes animated QR code frames back into original data
 */

import { URDecoder } from '@ngraveio/bc-ur';
import { URDecodeResult } from './types';

export class AnimatedURDecoder {
  private decoder: URDecoder;
  private _receivedCount: number = 0;
  private _expectedCount: number = 0;

  constructor() {
    this.decoder = new URDecoder();
  }

  /**
   * Receive a QR frame
   * @returns Progress percentage (0-100)
   */
  receive(frame: string): number {
    // Normalize the frame (UR format is case-insensitive)
    const normalizedFrame = frame.toLowerCase();

    // Skip if not a valid UR frame
    if (!normalizedFrame.startsWith('ur:')) {
      return this.getProgress();
    }

    try {
      this.decoder.receivePart(normalizedFrame);
      this._receivedCount++;

      // Update expected count from decoder
      const expectedCount = this.decoder.expectedPartCount();
      if (expectedCount > 0) {
        this._expectedCount = expectedCount;
      }
    } catch (error) {
      console.warn('Failed to process UR frame:', error);
    }

    return this.getProgress();
  }

  /**
   * Get current progress as percentage
   */
  getProgress(): number {
    const progress = this.decoder.estimatedPercentComplete();
    return Math.round(progress * 100);
  }

  /**
   * Check if decoding is complete
   */
  isComplete(): boolean {
    return this.decoder.isComplete();
  }

  /**
   * Get the decoded result
   * @returns Decoded data or null if not complete
   */
  getResult(): URDecodeResult | null {
    if (!this.isComplete()) {
      return null;
    }

    try {
      const ur = this.decoder.resultUR();
      return {
        type: ur.type,
        data: Buffer.from(ur.decodeCBOR()),
      };
    } catch (error) {
      console.error('Failed to decode UR result:', error);
      return null;
    }
  }

  /**
   * Get UR type from the decoded data
   */
  getResultType(): string | null {
    if (!this.isComplete()) {
      return null;
    }

    try {
      return this.decoder.resultUR().type;
    } catch {
      return null;
    }
  }

  /**
   * Reset decoder for new scan
   */
  reset(): void {
    this.decoder = new URDecoder();
    this._receivedCount = 0;
    this._expectedCount = 0;
  }

  /**
   * Get number of frames received
   */
  get receivedCount(): number {
    return this._receivedCount;
  }

  /**
   * Get expected total frames
   */
  get expectedCount(): number {
    return this._expectedCount;
  }

  /**
   * Check if any frames have been received
   */
  get hasData(): boolean {
    return this._receivedCount > 0;
  }
}

/**
 * Decode a single UR string (non-animated)
 */
export function decodeURString(urString: string): URDecodeResult | null {
  try {
    const decoder = new URDecoder();
    decoder.receivePart(urString.toLowerCase());

    if (decoder.isComplete()) {
      const ur = decoder.resultUR();
      return {
        type: ur.type,
        data: Buffer.from(ur.decodeCBOR()),
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to decode UR string:', error);
    return null;
  }
}

/**
 * Check if a string is a valid UR format
 */
export function isURFormat(text: string): boolean {
  return text.toLowerCase().startsWith('ur:');
}
