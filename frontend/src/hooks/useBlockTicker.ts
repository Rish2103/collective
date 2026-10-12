import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MONAD_TESTNET } from '../contracts/config';

export function useBlockTicker() {
  const [blockNumber, setBlockNumber] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const provider = new ethers.JsonRpcProvider(MONAD_TESTNET.rpcUrl);

    const fetchBlock = async () => {
      try {
        const latest = await provider.getBlockNumber();
        if (isMounted && typeof latest === 'number' && latest > 0) {
          setBlockNumber(latest);
        }
      } catch (err) {
        // Fail silently without blocking UI
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 10000); // Poll every 10s safely

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { blockNumber };
}
