import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { MONAD_TESTNET, CONTRACT_ADDRESSES } from '../contracts/config';
import { MockERC20ABI } from '../contracts/abis';
import { WalletState } from '../types';

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

  const refreshTokenBalance = useCallback(async (account: string, provider: ethers.BrowserProvider) => {
    try {
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockToken, MockERC20ABI, provider);
      const balance = await tokenContract.balanceOf(account);
      const symbol = await tokenContract.symbol();
      setWallet(prev => ({ ...prev, tokenBalance: balance, tokenSymbol: symbol }));
    } catch (err) {
      console.warn("Could not fetch token balance (contract might not be deployed yet):", err);
    }
  }, []);

  const checkNetwork = useCallback(async (provider: ethers.BrowserProvider) => {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    // Allow Monad Testnet (10143) or local Hardhat (31337)
    const isCorrect = chainId === MONAD_TESTNET.chainId || chainId === 31337;
    return { chainId, isCorrect };
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
      setError(err?.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, refreshTokenBalance]);

  const switchToMonad = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET.chainIdHex }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask (error code 4902)
      if (switchError.code === 4902) {
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
        setError(switchError?.message || "Failed to switch to Monad Testnet");
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
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial check if already connected
    const provider = new ethers.BrowserProvider(window.ethereum);
    provider.listAccounts().then((accounts) => {
      if (accounts.length > 0) {
        const account = accounts[0].address;
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
    }).catch(() => {});

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [checkNetwork, refreshTokenBalance]);

  return {
    ...wallet,
    isConnecting,
    error,
    connectWallet,
    switchToMonad,
    refreshBalance: () => {
      if (wallet.account && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        refreshTokenBalance(wallet.account, provider);
      }
    },
  };
}
