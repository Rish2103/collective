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

// Deployed addresses: uses Vite environment variables if configured, with fallbacks to verified deployment output
export const CONTRACT_ADDRESSES = {
  mockToken:
    (import.meta.env.VITE_MOCK_TOKEN_ADDRESS as string) ||
    "0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6",
  collectivePool:
    (import.meta.env.VITE_COLLECTIVE_POOL_ADDRESS as string) ||
    "0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02",
};

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
  if (!CONTRACT_ADDRESSES.collectivePool || !CONTRACT_ADDRESSES.collectivePool.startsWith('0x')) {
    errors.push('Invalid or missing CollectivePool contract address');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
