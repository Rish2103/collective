/**
 * Human-friendly error message parser for Web3 and EVM transactions.
 */
export function parseWeb3Error(error: any): string {
  if (!error) return "An unexpected error occurred.";

  const message = error.message || error.toString() || "";
  const reason = error.reason || "";
  const code = error.code;

  // 1. User rejection
  if (
    code === 4001 ||
    code === "ACTION_REJECTED" ||
    message.includes("user rejected") ||
    message.includes("User rejected") ||
    message.includes("User denied")
  ) {
    return "Transaction was cancelled in your wallet.";
  }

  // 2. Insufficient funds for gas (native MON)
  if (
    message.includes("insufficient funds for gas") ||
    message.includes("insufficient funds for intrinsic transaction cost") ||
    message.includes("exceeds the balance of the account")
  ) {
    return "Insufficient native MON in your wallet to pay for transaction gas on Monad Testnet. Please get testnet MON from the official faucet.";
  }

  // 3. Insufficient ERC20 token balance (mUSD)
  if (
    message.includes("transfer amount exceeds balance") ||
    message.includes("ERC20InsufficientBalance") ||
    reason.includes("transfer amount exceeds balance")
  ) {
    return "Insufficient mUSD balance. Please use the Faucet in the top-right to claim test tokens.";
  }

  // 4. Specific CollectivePool contract revert reasons
  if (reason.includes("Target amount has not been reached") || message.includes("Target amount has not been reached")) {
    return "Target funding amount has not yet been reached. Payout is not available.";
  }

  if (reason.includes("Pool deadline has passed") || message.includes("Pool deadline has passed")) {
    return "This pool deadline has already passed. New contributions are closed.";
  }

  if (reason.includes("Pool has not yet expired") || message.includes("Pool has not yet expired")) {
    return "This pool has not yet expired. Refunds only activate after the deadline passes.";
  }

  if (reason.includes("Target reached, refund unavailable") || message.includes("Target reached, refund unavailable")) {
    return "This pool reached its target! Refunds are unavailable because funds are reserved for the recipient payout.";
  }

  if (reason.includes("No contribution to refund") || message.includes("No contribution to refund")) {
    return "This refund has already been claimed and returned to your wallet.";
  }

  if (reason.includes("Pool is not active") || message.includes("Pool is not active")) {
    return "This pool is no longer active. It has either been paid out or is in refund mode.";
  }

  if (reason.includes("Invalid recipient address") || message.includes("Invalid recipient address")) {
    return "Invalid recipient address provided. Please enter a valid EVM address (0x...).";
  }

  // 5. Network / RPC errors
  if (
    message.includes("network error") ||
    message.includes("Failed to fetch") ||
    message.includes("could not detect network")
  ) {
    return "Network connection issue with Monad Testnet RPC. Please check your internet connection or try again shortly.";
  }

  // Fallback to cleaner message
  if (reason && typeof reason === "string" && reason.length < 120) {
    return reason;
  }

  // Strip excessive technical details if possible
  const executionRevertedMatch = message.match(/execution reverted: (.*?)(?:\(action=|$)/);
  if (executionRevertedMatch && executionRevertedMatch[1]) {
    return `Transaction reverted: ${executionRevertedMatch[1].trim()}`;
  }

  return "Transaction failed on Monad Testnet. Please review parameters and retry.";
}
