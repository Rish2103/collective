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
}

export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  tokenBalance: bigint;
  tokenSymbol: string;
}
