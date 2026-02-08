/**
 * Mnemonic Display Component
 * Shows seed phrase in a grid format
 */

import { useState, useEffect } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface MnemonicDisplayProps {
  words: string[];
  onCopy?: () => void;
  hideByDefault?: boolean;
}

export function MnemonicDisplay({
  words,
  onCopy,
  hideByDefault = true,
}: MnemonicDisplayProps) {
  const [isHidden, setIsHidden] = useState(hideByDefault);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(words.join(' '));
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Warning */}
      <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg text-yellow-400 text-sm">
        <strong>Important:</strong> Write down these words in order and keep them
        safe. Anyone with these words can access your funds.
      </div>

      {/* Word grid */}
      <div className="relative">
        <div
          className={`grid grid-cols-3 gap-2 p-4 bg-slate-800 rounded-lg ${
            isHidden ? 'blur-sm select-none' : ''
          }`}
        >
          {words.map((word, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-slate-700 rounded"
            >
              <span className="text-xs text-slate-500 w-5">{index + 1}.</span>
              <span className="font-mono text-white">{word}</span>
            </div>
          ))}
        </div>

        {/* Reveal overlay */}
        {isHidden && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setIsHidden(false)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2"
            >
              <Eye size={16} />
              Click to reveal
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsHidden(!isHidden)}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center gap-2"
        >
          {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          {isHidden ? 'Show' : 'Hide'}
        </button>
        <button
          onClick={handleCopy}
          disabled={isHidden}
          className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 hover:bg-slate-600'
          } ${isHidden ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

/**
 * Mnemonic Verification Component
 * Asks user to confirm specific words from their mnemonic
 */

interface MnemonicVerifyProps {
  mnemonic: string;
  wordCount?: number;
  onVerified: () => void;
  onError?: () => void;
}

export function MnemonicVerify({
  mnemonic,
  wordCount = 3,
  onVerified,
  onError,
}: MnemonicVerifyProps) {
  const words = mnemonic.split(' ');
  const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
  const [inputs, setInputs] = useState<string[]>([]);
  const [errors, setErrors] = useState<boolean[]>([]);

  // Generate random indices to verify
  useEffect(() => {
    const indices: number[] = [];
    while (indices.length < wordCount) {
      const idx = Math.floor(Math.random() * words.length);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    setVerifyIndices(indices.sort((a, b) => a - b));
    setInputs(new Array(wordCount).fill(''));
    setErrors(new Array(wordCount).fill(false));
  }, [mnemonic, wordCount, words.length]);

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value.toLowerCase().trim();
    setInputs(newInputs);

    const newErrors = [...errors];
    newErrors[index] = false;
    setErrors(newErrors);
  };

  const handleVerify = () => {
    const newErrors = verifyIndices.map(
      (wordIndex, i) => inputs[i] !== words[wordIndex]
    );

    setErrors(newErrors);

    if (newErrors.every((e) => !e)) {
      onVerified();
    } else {
      onError?.();
    }
  };

  const isComplete = inputs.every((input) => input.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-slate-400">
        Enter the following words from your recovery phrase to verify you've
        saved it correctly.
      </p>

      <div className="flex flex-col gap-3">
        {verifyIndices.map((wordIndex, i) => (
          <div key={wordIndex} className="flex items-center gap-3">
            <span className="text-slate-500 w-16">Word #{wordIndex + 1}</span>
            <input
              type="text"
              value={inputs[i]}
              onChange={(e) => handleInputChange(i, e.target.value)}
              className={`flex-1 px-3 py-2 bg-slate-800 border rounded-lg focus:outline-none ${
                errors[i]
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-slate-700 focus:border-blue-500'
              }`}
              placeholder={`Enter word #${wordIndex + 1}`}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={!isComplete}
        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium"
      >
        Verify
      </button>
    </div>
  );
}

/**
 * Mnemonic Input Component
 * For importing existing wallet
 */

interface MnemonicInputProps {
  onComplete: (mnemonic: string) => void;
  wordCount?: 12 | 24;
}

export function MnemonicInput({ onComplete, wordCount = 24 }: MnemonicInputProps) {
  const [words, setWords] = useState<string[]>(new Array(wordCount).fill(''));
  const [error, setError] = useState<string | null>(null);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    setWords(newWords);
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const pastedWords = text.trim().split(/\s+/);

      if (pastedWords.length === 12 || pastedWords.length === 24) {
        const newWords = new Array(wordCount).fill('');
        pastedWords.slice(0, wordCount).forEach((w, i) => {
          newWords[i] = w.toLowerCase();
        });
        setWords(newWords);
      } else {
        setError('Invalid mnemonic format. Expected 12 or 24 words.');
      }
    } catch {
      setError('Failed to read clipboard');
    }
  };

  const handleSubmit = () => {
    const mnemonic = words.join(' ').trim();
    const wordList = mnemonic.split(' ').filter(Boolean);

    if (wordList.length !== wordCount) {
      setError(`Please enter all ${wordCount} words`);
      return;
    }

    onComplete(mnemonic);
  };

  const isComplete = words.every((w) => w.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-slate-400">Enter your {wordCount}-word recovery phrase</p>
        <button
          onClick={handlePaste}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Paste from clipboard
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {words.map((word, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className="text-xs text-slate-500 w-5">{index + 1}.</span>
            <input
              type="text"
              value={word}
              onChange={(e) => handleWordChange(index, e.target.value)}
              className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none focus:border-blue-500"
              placeholder="word"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!isComplete}
        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium"
      >
        Continue
      </button>
    </div>
  );
}
