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
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  collectivePool:
    (import.meta.env.VITE_COLLECTIVE_POOL_ADDRESS as string) ||
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
};
