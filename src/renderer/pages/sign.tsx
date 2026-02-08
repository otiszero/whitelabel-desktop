/**
 * Sign Transaction Page
 * Transaction signing workflow with QR scan/display
 */

import { useState } from 'react';
import { Camera, FileText, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { useWalletStore, ChainType } from '../stores/wallet-store';
import { useSigningStore } from '../stores/signing-store';
import { ChainIcon, ChainSelector, CHAIN_LABELS } from '../components/common/chain-icon';
import { QRScanner, AnimatedQRDisplay, TextInputFallback, TextOutput } from '../components/qr';

type SignStep = 'select' | 'input' | 'review' | 'signing' | 'result';

export function SignPage() {
  const { wallets, isUnlocked } = useWalletStore();
  const [step, setStep] = useState<SignStep>('select');
  const [selectedChain, setSelectedChain] = useState<ChainType | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'qr' | 'text'>('qr');
  const [rawTxData, setRawTxData] = useState<string>('');
  const [signedTx, setSignedTx] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chainWallets = selectedChain
    ? wallets.filter((w) => w.chain === selectedChain)
    : [];

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  const handleQRComplete = (result: { type: string; data: Buffer }) => {
    setRawTxData(result.data.toString('hex'));
    setStep('review');
  };

  const handleTextComplete = (result: { type: string; data: Buffer }) => {
    setRawTxData(result.data.toString('hex'));
    setStep('review');
  };

  const handleSign = async () => {
    if (!selectedWalletId || !selectedChain) return;

    setIsLoading(true);
    setError(null);

    try {
      // In real app, call IPC to sign
      // const result = await window.electronAPI.signing.signTransaction(selectedChain, selectedWalletId, rawTxData);

      // Simulate signing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSignedTx('0x' + 'a'.repeat(64)); // Fake signed tx
      setTxHash('0x' + 'b'.repeat(64)); // Fake tx hash
      setStep('result');
    } catch (err) {
      setError('Failed to sign transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedChain(null);
    setSelectedWalletId(null);
    setRawTxData('');
    setSignedTx(null);
    setTxHash(null);
    setError(null);
  };

  if (!isUnlocked) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Sign Transaction</h1>
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">Please unlock your wallet first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sign Transaction</h1>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['select', 'input', 'review', 'result'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : ['select', 'input', 'review', 'result'].indexOf(step) > i
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {i + 1}
            </div>
            {i < 3 && (
              <div
                className={`w-12 h-0.5 ${
                  ['select', 'input', 'review', 'result'].indexOf(step) > i
                    ? 'bg-green-600'
                    : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step: Select chain and wallet */}
      {step === 'select' && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Select Chain</h2>
            <ChainSelector value={selectedChain} onChange={setSelectedChain} />
          </div>

          {selectedChain && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Select Wallet</h2>
              {chainWallets.length === 0 ? (
                <p className="text-slate-400">No wallets for {CHAIN_LABELS[selectedChain]}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {chainWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className={`p-3 rounded-lg border-2 text-left flex items-center gap-3 ${
                        selectedWalletId === wallet.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <ChainIcon chain={wallet.chain} size={32} />
                      <div>
                        <div className="font-medium">{wallet.name}</div>
                        <div className="text-sm text-slate-400 font-mono">
                          {wallet.address.slice(0, 12)}...
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setStep('input')}
            disabled={!selectedWalletId}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Step: Input transaction */}
      {step === 'input' && (
        <div className="flex flex-col gap-6">
          {/* Input method tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setInputMethod('qr')}
              className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${
                inputMethod === 'qr'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Camera size={18} />
              Scan QR Code
            </button>
            <button
              onClick={() => setInputMethod('text')}
              className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${
                inputMethod === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              <FileText size={18} />
              Paste Text
            </button>
          </div>

          {/* QR Scanner */}
          {inputMethod === 'qr' && (
            <QRScanner
              onComplete={handleQRComplete}
              onError={(err) => setError(err.message)}
            />
          )}

          {/* Text Input */}
          {inputMethod === 'text' && (
            <TextInputFallback
              onComplete={handleTextComplete}
              onError={setError}
            />
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={() => setStep('select')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
          >
            Back
          </button>
        </div>
      )}

      {/* Step: Review transaction */}
      {step === 'review' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-slate-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Review Transaction</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Chain</span>
                <span className="flex items-center gap-2">
                  <ChainIcon chain={selectedChain!} size={20} />
                  {CHAIN_LABELS[selectedChain!]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">From</span>
                <span className="font-mono text-sm">
                  {selectedWallet?.address.slice(0, 12)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Size</span>
                <span>{rawTxData.length / 2} bytes</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg flex items-start gap-2">
            <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
            <p className="text-yellow-400 text-sm">
              Please verify this transaction on your online device before signing.
              Once signed, the transaction cannot be reversed.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('input')}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={handleSign}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
            >
              {isLoading ? 'Signing...' : 'Sign Transaction'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && signedTx && (
        <div className="flex flex-col gap-6 items-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>

          <h2 className="text-xl font-semibold">Transaction Signed!</h2>

          <p className="text-slate-400 text-center">
            Scan the QR code below with your online device to broadcast the transaction.
          </p>

          {/* QR Display */}
          <AnimatedQRDisplay
            data={Buffer.from(signedTx, 'hex')}
            size={250}
          />

          {/* Text output */}
          <div className="w-full">
            <TextOutput data={signedTx} label="Signed Transaction (Hex)" />
          </div>

          {txHash && (
            <div className="w-full">
              <TextOutput data={txHash} label="Transaction Hash" />
            </div>
          )}

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
          >
            Sign Another Transaction
          </button>
        </div>
      )}
    </div>
  );
}

export default SignPage;
