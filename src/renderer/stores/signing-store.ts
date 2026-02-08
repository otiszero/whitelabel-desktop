/**
 * Signing Store - State management for transaction signing flow
 */

import { create } from 'zustand';
import { ChainType } from './wallet-store';

export type SigningStep = 'idle' | 'input' | 'review' | 'signing' | 'complete' | 'error';

export interface PendingTransaction {
  chain: ChainType;
  walletId: string;
  rawData: string;
  parsedData: {
    to: string;
    amount: string;
    fee?: string;
    data?: string;
    [key: string]: unknown;
  };
}

export interface SignedTransaction {
  chain: ChainType;
  signedTx: string;
  txHash: string;
  timestamp: number;
}

interface SigningState {
  step: SigningStep;
  pendingTx: PendingTransaction | null;
  signedTx: SignedTransaction | null;
  error: string | null;
  progress: number;

  // Actions
  setStep: (step: SigningStep) => void;
  setPendingTx: (tx: PendingTransaction | null) => void;
  setSignedTx: (tx: SignedTransaction | null) => void;
  setError: (error: string | null) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

const initialState = {
  step: 'idle' as SigningStep,
  pendingTx: null,
  signedTx: null,
  error: null,
  progress: 0,
};

export const useSigningStore = create<SigningState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setPendingTx: (tx) => set({ pendingTx: tx }),

  setSignedTx: (tx) => set({ signedTx: tx }),

  setError: (error) => set({ error, step: error ? 'error' : 'idle' }),

  setProgress: (progress) => set({ progress }),

  reset: () => set(initialState),
}));
