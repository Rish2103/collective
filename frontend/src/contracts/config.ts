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
  rpcUrl: "https://testnet-rpc.monad.xyz",
  blockExplorerUrl: "https://testnet.monadexplorer.com",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
};

// Deployed addresses: uses Vite environment variables if configured, with fallbacks to deployment output
export const CONTRACT_ADDRESSES = {
  mockToken:
    (import.meta.env.VITE_MOCK_TOKEN_ADDRESS as string) ||
    "0xb4C9816b0C540C6db4c41D05751f403ae5231Dd6",
  collectivePool:
    (import.meta.env.VITE_COLLECTIVE_POOL_ADDRESS as string) ||
    "0x4c1205b43F4Bb6c1FB9e2029a1b0e42e3e8b8a02",
};
