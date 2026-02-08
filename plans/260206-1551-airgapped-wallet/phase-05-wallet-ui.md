# Phase 5: Wallet UI

## Context
Depends on Phases 2-4 (crypto, signers, QR). Implements user-facing wallet management, transaction signing workflow, address book, and transaction history.

## Overview
- Wallet creation/import wizard
- Transaction signing flow (scan → review → sign → display)
- Address book with labels
- Local transaction history

## Requirements
- Intuitive onboarding for new users
- Clear transaction review before signing
- Persistent storage for address book and history
- Multi-wallet management per chain

## Architecture

### Component Structure
```
src/renderer/components/
├── wallet/
│   ├── wallet-list.tsx          # List all wallets
│   ├── create-wallet-wizard.tsx # Create new wallet
│   ├── import-wallet.tsx        # Import via mnemonic
│   └── wallet-card.tsx          # Individual wallet display
├── signing/
│   ├── signing-workflow.tsx     # Main signing flow
│   ├── transaction-review.tsx   # Review before signing
│   ├── chain-selector.tsx       # Select BTC/ETH/XRP/TRON
│   └── signing-result.tsx       # Show signed tx
├── address-book/
│   ├── address-list.tsx         # List contacts
│   ├── address-form.tsx         # Add/edit contact
│   └── address-picker.tsx       # Select from list
├── history/
│   └── transaction-history.tsx  # Local tx log
└── common/
    ├── password-input.tsx       # Secure input
    ├── mnemonic-display.tsx     # Word grid
    └── chain-icon.tsx           # Chain logos
```

### State Management
```typescript
// src/renderer/stores/wallet-store.ts
interface WalletState {
  wallets: WalletInfo[];
  activeWallet: string | null;
  isUnlocked: boolean;
}

// src/renderer/stores/signing-store.ts
interface SigningState {
  step: 'idle' | 'scanning' | 'reviewing' | 'signing' | 'complete';
  pendingTx: PendingTransaction | null;
  signedTx: SignedTransaction | null;
}
```

## Implementation Steps

### 5.1 Install UI Dependencies (1h)
```bash
npm install zustand              # State management
npm install react-router-dom     # Routing
npm install @headlessui/react    # Accessible components
npm install lucide-react         # Icons
```

### 5.2 Wallet Creation Wizard (5h)
**src/renderer/components/wallet/create-wallet-wizard.tsx**

Steps:
1. **Chain Selection** - Choose BTC, ETH, XRP, or TRON
2. **Mnemonic Generation** - Display 24 words in grid
3. **Mnemonic Verification** - Confirm 3 random words
4. **Password Setup** - Set master password (min 12 chars)
5. **Confirmation** - Show derived address, save keystore

```typescript
export function CreateWalletWizard() {
  const [step, setStep] = useState<WizardStep>('chain-select');
  const [chain, setChain] = useState<Chain | null>(null);
  const [mnemonic, setMnemonic] = useState<string>('');

  // Generate on mount, clear on unmount
  useEffect(() => {
    const m = window.api.keystore.generateMnemonic();
    setMnemonic(m);
    return () => setMnemonic(''); // Security: clear from state
  }, []);

  return (
    <div className="wizard-container">
      {step === 'chain-select' && <ChainSelector onSelect={setChain} />}
      {step === 'mnemonic-show' && <MnemonicDisplay words={mnemonic.split(' ')} />}
      {step === 'mnemonic-verify' && <MnemonicVerify mnemonic={mnemonic} />}
      {step === 'password' && <PasswordSetup onComplete={handleCreate} />}
      {step === 'complete' && <WalletCreated address={address} />}
    </div>
  );
}
```

### 5.3 Wallet Import (3h)
**src/renderer/components/wallet/import-wallet.tsx**

- 12 or 24 word input grid
- Real-time validation (invalid words highlighted)
- Chain selection
- Password setup (same as create)

### 5.4 Wallet List & Management (3h)
**src/renderer/components/wallet/wallet-list.tsx**

- Display all wallets grouped by chain
- Show address (truncated), balance placeholder
- Lock/unlock toggle
- Delete wallet (with confirmation)

### 5.5 Transaction Signing Workflow (6h)
**src/renderer/components/signing/signing-workflow.tsx**

```typescript
type SigningStep = 'input' | 'review' | 'signing' | 'result';

export function SigningWorkflow() {
  const [step, setStep] = useState<SigningStep>('input');
  const [txData, setTxData] = useState<ParsedTransaction | null>(null);
  const [signedTx, setSignedTx] = useState<string | null>(null);

  return (
    <div>
      {step === 'input' && (
        <TransactionInput
          onScan={handleQRScan}
          onPaste={handleTextPaste}
          onComplete={setTxData}
        />
      )}
      {step === 'review' && (
        <TransactionReview
          tx={txData}
          onConfirm={() => setStep('signing')}
          onCancel={() => setStep('input')}
        />
      )}
      {step === 'signing' && (
        <SigningProgress
          tx={txData}
          onComplete={setSignedTx}
        />
      )}
      {step === 'result' && (
        <SigningResult
          signedTx={signedTx}
          chain={txData.chain}
        />
      )}
    </div>
  );
}
```

### 5.6 Transaction Review Component (3h)
**src/renderer/components/signing/transaction-review.tsx**

Display based on chain:
- **BTC**: Inputs (UTXOs), outputs, fee, change
- **ETH**: To, value (ETH), gas, data preview
- **XRP**: Destination, amount (XRP), fee, destination tag
- **TRON**: To, amount (TRX), bandwidth

Warning indicators:
- High fee (> 5% of amount)
- Unknown address (not in address book)
- Contract interaction (ETH data field present)

### 5.7 Address Book (4h)
**src/renderer/components/address-book/address-list.tsx**

```typescript
interface Contact {
  id: string;
  name: string;
  chain: Chain;
  address: string;
  notes?: string;
}
```

Features:
- Add/edit/delete contacts
- Filter by chain
- Search by name or address
- Import from clipboard
- Export to JSON

Storage: `app.getPath('userData')/address-book.json`

### 5.8 Transaction History (3h)
**src/renderer/components/history/transaction-history.tsx**

Local log of signed transactions:
```typescript
interface HistoryEntry {
  id: string;
  chain: Chain;
  txHash: string;
  to: string;
  amount: string;
  signedAt: number;
  status: 'signed' | 'broadcasted' | 'confirmed';
}
```

Features:
- List with filters (chain, date range)
- Copy txHash to clipboard
- Export to CSV

Storage: `app.getPath('userData')/tx-history.json`

## Todo Checklist
- [ ] Install UI dependencies
- [ ] Set up Zustand stores
- [ ] Implement wallet creation wizard
  - [ ] Chain selector
  - [ ] Mnemonic display
  - [ ] Mnemonic verification
  - [ ] Password setup
- [ ] Implement wallet import
- [ ] Implement wallet list
- [ ] Implement signing workflow
  - [ ] Transaction input (QR + paste)
  - [ ] Transaction review
  - [ ] Signing progress
  - [ ] Result display (QR + copy)
- [ ] Implement address book
- [ ] Implement transaction history
- [ ] Add Tailwind styling
- [ ] Test full flow: create → sign → display

## Success Criteria
1. User can create wallet, backup mnemonic, set password
2. User can import existing mnemonic
3. User can scan tx QR, review, sign, get result QR
4. Address book persists across sessions
5. Transaction history shows all signed txs

## Risks
| Risk | Mitigation |
|------|------------|
| Mnemonic visible in memory | Clear state on component unmount |
| User skips mnemonic backup | Require word verification |

## Estimated Effort: 24h
