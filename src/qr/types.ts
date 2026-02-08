/**
 * QR System Types and Constants
 */

// UR (Uniform Resources) types for different blockchains
export type URType =
  | 'crypto-psbt'        // Bitcoin PSBT
  | 'eth-sign-request'   // Ethereum tx (EIP-4527)
  | 'xrp-tx'             // XRP transaction
  | 'bytes'              // Generic binary (TRON, etc.)
  | 'crypto-signature';  // Signed result

// QR encoding options
export interface QREncodeOptions {
  type: URType;
  maxFragmentLength?: number;  // bytes per fragment (default 100)
}

// QR decode result
export interface URDecodeResult {
  type: string;
  data: Buffer;
}

// Animated QR display options
export interface AnimatedQROptions {
  size?: number;           // QR code size in pixels (default 300)
  frameInterval?: number;  // ms between frames (default 150)
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';  // default 'M'
}

// QR frame info
export interface QRFrameInfo {
  currentFrame: number;
  totalFrames: number;
  progress: number;  // 0-100
}

// Constants
export const QR_DEFAULTS = {
  SIZE: 300,
  FRAME_INTERVAL: 150,
  MAX_FRAGMENT_LENGTH: 100,
  ERROR_CORRECTION: 'M' as const,
  REDUNDANT_FRAMES: 5,
};

// UR type mappings for different chains
export const CHAIN_UR_TYPES: Record<string, URType> = {
  btc: 'crypto-psbt',
  eth: 'eth-sign-request',
  xrp: 'bytes',  // XRP uses generic bytes
  tron: 'bytes', // TRON uses generic bytes
};
