/**
 * Text Fallback Component
 * Copy/paste interface for when camera is unavailable
 */

import { useState, useCallback } from 'react';
import { AnimatedURDecoder, isURFormat } from '../../../qr/ur-decoder';
import { URDecodeResult } from '../../../qr/types';

interface TextInputFallbackProps {
  onComplete: (result: URDecodeResult) => void;
  onError?: (error: string) => void;
}

export function TextInputFallback({ onComplete, onError }: TextInputFallbackProps) {
  const [inputText, setInputText] = useState('');
  const [progress, setProgress] = useState(0);
  const [decoder] = useState(() => new AnimatedURDecoder());

  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);

      // Split by newlines and process each potential UR frame
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // Reset decoder
      decoder.reset();
      setProgress(0);

      for (const line of lines) {
        if (isURFormat(line)) {
          const pct = decoder.receive(line);
          setProgress(pct);

          if (decoder.isComplete()) {
            const result = decoder.getResult();
            if (result) {
              onComplete(result);
              return;
            }
          }
        }
      }

      // If single line and not UR format, try to parse as raw data
      if (lines.length === 1 && !isURFormat(lines[0])) {
        // Try as hex
        if (/^[0-9a-fA-F]+$/.test(lines[0])) {
          onComplete({
            type: 'bytes',
            data: Buffer.from(lines[0], 'hex'),
          });
        } else {
          // Treat as UTF-8 text
          onComplete({
            type: 'bytes',
            data: Buffer.from(lines[0], 'utf-8'),
          });
        }
      }
    },
    [decoder, onComplete]
  );

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleTextChange(text);
    } catch (err) {
      onError?.('Failed to read clipboard');
    }
  };

  const handleClear = () => {
    setInputText('');
    setProgress(0);
    decoder.reset();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Instructions */}
      <div className="text-sm text-slate-400">
        Paste the transaction data below. Supports:
        <ul className="list-disc list-inside mt-1 text-xs">
          <li>UR format (ur:crypto-psbt/...)</li>
          <li>Multiple UR frames (one per line)</li>
          <li>Raw hex data</li>
          <li>JSON transaction data</li>
        </ul>
      </div>

      {/* Text input */}
      <textarea
        value={inputText}
        onChange={e => handleTextChange(e.target.value)}
        placeholder="Paste transaction data here..."
        className="w-full h-48 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
      />

      {/* Progress (for multi-frame UR) */}
      {progress > 0 && progress < 100 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Decoding progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePaste}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
        >
          Paste from Clipboard
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

interface TextOutputProps {
  data: string;
  label?: string;
}

export function TextOutput({ data, label = 'Signed Transaction' }: TextOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-400">{label}</label>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg font-mono text-xs text-slate-300 break-all max-h-48 overflow-auto">
        {data}
      </div>
    </div>
  );
}
