import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, MONAD_TESTNET } from '../contracts/config';
import { CollectivePoolABI, MockERC20ABI } from '../contracts/abis';
import { PoolData, PoolState } from '../types';
import { parseWeb3Error } from '../utils/errorHandler';

export function useCollective(account: string | null) {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionStep, setActionStep] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Return a signer if wallet is connected, or throw friendly error
  const getSigner = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to interact with Monad Testnet.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }, []);

  // Return BrowserProvider if window.ethereum is present, otherwise fallback to public Monad JSON-RPC
  const getReadProvider = useCallback(() => {
    if (window.ethereum) {
      try {
        return new ethers.BrowserProvider(window.ethereum);
      } catch (e) {
        // Fallback to JSON-RPC if BrowserProvider initialization fails
      }
    }
    return new ethers.JsonRpcProvider(MONAD_TESTNET.rpcUrl);
  }, []);

  // Load pools with fallback read-only provider support
  const loadPools = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const provider = getReadProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, provider);

      const countBig: bigint = await contract.getPoolCount();
      const count = Number(countBig);
      const loadedPools: PoolData[] = [];

      for (let i = 0; i < count; i++) {
        const poolRaw = await contract.pools(i);
        const contributors: string[] = await contract.getContributors(i);
        const computedStateNum = await contract.getComputedState(i);
        const poolState = Number(computedStateNum) as PoolState;

        let userContribution = 0n;
        if (account) {
          try {
            userContribution = await contract.contributions(i, account);
          } catch (e) {
            userContribution = 0n;
          }
        }

        let remainingHeld = 0n;
        if (poolState === PoolState.Active) {
          remainingHeld = poolRaw.totalContributed;
        } else if (poolState === PoolState.Refunding) {
          for (const c of contributors) {
            try {
              const deposit: bigint = await contract.contributions(i, c);
              remainingHeld += deposit;
            } catch (e) {
              // ignore single contributor read failure
            }
          }
        }

        loadedPools.push({
          id: Number(poolRaw.id),
          creator: poolRaw.creator,
          recipient: poolRaw.recipient,
          token: poolRaw.token,
          targetAmount: poolRaw.targetAmount,
          deadline: Number(poolRaw.deadline),
          totalContributed: poolRaw.totalContributed,
          state: poolState,
          title: poolRaw.title,
          description: poolRaw.description,
          contributors,
          userContribution,
          remainingHeld,
        });
      }

      setPools(loadedPools.reverse()); // Newest first
    } catch (err: any) {
      console.warn("Could not load pools from Monad RPC:", err);
      // Fallback: don't crash UI, set error message if needed
    } finally {
      setIsLoading(false);
    }
  }, [account, getReadProvider]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // Mint mock test tokens
  const mintTestTokens = async (amountEther: string = "1000") => {
    try {
      setActionLoading("minting");
      setActionStep("Submitting mint transaction to Monad Testnet...");
      setError(null);
      setLastTxHash(null);

      const signer = await getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockToken, MockERC20ABI, signer);
      
      const amount = ethers.parseEther(amountEther);
      const tx = await tokenContract.mint(await signer.getAddress(), amount);
      setLastTxHash(tx.hash);
      setActionStep("Waiting for block confirmation on Monad...");
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Mint error:", err);
      setError(parseWeb3Error(err));
      return false;
    } finally {
      setActionLoading(null);
      setActionStep(null);
    }
  };

  // Create pool
  const createPool = async (
    recipient: string,
    targetAmountEther: string,
    durationSeconds: number,
    title: string,
    description: string
  ) => {
    try {
      setActionLoading("creating");
      setActionStep("Submitting pool creation transaction to Monad...");
      setError(null);
      setLastTxHash(null);

      const signer = await getSigner();
      const poolContract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, signer);

      const targetAmount = ethers.parseEther(targetAmountEther);
      const tx = await poolContract.createPool(
        CONTRACT_ADDRESSES.mockToken,
        recipient,
        targetAmount,
        durationSeconds,
        title,
        description
      );
      setLastTxHash(tx.hash);
      setActionStep("Confirming pool registration on-chain...");
      await tx.wait();
      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Create pool error:", err);
      setError(parseWeb3Error(err));
      return false;
    } finally {
      setActionLoading(null);
      setActionStep(null);
    }
  };

  // 2-step contribute: approve if necessary, then contribute
  const contributeToPool = async (poolId: number, amountEther: string) => {
    try {
      setError(null);
      setLastTxHash(null);
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      const amount = ethers.parseEther(amountEther);

      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockToken, MockERC20ABI, signer);
      const poolContract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, signer);

      // Step 1: Check allowance
      setActionLoading("checking_allowance");
      setActionStep("Checking mUSD spending allowance...");
      const allowance: bigint = await tokenContract.allowance(userAddress, CONTRACT_ADDRESSES.collectivePool);

      if (allowance < amount) {
        setActionLoading("approving");
        setActionStep("Step 1/2: Please approve token spending in your wallet...");
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.collectivePool, ethers.MaxUint256);
        setLastTxHash(approveTx.hash);
        setActionStep("Confirming token approval on Monad...");
        await approveTx.wait();
      }

      // Step 2: Deposit
      setActionLoading("contributing");
      setActionStep("Step 2/2: Depositing funds into pool...");
      const contributeTx = await poolContract.contribute(poolId, amount);
      setLastTxHash(contributeTx.hash);
      setActionStep("Confirming contribution on Monad...");
      await contributeTx.wait();

      const amountWei = amount;
      setPools((prev) =>
        prev.map((p) => {
          if (p.id === poolId) {
            const newContributed = p.totalContributed + amountWei;
            const contributors =
              account && !p.contributors.some((c) => c.toLowerCase() === account.toLowerCase())
                ? [...p.contributors, account]
                : p.contributors;
            return {
              ...p,
              totalContributed: newContributed,
              userContribution: (p.userContribution || 0n) + amountWei,
              remainingHeld: (p.remainingHeld || 0n) + amountWei,
              contributors,
            };
          }
          return p;
        })
      );

      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Contribution error:", err);
      setError(parseWeb3Error(err));
      return false;
    } finally {
      setActionLoading(null);
      setActionStep(null);
    }
  };

  // Claim payout (when target reached)
  const claimPayout = async (poolId: number) => {
    try {
      setActionLoading(`payout_${poolId}`);
      setActionStep("Submitting payout claim to recipient...");
      setError(null);
      setLastTxHash(null);

      const signer = await getSigner();
      const poolContract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, signer);

      const tx = await poolContract.claimPayout(poolId);
      setLastTxHash(tx.hash);
      setActionStep("Disbursing funds to recipient on Monad...");
      await tx.wait();

      setPools((prev) =>
        prev.map((p) => {
          if (p.id === poolId) {
            return {
              ...p,
              state: PoolState.PaidOut,
              remainingHeld: 0n,
            };
          }
          return p;
        })
      );

      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Payout error:", err);
      setError(parseWeb3Error(err));
      return false;
    } finally {
      setActionLoading(null);
      setActionStep(null);
    }
  };

  // Claim refund (when expired and under target)
  const claimRefund = async (poolId: number) => {
    try {
      setActionLoading(`refund_${poolId}`);
      setActionStep("Submitting 100% refund claim...");
      setError(null);
      setLastTxHash(null);

      const signer = await getSigner();
      const poolContract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, signer);

      const tx = await poolContract.claimRefund(poolId);
      setLastTxHash(tx.hash);
      setActionStep("Refunding your deposit directly to your wallet...");
      await tx.wait();

      setPools((prev) =>
        prev.map((p) => {
          if (p.id === poolId) {
            const userRefund = p.userContribution || 0n;
            return {
              ...p,
              userContribution: 0n,
              remainingHeld:
                p.remainingHeld && p.remainingHeld >= userRefund
                  ? p.remainingHeld - userRefund
                  : 0n,
            };
          }
          return p;
        })
      );

      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Refund error:", err);
      setError(parseWeb3Error(err));
      return false;
    } finally {
      setActionLoading(null);
      setActionStep(null);
    }
  };

  return {
    pools,
    isLoading,
    actionLoading,
    actionStep,
    lastTxHash,
    error,
    clearError: () => setError(null),
    loadPools,
    mintTestTokens,
    createPool,
    contributeToPool,
    claimPayout,
    claimRefund,
  };
}
