/**
 * Animated QR Display Component
 * Renders animated QR codes using UR (Uniform Resources) format
 */

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { AnimatedUREncoder } from '../../../qr/ur-encoder';
import { URType, QR_DEFAULTS, AnimatedQROptions } from '../../../qr/types';

interface AnimatedQRDisplayProps extends AnimatedQROptions {
  data: Buffer;
  urType?: URType;
  onFrameChange?: (frame: number, total: number) => void;
  paused?: boolean;
}

export function AnimatedQRDisplay({
  data,
  urType = 'bytes',
  size = QR_DEFAULTS.SIZE,
  frameInterval = QR_DEFAULTS.FRAME_INTERVAL,
  errorCorrectionLevel = QR_DEFAULTS.ERROR_CORRECTION,
  onFrameChange,
  paused = false,
}: AnimatedQRDisplayProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [qrDataUrls, setQrDataUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate QR frames
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const encoder = new AnimatedUREncoder(data, { type: urType });
      const frames = encoder.getAllFrames();

      // Pre-render all QR codes
      Promise.all(
        frames.map(frame =>
          QRCode.toDataURL(frame, {
            errorCorrectionLevel,
            margin: 2,
            width: size,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          })
        )
      )
        .then(urls => {
          setQrDataUrls(urls);
          setIsLoading(false);
        })
        .catch(err => {
          setError(`Failed to generate QR codes: ${err.message}`);
          setIsLoading(false);
        });
    } catch (err) {
      setError(`Failed to encode data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [data, urType, size, errorCorrectionLevel]);

  // Animation loop
  useEffect(() => {
    if (qrDataUrls.length === 0 || paused) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentFrame(prev => {
        const next = (prev + 1) % qrDataUrls.length;
        onFrameChange?.(next + 1, qrDataUrls.length);
        return next;
      });
    }, frameInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [qrDataUrls.length, frameInterval, paused, onFrameChange]);

  // Notify initial frame
  useEffect(() => {
    if (qrDataUrls.length > 0) {
      onFrameChange?.(1, qrDataUrls.length);
    }
  }, [qrDataUrls.length, onFrameChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-slate-400">Generating QR codes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-900/20 rounded-lg" style={{ width: size }}>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* QR Code */}
      <div
        className="bg-white rounded-lg p-2"
        style={{ width: size + 16, height: size + 16 }}
      >
        {qrDataUrls[currentFrame] && (
          <img
            src={qrDataUrls[currentFrame]}
            alt={`QR Code Frame ${currentFrame + 1}`}
            width={size}
            height={size}
          />
        )}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-150"
            style={{ width: `${((currentFrame + 1) / qrDataUrls.length) * 100}%` }}
          />
        </div>
        <span>
          {currentFrame + 1} / {qrDataUrls.length}
        </span>
      </div>
    </div>
  );
}

/**
 * Static QR Display for single-frame data
 */
interface StaticQRDisplayProps {
  data: string;
  size?: number;
}

export function StaticQRDisplay({ data, size = QR_DEFAULTS.SIZE }: StaticQRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
    })
      .then(setQrDataUrl)
      .catch(err => setError(err.message));
  }, [data, size]);

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (!qrDataUrl) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg p-2" style={{ width: size + 16, height: size + 16 }}>
      <img src={qrDataUrl} alt="QR Code" width={size} height={size} />
    </div>
  );
}
