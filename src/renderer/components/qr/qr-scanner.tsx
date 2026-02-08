/**
 * QR Scanner Component
 * Scans QR codes using device camera, supports animated UR format
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { AnimatedURDecoder, isURFormat } from '../../../qr/ur-decoder';
import { URDecodeResult } from '../../../qr/types';

interface QRScannerProps {
  onComplete: (result: URDecodeResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function QRScanner({ onComplete, onError, onProgress }: QRScannerProps) {
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);

  const decoderRef = useRef(new AnimatedURDecoder());
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
          setCameraId(devices[0].id);
        } else {
          setError('No cameras found');
        }
      })
      .catch(err => {
        setError(`Failed to get cameras: ${err.message}`);
        onError?.(err);
      });
  }, [onError]);

  // Handle scanned QR code
  const handleScan = useCallback(
    (decodedText: string, _result: Html5QrcodeResult) => {
      // Check if UR format (animated QR)
      if (isURFormat(decodedText)) {
        const pct = decoderRef.current.receive(decodedText);
        setProgress(pct);
        onProgress?.(pct);

        if (decoderRef.current.isComplete()) {
          const result = decoderRef.current.getResult();
          if (result) {
            // Stop scanning
            scannerRef.current?.stop().catch(() => {});
            setIsScanning(false);
            onComplete(result);
          }
        }
      } else {
        // Single QR code (not UR format)
        // Treat as raw bytes
        scannerRef.current?.stop().catch(() => {});
        setIsScanning(false);
        onComplete({
          type: 'bytes',
          data: Buffer.from(decodedText, 'utf-8'),
        });
      }
    },
    [onComplete, onProgress]
  );

  // Start/stop scanning
  useEffect(() => {
    if (!cameraId || !containerRef.current) return;

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScan,
        () => {} // Ignore non-QR frames
      )
      .then(() => {
        setIsScanning(true);
        setError(null);
      })
      .catch(err => {
        setError(`Failed to start camera: ${err.message}`);
        onError?.(err);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [cameraId, handleScan, onError]);

  // Reset decoder
  const handleReset = () => {
    decoderRef.current.reset();
    setProgress(0);
    onProgress?.(0);
  };

  // Switch camera
  const handleCameraChange = (newCameraId: string) => {
    scannerRef.current?.stop().catch(() => {});
    setCameraId(newCameraId);
    handleReset();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Camera selector */}
      {cameras.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Camera:</label>
          <select
            value={cameraId || ''}
            onChange={e => handleCameraChange(e.target.value)}
            className="bg-slate-700 text-white rounded px-2 py-1 text-sm"
          >
            {cameras.map(cam => (
              <option key={cam.id} value={cam.id}>
                {cam.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner viewport */}
      <div
        ref={containerRef}
        className="relative bg-slate-800 rounded-lg overflow-hidden"
        style={{ width: 300, height: 300 }}
      >
        <div id="qr-reader" className="w-full h-full" />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-6 border-2 border-blue-500 rounded-lg" />
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Progress</span>
          <span className="text-white">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        {decoderRef.current.hasData && (
          <div className="text-xs text-slate-500">
            Received {decoderRef.current.receivedCount} frames
            {decoderRef.current.expectedCount > 0 && ` of ~${decoderRef.current.expectedCount}`}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
      >
        Reset Scanner
      </button>
    </div>
  );
}
