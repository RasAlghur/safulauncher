export interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  percentBundled?: string;
  tokenVersion?: string;
  createdAt?: string | Date;
  expiresAt?: number;
  twitter?: string;
  telegram?: string;
  image?: {
    name: string;
    path: string;
  };
  tokenImageId?: string;
}

export interface TxLog {
  oldMarketCap: number;
  type: "buy" | "sell";
  wallet: string;
  ethAmount: string;
  tokenAmount: string;
  txnHash: string;
  timestamp: string;
}

export interface TimeframeOption {
  label: string;
  value: string;
  resolution: string;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type TransactionType =
  | "approval"
  | "sell"
  | "buy"
  | "startTrading"
  | "addToWhitelist"
  | "disableWhitelist"
  | "disableMaxWalletLimit";

/**
* Description placeholder
*
* @interface CandlestickData
* @typedef {CandlestickData}
*/
export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}