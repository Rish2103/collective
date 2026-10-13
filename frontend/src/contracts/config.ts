export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const MONAD_TESTNET: NetworkConfig = {
  chainId: 10143,
  chainIdHex: "0x279f",
  name: "Monad Testnet",
  rpcUrl: (import.meta.env.VITE_MONAD_RPC_URL as string) || "https://testnet-rpc.monad.xyz",
  blockExplorerUrl: (import.meta.env.VITE_MONAD_EXPLORER_URL as string) || "https://testnet.monadexplorer.com",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
};

// Deployed contract & token addresses on Monad Testnet
export const CONTRACT_ADDRESSES = {
  mockToken:
    (import.meta.env.VITE_MOCK_TOKEN_ADDRESS as string) ||
    "0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6",
  usdc:
    (import.meta.env.VITE_USDC_ADDRESS as string) ||
    "0x534b2f3A21130d7a60830c2Df862319e593943A3",
  collectivePool:
    (import.meta.env.VITE_COLLECTIVE_POOL_ADDRESS as string) ||
    "0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02",
};

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  description: string;
  isNativeUsdc?: boolean;
  faucetUrl?: string;
}

export const SUPPORTED_TOKENS: Record<string, TokenConfig> = {
  MUSD: {
    address: CONTRACT_ADDRESSES.mockToken,
    symbol: "mUSD",
    name: "Test USD (mUSD)",
    decimals: 18,
    description: "Free in-app test money for quick testing",
  },
  USDC: {
    address: CONTRACT_ADDRESSES.usdc,
    symbol: "USDC",
    name: "USD Coin (Circle)",
    decimals: 6,
    description: "Official Circle digital dollar on Monad Testnet",
    isNativeUsdc: true,
    faucetUrl: "https://faucet.circle.com/",
  },
};

/**
 * Helper to identify token config from an address
 */
export function getTokenConfig(address?: string | null): TokenConfig {
  if (!address) return SUPPORTED_TOKENS.MUSD;
  const addrLower = address.toLowerCase();
  if (addrLower === CONTRACT_ADDRESSES.usdc.toLowerCase()) {
    return SUPPORTED_TOKENS.USDC;
  }
  return SUPPORTED_TOKENS.MUSD;
}

/**
 * Helper to build Explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  return `${MONAD_TESTNET.blockExplorerUrl}/address/${address}`;
}

/**
 * Helper to build Explorer URL for a transaction hash
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${MONAD_TESTNET.blockExplorerUrl}/tx/${txHash}`;
}

/**
 * Validates that current environment configuration has valid addresses
 */
export function validateEnvironmentConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!CONTRACT_ADDRESSES.mockToken || !CONTRACT_ADDRESSES.mockToken.startsWith('0x')) {
    errors.push('Invalid or missing Mock Token contract address');
  }
  if (!CONTRACT_ADDRESSES.usdc || !CONTRACT_ADDRESSES.usdc.startsWith('0x')) {
    errors.push('Invalid or missing Native USDC contract address');
  }
  if (!CONTRACT_ADDRESSES.collectivePool || !CONTRACT_ADDRESSES.collectivePool.startsWith('0x')) {
    errors.push('Invalid or missing CollectivePool contract address');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
