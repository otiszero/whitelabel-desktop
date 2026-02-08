/**
 * Shared Signer Types
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SignerResult<T = unknown> {
  signedTx: string;
  txHash: string;
  metadata: T;
}

export interface BaseSigner<TxInput, TxMeta> {
  validate(input: TxInput): ValidationResult;
  sign(input: TxInput, privateKey: Buffer): Promise<SignerResult<TxMeta>>;
}

// BTC types
export interface BtcSignInput {
  psbtBase64: string;
}

export interface BtcMeta {
  inputCount: number;
  outputCount: number;
}

// ETH types
export interface EthSignInput {
  chainId: number;
  nonce: number;
  to: string;
  value: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  gasLimit: number;
  data?: string;
}

export interface EthMeta {
  from: string;
  to: string;
  chainId: number;
}

// XRP types
export interface XrpSignInput {
  destination: string;
  amount: string;
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
  destinationTag?: number;
}

export interface XrpMeta {
  account: string;
  destination: string;
  amount: string;
}

// TRON types
export interface TronSignInput {
  to: string;
  amount: number;
  timestamp: number;
  expiration: number;
  refBlockBytes: string;
  refBlockHash: string;
}

export interface TronMeta {
  owner: string;
  to: string;
  amount: number;
}
