/**
 * Chain Icon Component
 * Displays blockchain logos/icons
 */

import { ChainType } from '../../stores/wallet-store';

interface ChainIconProps {
  chain: ChainType;
  size?: number;
  className?: string;
}

const CHAIN_COLORS: Record<ChainType, string> = {
  btc: '#F7931A',
  eth: '#627EEA',
  xrp: '#23292F',
  tron: '#FF0013',
};

const CHAIN_LABELS: Record<ChainType, string> = {
  btc: 'BTC',
  eth: 'ETH',
  xrp: 'XRP',
  tron: 'TRX',
};

export function ChainIcon({ chain, size = 32, className = '' }: ChainIconProps) {
  const color = CHAIN_COLORS[chain];
  const label = CHAIN_LABELS[chain];

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.35,
      }}
    >
      {label.charAt(0)}
    </div>
  );
}

/**
 * Chain selector component
 */
interface ChainSelectorProps {
  value: ChainType | null;
  onChange: (chain: ChainType) => void;
  disabled?: boolean;
}

const CHAINS: ChainType[] = ['btc', 'eth', 'xrp', 'tron'];

export function ChainSelector({ value, onChange, disabled = false }: ChainSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CHAINS.map((chain) => (
        <button
          key={chain}
          onClick={() => onChange(chain)}
          disabled={disabled}
          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
            value === chain
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 hover:border-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ChainIcon chain={chain} />
          <div className="text-left">
            <div className="font-semibold text-white">{CHAIN_LABELS[chain]}</div>
            <div className="text-xs text-slate-400">{getChainName(chain)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function getChainName(chain: ChainType): string {
  switch (chain) {
    case 'btc':
      return 'Bitcoin';
    case 'eth':
      return 'Ethereum';
    case 'xrp':
      return 'XRP Ledger';
    case 'tron':
      return 'TRON';
  }
}

export { CHAIN_COLORS, CHAIN_LABELS };
