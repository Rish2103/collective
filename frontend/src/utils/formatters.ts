import { ethers } from 'ethers';

/**
 * Truncates an EVM address safely (e.g. 0x1234...5678)
 */
export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return '';
  if (!ethers.isAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Truncates a transaction hash safely (e.g. 0xabcd...1234)
 */
export function shortenTxHash(hash: string | null | undefined, chars = 6): string {
  if (!hash) return '';
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Formats a BigInt or string token amount with decimals and comma separation
 */
export function formatTokenAmount(amountWei: bigint | string | undefined | null, decimals = 18, maxFractionDigits = 2): string {
  if (amountWei === undefined || amountWei === null) return '0';
  try {
    const weiBigInt = typeof amountWei === 'bigint' ? amountWei : BigInt(amountWei);
    const ethString = ethers.formatUnits(weiBigInt, decimals);
    const num = parseFloat(ethString);
    if (isNaN(num)) return '0';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    });
  } catch (e) {
    return '0';
  }
}

/**
 * Converts a human-readable token string (e.g. "150.5") to BigInt base units safely
 */
export function parseTokenAmount(amountStr: string, decimals = 18): bigint {
  if (!amountStr || !amountStr.trim()) return 0n;
  try {
    return ethers.parseUnits(amountStr.trim(), decimals);
  } catch (e) {
    return 0n;
  }
}

/**
 * Formats deadline countdown or elapsed duration
 */
export function formatDeadline(deadlineTimestamp: number): {
  text: string;
  isExpired: boolean;
  secondsRemaining: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadlineTimestamp - now;

  if (diff <= 0) {
    const elapsed = Math.abs(diff);
    let elapsedText = 'Expired';
    if (elapsed < 60) elapsedText = `Expired ${elapsed}s ago`;
    else if (elapsed < 3600) elapsedText = `Expired ${Math.floor(elapsed / 60)}m ago`;
    else if (elapsed < 86400) elapsedText = `Expired ${Math.floor(elapsed / 3600)}h ago`;
    else elapsedText = `Expired ${Math.floor(elapsed / 86400)}d ago`;

    return {
      text: elapsedText,
      isExpired: true,
      secondsRemaining: 0,
    };
  }

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return {
      text: `${days}d ${hours % 24}h remaining`,
      isExpired: false,
      secondsRemaining: diff,
    };
  }

  if (hours > 0) {
    return {
      text: `${hours}h ${minutes}m remaining`,
      isExpired: false,
      secondsRemaining: diff,
    };
  }

  return {
    text: `${minutes}m ${seconds}s remaining`,
    isExpired: false,
    secondsRemaining: diff,
  };
}

/**
 * Formats a block timestamp to human-friendly local string
 */
export function formatBlockTime(timestampSeconds: number): string {
  if (!timestampSeconds) return '';
  return new Date(timestampSeconds * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
