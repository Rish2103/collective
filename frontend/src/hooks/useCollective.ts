import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../contracts/config';
import { CollectivePoolABI, MockERC20ABI } from '../contracts/abis';
import { PoolData, PoolState } from '../types';

export function useCollective(account: string | null) {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    if (!window.ethereum) throw new Error("MetaMask is not available");
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask is not available");
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }, []);

  const loadPools = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      setIsLoading(true);
      setError(null);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, provider);

      const countBig: bigint = await contract.getPoolCount();
      const count = Number(countBig);
      const loadedPools: PoolData[] = [];

      for (let i = 0; i < count; i++) {
        const poolRaw = await contract.pools(i);
        const contributors: string[] = await contract.getContributors(i);
        const computedStateNum = await contract.getComputedState(i);

        let userContribution = 0n;
        if (account) {
          userContribution = await contract.contributions(i, account);
        }

        loadedPools.push({
          id: Number(poolRaw.id),
          creator: poolRaw.creator,
          recipient: poolRaw.recipient,
          token: poolRaw.token,
          targetAmount: poolRaw.targetAmount,
          deadline: Number(poolRaw.deadline),
          totalContributed: poolRaw.totalContributed,
          state: Number(computedStateNum) as PoolState,
          title: poolRaw.title,
          description: poolRaw.description,
          contributors,
          userContribution,
        });
      }

      setPools(loadedPools.reverse()); // Newest first
    } catch (err: any) {
      console.warn("Could not load pools:", err);
      // Don't crash UI if contracts not deployed yet
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadPools();
  }, [loadPools]);

  // Mint mock test tokens
  const mintTestTokens = async (amountEther: string = "1000") => {
    try {
      setActionLoading("minting");
      setError(null);
      const signer = await getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockToken, MockERC20ABI, signer);
      
      const amount = ethers.parseEther(amountEther);
      const tx = await tokenContract.mint(await signer.getAddress(), amount);
      await tx.wait();
      return true;
    } catch (err: any) {
      console.error("Mint error:", err);
      setError(err?.reason || err?.message || "Failed to mint test tokens");
      return false;
    } finally {
      setActionLoading(null);
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
      setError(null);
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
      await tx.wait();
      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Create pool error:", err);
      setError(err?.reason || err?.message || "Failed to create pool");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // 2-step contribute: approve if necessary, then contribute
  const contributeToPool = async (poolId: number, amountEther: string) => {
    try {
      setError(null);
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      const amount = ethers.parseEther(amountEther);

      const tokenContract = new ethers.Contract(CONTRACT_ADDRESSES.mockToken, MockERC20ABI, signer);
      const poolContract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, signer);

      // Step 1: Check allowance
      setActionLoading("checking_allowance");
      const allowance: bigint = await tokenContract.allowance(userAddress, CONTRACT_ADDRESSES.collectivePool);

      if (allowance < amount) {
        setActionLoading("approving");
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.collectivePool, ethers.MaxUint256);
        await approveTx.wait();
      }

      // Step 2: Deposit
      setActionLoading("contributing");
      const contributeTx = await poolContract.contribute(poolId, amount);
      await contributeTx.wait();

      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Contribution error:", err);
      setError(err?.reason || err?.message || "Failed to contribute to pool");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // Claim payout (when target reached)
  const claimPayout = async (poolId: number) => {
    try {
      setActionLoading(`payout_${poolId}`);
      setError(null);
      const signer = await getSigner();
      const poolContract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, signer);

      const tx = await poolContract.claimPayout(poolId);
      await tx.wait();
      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Payout error:", err);
      setError(err?.reason || err?.message || "Failed to claim payout");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // Claim refund (when expired and under target)
  const claimRefund = async (poolId: number) => {
    try {
      setActionLoading(`refund_${poolId}`);
      setError(null);
      const signer = await getSigner();
      const poolContract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, signer);

      const tx = await poolContract.claimRefund(poolId);
      await tx.wait();
      await loadPools();
      return true;
    } catch (err: any) {
      console.error("Refund error:", err);
      setError(err?.reason || err?.message || "Failed to claim refund");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  return {
    pools,
    isLoading,
    actionLoading,
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
