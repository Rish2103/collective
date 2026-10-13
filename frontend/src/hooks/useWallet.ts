import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { MONAD_TESTNET, CONTRACT_ADDRESSES } from '../contracts/config';
import { MockERC20ABI } from '../contracts/abis';
import { WalletState } from '../types';
import { parseWeb3Error } from '../utils/errorHandler';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    account: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
    tokenBalance: 0n,
    tokenSymbol: 'mUSD',
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTokenBalance = useCallback(async (account: string, provider: ethers.BrowserProvider | ethers.JsonRpcProvider) => {
    try {
      const musdContract = new ethers.Contract(CONTRACT_ADDRESSES.mockToken, MockERC20ABI, provider);
      const usdcContract = new ethers.Contract(CONTRACT_ADDRESSES.usdc, MockERC20ABI, provider);

      const [musdBal, usdcBal] = await Promise.all([
        musdContract.balanceOf(account).catch(() => 0n),
        usdcContract.balanceOf(account).catch(() => 0n),
      ]);

      setWallet(prev => ({
        ...prev,
        tokenBalance: musdBal,
        tokenSymbol: 'mUSD',
        balances: {
          [CONTRACT_ADDRESSES.mockToken.toLowerCase()]: musdBal,
          [CONTRACT_ADDRESSES.usdc.toLowerCase()]: usdcBal,
        },
      }));
    } catch (err) {
      console.warn("Could not fetch token balances:", err);
    }
  }, []);

  const checkNetwork = useCallback(async (provider: ethers.BrowserProvider) => {
    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      // Allow Monad Testnet (10143) or local Hardhat (31337)
      const isCorrect = chainId === MONAD_TESTNET.chainId || chainId === 31337;
      return { chainId, isCorrect };
    } catch (e) {
      return { chainId: null, isCorrect: false };
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to use COLLECTIVE.");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        const account = accounts[0];
        const { chainId, isCorrect } = await checkNetwork(provider);

        setWallet({
          account,
          chainId,
          isConnected: true,
          isCorrectNetwork: isCorrect,
          tokenBalance: 0n,
          tokenSymbol: 'mUSD',
        });

        await refreshTokenBalance(account, provider);
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(parseWeb3Error(err));
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, refreshTokenBalance]);

  const switchToMonad = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not available to switch network.");
      return;
    }

    try {
      setError(null);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET.chainIdHex }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask (error code 4902)
      if (switchError.code === 4902 || switchError?.message?.includes("Unrecognized chain ID")) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: MONAD_TESTNET.chainIdHex,
                chainName: MONAD_TESTNET.name,
                rpcUrls: [MONAD_TESTNET.rpcUrl],
                nativeCurrency: MONAD_TESTNET.nativeCurrency,
                blockExplorerUrls: [MONAD_TESTNET.blockExplorerUrl],
              },
            ],
          });
        } catch (addError: any) {
          setError("Failed to add Monad Testnet to MetaMask.");
        }
      } else {
        setError(parseWeb3Error(switchError));
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWallet({
          account: null,
          chainId: null,
          isConnected: false,
          isCorrectNetwork: false,
          tokenBalance: 0n,
          tokenSymbol: 'mUSD',
        });
      } else {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const account = accounts[0];
        checkNetwork(provider).then(({ chainId, isCorrect }) => {
          setWallet(prev => ({
            ...prev,
            account,
            chainId,
            isConnected: true,
            isCorrectNetwork: isCorrect,
          }));
          refreshTokenBalance(account, provider);
        });
      }
    };

    const handleChainChanged = () => {
      // Per MetaMask guidelines, reload on chain change to avoid state desync
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Eager check if already connected
    const checkEagerConnection = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          const account = accounts[0];
          const { chainId, isCorrect } = await checkNetwork(provider);
          setWallet({
            account,
            chainId,
            isConnected: true,
            isCorrectNetwork: isCorrect,
            tokenBalance: 0n,
            tokenSymbol: 'mUSD',
          });
          await refreshTokenBalance(account, provider);
        }
      } catch (e) {
        // Silent ignore on eager load
      }
    };

    checkEagerConnection();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkNetwork, refreshTokenBalance]);

  return {
    ...wallet,
    isConnecting,
    error,
    clearError: () => setError(null),
    connectWallet,
    switchToMonad,
    refreshBalance: () => {
      if (wallet.account && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        refreshTokenBalance(wallet.account, provider);
      }
    },
    getTokenBalance: (tokenAddress?: string | null) => {
      if (!tokenAddress || !wallet.balances) return wallet.tokenBalance;
      const addr = tokenAddress.toLowerCase();
      return wallet.balances[addr] ?? 0n;
    },
  };
}
