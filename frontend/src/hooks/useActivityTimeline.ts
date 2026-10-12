import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, MONAD_TESTNET } from '../contracts/config';
import { CollectivePoolABI } from '../contracts/abis';

export interface TimelineEvent {
  id: string; // unique key: txHash_logIndex
  type: 'PoolCreated' | 'ContributionMade' | 'PayoutClaimed' | 'RefundClaimed';
  poolId: number;
  account: string;
  recipient?: string;
  amount?: bigint;
  targetAmount?: bigint;
  title?: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

const STORAGE_KEY = 'collective_timeline_events_10143';

// Load stored events from localStorage
function getStoredEvents(): TimelineEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((e: any) => ({
      ...e,
      amount: e.amount ? BigInt(e.amount) : undefined,
      targetAmount: e.targetAmount ? BigInt(e.targetAmount) : undefined,
    }));
  } catch (err) {
    return [];
  }
}

// Save events to localStorage (serializing bigints to string)
function saveEvents(events: TimelineEvent[]) {
  try {
    const serializable = events.map((e) => ({
      ...e,
      amount: e.amount ? e.amount.toString() : undefined,
      targetAmount: e.targetAmount ? e.targetAmount.toString() : undefined,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable.slice(0, 150))); // keep up to 150
  } catch (err) {
    console.warn('Failed to cache timeline events:', err);
  }
}

export function useActivityTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>(getStoredEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [rpcNotice, setRpcNotice] = useState<string | null>(null);
  const [blockScope, setBlockScope] = useState<{ from: number; to: number } | null>(null);

  const oldestScannedBlockRef = useRef<number | null>(null);

  // Return a read provider
  const getProvider = useCallback(() => {
    if (window.ethereum) {
      try {
        return new ethers.BrowserProvider(window.ethereum);
      } catch (e) {
        // Fallback below
      }
    }
    return new ethers.JsonRpcProvider(MONAD_TESTNET.rpcUrl);
  }, []);

  // Decode an event log with robust named and positional fallback
  const decodeLog = async (log: ethers.Log, provider: ethers.Provider): Promise<TimelineEvent | null> => {
    if (!('eventName' in log) || !log.eventName) return null;
    const eventLog = log as ethers.EventLog;
    const block = await provider.getBlock(eventLog.blockNumber).catch(() => null);
    const blockTimestamp = block ? block.timestamp : Math.floor(Date.now() / 1000);

    const txHash = eventLog.transactionHash;
    const blockNumber = eventLog.blockNumber;
    const args: any = eventLog.args;

    if (eventLog.eventName === 'PoolCreated') {
      return {
        id: `${txHash}_${eventLog.index}`,
        type: 'PoolCreated',
        poolId: Number(args.poolId ?? args[0]),
        account: args.creator ?? args[1],
        recipient: args.recipient ?? args[2],
        targetAmount: args.targetAmount ?? args[4],
        title: args.title ?? args[6],
        txHash,
        blockNumber,
        timestamp: blockTimestamp,
      };
    } else if (eventLog.eventName === 'ContributionMade') {
      return {
        id: `${txHash}_${eventLog.index}`,
        type: 'ContributionMade',
        poolId: Number(args.poolId ?? args[0]),
        account: args.contributor ?? args[1],
        amount: args.amount ?? args[2],
        txHash,
        blockNumber,
        timestamp: blockTimestamp,
      };
    } else if (eventLog.eventName === 'PayoutClaimed') {
      return {
        id: `${txHash}_${eventLog.index}`,
        type: 'PayoutClaimed',
        poolId: Number(args.poolId ?? args[0]),
        account: args.recipient ?? args[1],
        recipient: args.recipient ?? args[1],
        amount: args.amount ?? args[2],
        txHash,
        blockNumber,
        timestamp: blockTimestamp,
      };
    } else if (eventLog.eventName === 'RefundClaimed') {
      return {
        id: `${txHash}_${eventLog.index}`,
        type: 'RefundClaimed',
        poolId: Number(args.poolId ?? args[0]),
        account: args.contributor ?? args[1],
        amount: args.amount ?? args[2],
        txHash,
        blockNumber,
        timestamp: blockTimestamp,
      };
    }
    return null;
  };

  // Bounded pagination: Query a range of blocks in safe 100-block intervals
  const fetchBlockRange = async (
    startBlock: number,
    endBlock: number,
    contract: ethers.Contract,
    provider: ethers.Provider
  ): Promise<TimelineEvent[]> => {
    const chunkEvents: TimelineEvent[] = [];
    let currentTo = endBlock;

    while (currentTo >= startBlock) {
      const currentFrom = Math.max(startBlock, currentTo - 99);
      try {
        const rawLogs = await contract.queryFilter('*', currentFrom, currentTo);
        for (const log of rawLogs) {
          const decoded = await decodeLog(log, provider);
          if (decoded) chunkEvents.push(decoded);
        }
      } catch (err: any) {
        console.warn(`Query range ${currentFrom}-${currentTo} failed:`, err.message);
        break; // Stop chunking gracefully if rate-limited
      }

      currentTo = currentFrom - 1;
      // Small delay between chunks to respect Monad RPC limits
      if (currentTo >= startBlock) {
        await new Promise((r) => setTimeout(r, 60));
      }
    }

    return chunkEvents;
  };

  // Fetch recent events (bounded to last 500 blocks in 5x 100-block intervals)
  const fetchRecentEvents = useCallback(async () => {
    setIsLoading(true);
    setRpcNotice(null);
    try {
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, provider);

      const latestBlock = await provider.getBlockNumber();
      // Bounded 500 block window (5 batches of 100 blocks)
      const windowBlocks = 500;
      const fromBlock = Math.max(0, latestBlock - windowBlocks);

      oldestScannedBlockRef.current = fromBlock;
      setBlockScope({ from: fromBlock, to: latestBlock });

      setRpcNotice(
        `Scanned blocks #${fromBlock.toLocaleString()} to #${latestBlock.toLocaleString()} on Monad Testnet (bounded 100-block intervals)`
      );

      const fetched = await fetchBlockRange(fromBlock, latestBlock, contract, provider);

      // Merge newly fetched events with existing stored events, deduplicating by id
      setEvents((prev) => {
        const map = new Map<string, TimelineEvent>();
        for (const e of fetched) map.set(e.id, e);
        for (const e of prev) {
          if (!map.has(e.id)) map.set(e.id, e);
        }
        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        saveEvents(merged);
        return merged;
      });

      setLastSynced(new Date());
    } catch (err: any) {
      console.warn('Could not query recent events from Monad RPC:', err.message);
      setRpcNotice('Notice: Monad Testnet RPC window limited. Showing verified session logs.');
    } finally {
      setIsLoading(false);
    }
  }, [getProvider]);

  // Load older blocks backwards (bounded to next 300 blocks)
  const loadOlderEvents = useCallback(async () => {
    if (isLoading || oldestScannedBlockRef.current === null || oldestScannedBlockRef.current <= 0) return;
    setIsLoading(true);
    try {
      const provider = getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.collectivePool, CollectivePoolABI, provider);

      const toBlock = oldestScannedBlockRef.current - 1;
      const fromBlock = Math.max(0, toBlock - 300);

      const olderEvents = await fetchBlockRange(fromBlock, toBlock, contract, provider);
      oldestScannedBlockRef.current = fromBlock;
      setBlockScope((prev) => (prev ? { from: fromBlock, to: prev.to } : { from: fromBlock, to: toBlock }));

      setRpcNotice(
        `Expanded scan to blocks #${fromBlock.toLocaleString()} to #${toBlock.toLocaleString()} on Monad Testnet`
      );

      setEvents((prev) => {
        const map = new Map<string, TimelineEvent>();
        for (const e of olderEvents) map.set(e.id, e);
        for (const e of prev) {
          if (!map.has(e.id)) map.set(e.id, e);
        }
        const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        saveEvents(merged);
        return merged;
      });
    } catch (err: any) {
      console.warn('Failed to load older blocks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, getProvider]);

  // Record an event locally immediately upon in-app transaction confirmation
  const recordEvent = useCallback((event: TimelineEvent) => {
    setEvents((prev) => {
      const filtered = prev.filter((e) => e.id !== event.id);
      const updated = [event, ...filtered].sort((a, b) => b.timestamp - a.timestamp);
      saveEvents(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchRecentEvents();
  }, [fetchRecentEvents]);

  return {
    events,
    isLoading,
    lastSynced,
    rpcNotice,
    blockScope,
    refreshEvents: fetchRecentEvents,
    loadOlderEvents,
    recordEvent,
  };
}
