/**
 * Wallets Page - Wallet management and creation
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Key, Lock, Unlock } from 'lucide-react';
import { useWalletStore, ChainType } from '../stores/wallet-store';
import { ChainIcon, ChainSelector, CHAIN_LABELS } from '../components/common/chain-icon';
import { PasswordInput, isPasswordValid } from '../components/common/password-input';
import { MnemonicDisplay, MnemonicVerify, MnemonicInput } from '../components/common/mnemonic-display';

type WizardStep = 'select-action' | 'chain' | 'mnemonic-show' | 'mnemonic-verify' | 'password' | 'complete' | 'import-mnemonic';

export function WalletsPage() {
  const { wallets, isUnlocked, setWallets, setUnlocked } = useWalletStore();
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('select-action');
  const [selectedChain, setSelectedChain] = useState<ChainType | null>(null);
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');

  // Check if keystore exists on mount
  useEffect(() => {
    checkKeystoreStatus();
  }, []);

  const checkKeystoreStatus = async () => {
    // In real app, call IPC to check keystore status
    // For now, simulate
  };

  const handleCreateWallet = () => {
    // Generate mnemonic (in real app, call IPC)
    const words = [];
    const wordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'];
    for (let i = 0; i < 24; i++) {
      words.push(wordList[Math.floor(Math.random() * wordList.length)]);
    }
    setMnemonic(words.join(' '));
    setWizardStep('mnemonic-show');
  };

  const handleImportWallet = () => {
    setWizardStep('import-mnemonic');
  };

  const handleMnemonicVerified = () => {
    setWizardStep('password');
  };

  const handlePasswordSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!isPasswordValid(password)) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In real app, call IPC to create keystore
      // await window.electronAPI.keystore.create(password, mnemonic);

      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setWizardStep('complete');
      setUnlocked(true);
    } catch (err) {
      setError('Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In real app, call IPC
      // const result = await window.electronAPI.keystore.unlock(unlockPassword);

      await new Promise(resolve => setTimeout(resolve, 500));
      setUnlocked(true);
      setUnlockPassword('');
    } catch (err) {
      setError('Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = () => {
    setUnlocked(false);
  };

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep('select-action');
    setSelectedChain(null);
    setMnemonic('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  // Show unlock screen if not unlocked
  if (!isUnlocked && wallets.length > 0) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Unlock Wallet</h1>
        <div className="flex flex-col gap-4">
          <PasswordInput
            value={unlockPassword}
            onChange={setUnlockPassword}
            label="Password"
            placeholder="Enter your password"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleUnlock}
            disabled={isLoading || !unlockPassword}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Unlock size={18} />
            {isLoading ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  // Show create wallet wizard
  if (showWizard) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {wizardStep === 'select-action' && 'Add Wallet'}
            {wizardStep === 'chain' && 'Select Chain'}
            {wizardStep === 'mnemonic-show' && 'Recovery Phrase'}
            {wizardStep === 'mnemonic-verify' && 'Verify Phrase'}
            {wizardStep === 'password' && 'Set Password'}
            {wizardStep === 'complete' && 'Wallet Created'}
            {wizardStep === 'import-mnemonic' && 'Import Wallet'}
          </h1>
          <button onClick={resetWizard} className="text-slate-400 hover:text-white">
            Cancel
          </button>
        </div>

        {wizardStep === 'select-action' && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setWizardStep('chain')}
              className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-left"
            >
              <div className="flex items-center gap-3">
                <Plus size={24} className="text-blue-400" />
                <div>
                  <div className="font-semibold">Create New Wallet</div>
                  <div className="text-sm text-slate-400">Generate a new recovery phrase</div>
                </div>
              </div>
            </button>
            <button
              onClick={handleImportWallet}
              className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-left"
            >
              <div className="flex items-center gap-3">
                <Key size={24} className="text-green-400" />
                <div>
                  <div className="font-semibold">Import Existing Wallet</div>
                  <div className="text-sm text-slate-400">Use your recovery phrase</div>
                </div>
              </div>
            </button>
          </div>
        )}

        {wizardStep === 'chain' && (
          <div className="flex flex-col gap-4">
            <ChainSelector value={selectedChain} onChange={setSelectedChain} />
            <button
              onClick={handleCreateWallet}
              disabled={!selectedChain}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-medium"
            >
              Continue
            </button>
          </div>
        )}

        {wizardStep === 'mnemonic-show' && (
          <div className="flex flex-col gap-4">
            <MnemonicDisplay words={mnemonic.split(' ')} />
            <button
              onClick={() => setWizardStep('mnemonic-verify')}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
            >
              I've Written It Down
            </button>
          </div>
        )}

        {wizardStep === 'mnemonic-verify' && (
          <MnemonicVerify
            mnemonic={mnemonic}
            onVerified={handleMnemonicVerified}
            onError={() => setError('Incorrect words. Please try again.')}
          />
        )}

        {wizardStep === 'import-mnemonic' && (
          <MnemonicInput
            onComplete={(m) => {
              setMnemonic(m);
              setWizardStep('password');
            }}
          />
        )}

        {wizardStep === 'password' && (
          <div className="flex flex-col gap-4">
            <PasswordInput
              value={password}
              onChange={setPassword}
              label="Password"
              showStrength
            />
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              label="Confirm Password"
              placeholder="Confirm your password"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handlePasswordSubmit}
              disabled={isLoading || !password || !confirmPassword}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg font-medium"
            >
              {isLoading ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        )}

        {wizardStep === 'complete' && (
          <div className="flex flex-col gap-4 items-center text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Wallet Created!</h2>
            <p className="text-slate-400">Your wallet is ready to use.</p>
            <button
              onClick={resetWizard}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Wallets</h1>
        <div className="flex gap-2">
          {isUnlocked && (
            <button
              onClick={handleLock}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2"
            >
              <Lock size={16} />
              Lock
            </button>
          )}
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Add Wallet
          </button>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No wallets yet</p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg"
          >
            Create Your First Wallet
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="p-4 bg-slate-800 rounded-lg flex items-center gap-4"
            >
              <ChainIcon chain={wallet.chain} size={40} />
              <div className="flex-1">
                <div className="font-semibold">{wallet.name}</div>
                <div className="text-sm text-slate-400 font-mono">
                  {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">{CHAIN_LABELS[wallet.chain]}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Import Check icon
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default WalletsPage;
