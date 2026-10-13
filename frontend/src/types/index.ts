export enum PoolState {
  Active = 0,
  PaidOut = 1,
  Refunding = 2,
}

export interface PoolData {
  id: number;
  creator: string;
  recipient: string;
  token: string;
  targetAmount: bigint;
  deadline: number;
  totalContributed: bigint;
  state: PoolState;
  title: string;
  description: string;
  contributors: string[];
  userContribution?: bigint;
  remainingHeld?: bigint;
  // Parsed metadata fields (backward compatible)
  cleanDescription?: string;
  expectedParticipants?: number;
}

export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  tokenBalance: bigint;
  tokenSymbol: string;
  balances?: Record<string, bigint>;
}

export interface OutcomeReceiptData {
  pool: PoolData;
  type: 'settled' | 'expired_refunding' | 'goal_secured';
  payoutTxHash?: string | null;
  recipientAddress: string;
  totalRaised: bigint;
  targetAmount: bigint;
  surplusAmount: bigint;
  backersCount: number;
  tokenSymbol: string;
  tokenDecimals: number;
  userContribution: bigint;
  userRefundClaimed?: boolean;
  remainingUnclaimedHeld?: bigint;
  timestamp: number;
}
