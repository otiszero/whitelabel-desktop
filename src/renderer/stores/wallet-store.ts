/**
 * Wallet Store - State management for wallets
 */

import { create } from 'zustand';

export type ChainType = 'btc' | 'eth' | 'xrp' | 'tron';

export interface WalletInfo {
  id: string;
  name: string;
  chain: ChainType;
  address: string;
  createdAt: number;
}

interface WalletState {
  wallets: WalletInfo[];
  activeWalletId: string | null;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setWallets: (wallets: WalletInfo[]) => void;
  setActiveWallet: (walletId: string | null) => void;
  setUnlocked: (unlocked: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addWallet: (wallet: WalletInfo) => void;
  removeWallet: (walletId: string) => void;
  reset: () => void;
}

const initialState = {
  wallets: [],
  activeWalletId: null,
  isUnlocked: false,
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>((set) => ({
  ...initialState,

  setWallets: (wallets) => set({ wallets }),

  setActiveWallet: (walletId) => set({ activeWalletId: walletId }),

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  addWallet: (wallet) =>
    set((state) => ({ wallets: [...state.wallets, wallet] })),

  removeWallet: (walletId) =>
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== walletId),
      activeWalletId:
        state.activeWalletId === walletId ? null : state.activeWalletId,
    })),

  reset: () => set(initialState),
}));

/**
 * Get active wallet from store
 */
export function useActiveWallet(): WalletInfo | null {
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);

  if (!activeWalletId) return null;
  return wallets.find((w) => w.id === activeWalletId) ?? null;
}

/**
 * Get wallets by chain
 */
export function useWalletsByChain(chain: ChainType): WalletInfo[] {
  const wallets = useWalletStore((state) => state.wallets);
  return wallets.filter((w) => w.chain === chain);
}
