import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Target,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Award,
  AlertCircle,
  ExternalLink,
  Info,
  CheckCircle2,
  Share2,
  Check,
  Copy,
  Coins,
  Sparkles,
  Users,
} from 'lucide-react';
import { PoolData, PoolState } from '../types';
import { getExplorerAddressUrl, getExplorerTxUrl } from '../contracts/config';
import { formatTokenAmount, shortenAddress, formatDeadline } from '../utils/formatters';
import { playCopyChime } from '../utils/audioFeedback';

interface PoolDetailsModalProps {
  pool: PoolData | null;
  isOpen: boolean;
  onClose: () => void;
  tokenSymbol: string;
  account: string | null;
  onContribute: (poolId: number, amount: string) => Promise<boolean>;
  onClaimPayout: (poolId: number) => Promise<boolean>;
  onClaimRefund: (poolId: number) => Promise<boolean>;
  actionLoading: string | null;
  actionStep?: string | null;
  lastTxHash?: string | null;
  error?: string | null;
  onClearError?: () => void;
  onOpenFaucet: () => void;
  tokenBalance: bigint;
  onOpenShare?: (pool: PoolData) => void;
}

export const PoolDetailsModal: React.FC<PoolDetailsModalProps> = ({
  pool,
  isOpen,
  onClose,
  tokenSymbol,
  account,
  onContribute,
  onClaimPayout,
  onClaimRefund,
  actionLoading,
  actionStep,
  lastTxHash,
  error,
  onClearError,
  onOpenFaucet,
  tokenBalance,
  onOpenShare,
}) => {
  const [contributionAmount, setContributionAmount] = useState('100');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [localRefundSuccess, setLocalRefundSuccess] = useState(false);
  const [localPayoutSuccess, setLocalPayoutSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  // Reset local state when pool id changes or modal opens
  useEffect(() => {
    setLocalRefundSuccess(false);
    setLocalPayoutSuccess(false);
    setValidationError(null);
    setCopiedLink(false);
  }, [pool?.id, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !actionLoading) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actionLoading, onClose]);

  if (!isOpen || !pool) return null;

  const targetWei = pool.targetAmount;
  const contributedWei = pool.totalContributed;
  const isTargetMet = contributedWei >= targetWei && targetWei > 0n;

  // Exact percentage calculation
  const percentNumber = targetWei > 0n ? Number((contributedWei * 100n) / targetWei) : 0;
  const clampedPercent = Math.min(percentNumber, 100);

  const deadlineInfo = formatDeadline(pool.deadline);
  const isPaidOut = pool.state === PoolState.PaidOut || localPayoutSuccess;
  const isRefunding = deadlineInfo.isExpired && !isTargetMet && !isPaidOut;
  const isActive = !deadlineInfo.isExpired && !isPaidOut;

  const userContributed = localRefundSuccess
    ? false
    : pool.userContribution
    ? pool.userContribution > 0n
    : false;

  const backerCount = pool.contributors.length;
  const avgContributionWei = backerCount > 0 ? contributedWei / BigInt(backerCount) : 0n;

  const isCreator = account && pool.creator.toLowerCase() === account.toLowerCase();
  const isRecipient = account && pool.recipient.toLowerCase() === account.toLowerCase();
  const wasContributor = account ? pool.contributors.some(c => c.toLowerCase() === account.toLowerCase()) : false;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(id);
    playCopyChime();
    setTimeout(() => setCopiedAddr(null), 1800);
  };

  const handleShare = async () => {
    if (onOpenShare) {
      onOpenShare(pool);
      return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?pool=${pool.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `COLLECTIVE: ${pool.title}`,
          text: `Support this pool on Monad Testnet: "${pool.title}"`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      playCopyChime();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (onClearError) onClearError();

    const amountNum = parseFloat(contributionAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setValidationError("Please enter an amount greater than zero.");
      return;
    }

    const maxBalEth = parseFloat(formatTokenAmount(tokenBalance));
    if (amountNum > maxBalEth) {
      setValidationError(`Insufficient ${tokenSymbol} balance. You have ${formatTokenAmount(tokenBalance)} ${tokenSymbol}.`);
      return;
    }

    const success = await onContribute(pool.id, contributionAmount);
    if (success) {
      setContributionAmount('100');
    }
  };

  const handleClaimRefundClick = async () => {
    if (onClearError) onClearError();
    const success = await onClaimRefund(pool.id);
    if (success) {
      setLocalRefundSuccess(true);
    }
  };

  const handleClaimPayoutClick = async () => {
    if (onClearError) onClearError();
    const success = await onClaimPayout(pool.id);
    if (success) {
      setLocalPayoutSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#0b0e17] border border-[#1e2333] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-[#1e2333] bg-[#0e121d]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-1 rounded-lg">
              Pool #{pool.id}
            </span>
            {isCreator && (
              <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-md">
                Created by You
              </span>
            )}
            {isRecipient && !isCreator && (
              <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-md">
                You are Recipient
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#161b28] hover:bg-[#20273a] text-gray-300 hover:text-white border border-[#273046] transition"
              title="Copy shareable link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              disabled={Boolean(actionLoading)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2030] transition disabled:opacity-40"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Title & Description */}
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
              {pool.title}
            </h3>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              {pool.description || "No detailed description provided for this pool."}
            </p>
          </div>

          {/* Funding Progress Card */}
          <div className="p-5 rounded-2xl bg-[#121624] border border-[#1e2333] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Raised</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-3xl font-black text-white">
                    {formatTokenAmount(contributedWei)}
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    of {formatTokenAmount(targetWei)} {tokenSymbol} target
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="font-mono text-2xl font-bold text-indigo-400">{percentNumber}%</span>
                <span className="text-xs text-gray-400 block">
                  {contributedWei < targetWei
                    ? `${formatTokenAmount(targetWei - contributedWei)} ${tokenSymbol} remaining`
                    : 'Target Achieved!'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#090b10] rounded-full overflow-hidden border border-[#1e2333]">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isPaidOut
                    ? 'bg-emerald-500'
                    : isTargetMet
                    ? 'bg-indigo-500'
                    : isRefunding
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400'
                }`}
                style={{ width: `${clampedPercent}%` }}
              />
            </div>

            {/* Overfunding Stretch Goal Notice */}
            {percentNumber > 100 && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-white">Overfunding Stretch Goal: </strong>
                  This pool reached <strong>{percentNumber}%</strong> of its target. {isPaidOut ? (
                    <>
                      All surplus (<strong>+{formatTokenAmount(contributedWei - targetWei)} {tokenSymbol}</strong>) was transferred in full directly to the recipient when payout was claimed on-chain. Under contract rules, 100% of all contributions are disbursed to the recipient and refunds are permanently closed.
                    </>
                  ) : (
                    <>
                      All surplus (<strong>+{formatTokenAmount(contributedWei - targetWei)} {tokenSymbol}</strong>) will be transferred directly to the designated recipient upon payout. Under contract rules, 100% of all contributions are disbursed to the recipient.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Key Intelligence Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
              <span className="text-[11px] text-gray-400 uppercase font-medium block">Backers</span>
              <span className="font-mono text-lg font-bold text-white mt-0.5 block">{backerCount}</span>
              <span className="text-[10px] text-gray-500">Unique contributors</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
              <span className="text-[11px] text-gray-400 uppercase font-medium block">Avg. Backer</span>
              <span className="font-mono text-lg font-bold text-indigo-300 mt-0.5 block">
                {formatTokenAmount(avgContributionWei)}
              </span>
              <span className="text-[10px] text-gray-500">{tokenSymbol} per backer</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
              <span className="text-[11px] text-gray-400 uppercase font-medium block">Time Status</span>
              <span
                className={`text-sm font-bold mt-1 block truncate ${
                  deadlineInfo.isExpired ? 'text-rose-400' : 'text-indigo-300'
                }`}
              >
                {deadlineInfo.text}
              </span>
              <span className="text-[10px] text-gray-500">
                {new Date(pool.deadline * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
              <span className="text-[11px] text-gray-400 uppercase font-medium block">Your Deposit</span>
              <span
                className={`font-mono text-lg font-bold mt-0.5 block ${
                  localRefundSuccess ? 'text-emerald-400' : userContributed ? 'text-white' : 'text-gray-500'
                }`}
              >
                {localRefundSuccess ? '0' : formatTokenAmount(pool.userContribution)}
              </span>
              <span className="text-[10px] text-gray-500">
                {localRefundSuccess ? '100% Refunded' : `${tokenSymbol} deposited`}
              </span>
            </div>
          </div>

          {/* On-Chain Participants & Contract Verification */}
          <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2333] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Designated Recipient:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <a
                  href={getExplorerAddressUrl(pool.recipient)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:underline"
                >
                  {shortenAddress(pool.recipient, 6)}
                </a>
                <button
                  onClick={() => handleCopy(pool.recipient, 'rec')}
                  className="text-gray-500 hover:text-white"
                  title="Copy recipient"
                >
                  {copiedAddr === 'rec' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pool Creator:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <a
                  href={getExplorerAddressUrl(pool.creator)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:underline"
                >
                  {shortenAddress(pool.creator, 6)}
                </a>
                <button
                  onClick={() => handleCopy(pool.creator, 'cre')}
                  className="text-gray-500 hover:text-white"
                  title="Copy creator"
                >
                  {copiedAddr === 'cre' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Settlement Escrow:</span>
              <div className="flex items-center gap-1 text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified CollectivePool Contract (Non-Custodial)</span>
              </div>
            </div>
          </div>

          {/* On-Chain Backers List */}
          <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2333] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>On-Chain Backers ({pool.contributors.length})</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {pool.contributors.length === 1 ? '1 backer' : `${pool.contributors.length} backers`}
              </span>
            </div>

            {pool.contributors.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500 bg-[#0c0f18] rounded-xl border border-dashed border-[#1a2030]">
                No backers have deposited yet. Be the first to back this pool!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {pool.contributors.map((backerAddr, idx) => {
                  const isUser = account && backerAddr.toLowerCase() === account.toLowerCase();
                  const avatarColor1 = `#${backerAddr.slice(2, 8)}`;
                  const avatarColor2 = `#${backerAddr.slice(8, 14)}`;

                  return (
                    <div
                      key={`${backerAddr}-${idx}`}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition border ${
                        isUser
                          ? 'bg-indigo-950/40 border-indigo-700/50 text-white'
                          : 'bg-[#0e121d] border-[#1b2234] text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Deterministic Avatar */}
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0 border border-white/20"
                          style={{
                            background: `linear-gradient(135deg, ${avatarColor1}, ${avatarColor2})`,
                          }}
                          aria-hidden="true"
                        />
                        <span className="font-mono">{shortenAddress(backerAddr, 6)}</span>
                        {isUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                            You
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isUser && pool.userContribution !== undefined && pool.userContribution > 0n && (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold mr-1">
                            {formatTokenAmount(pool.userContribution)} {tokenSymbol}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(backerAddr, `backer-${idx}`)}
                          className="p-1 text-gray-500 hover:text-white rounded"
                          title="Copy address"
                        >
                          {copiedAddr === `backer-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <a
                          href={getExplorerAddressUrl(backerAddr)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-500 hover:text-indigo-300 rounded"
                          title="View on Monad Explorer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Errors or Warnings */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {onClearError && (
                <button onClick={onClearError} className="underline text-[11px] text-gray-300 hover:text-white">
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Interactive Actions Section */}
          <div className="pt-2 border-t border-[#1e2333] space-y-4">
            {/* Case A: Paid Out Success Banner */}
            {isPaidOut && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Funds Paid Out to Recipient</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      All {formatTokenAmount(contributedWei)} {tokenSymbol} have been disbursed on Monad Testnet.
                    </p>
                  </div>
                </div>
                {lastTxHash && (
                  <a
                    href={getExplorerTxUrl(lastTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Receipt</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Case B: Target Reached and Ready for Payout */}
            {isTargetMet && !isPaidOut && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-600/40 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Funding Target Met! Funds are ready for payout.</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Anyone can trigger the release of funds directly to the designated recipient on-chain.
                </p>
                <button
                  onClick={handleClaimPayoutClick}
                  disabled={Boolean(actionLoading)}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === `payout_${pool.id}` ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{actionStep || 'Releasing Funds on Monad...'}</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>Release Payout ({formatTokenAmount(contributedWei)} {tokenSymbol})</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Case C: Expired under target (Refund State) */}
            {isRefunding && (
              <div className="space-y-3">
                {localRefundSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Refund Successfully Claimed!</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          100% of your deposit has been returned directly to your connected wallet.
                        </p>
                      </div>
                    </div>
                    {lastTxHash && (
                      <a
                        href={getExplorerTxUrl(lastTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Receipt</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ) : userContributed ? (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Guaranteed Refund Available</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This pool expired without reaching its target. You can pull back 100% of your deposit (
                      <strong className="text-white font-mono">{formatTokenAmount(pool.userContribution)} {tokenSymbol}</strong>
                      ) directly into your connected wallet.
                    </p>
                    <button
                      onClick={handleClaimRefundClick}
                      disabled={Boolean(actionLoading)}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === `refund_${pool.id}` ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{actionStep || 'Claiming 100% Refund...'}</span>
                        </>
                      ) : (
                        <span>Claim My 100% Refund ({formatTokenAmount(pool.userContribution)} {tokenSymbol})</span>
                      )}
                    </button>
                  </div>
                ) : wasContributor ? (
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-600/40 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>Refund Already Claimed & Settled</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Your connected wallet participated in this pool. Your 100% refund has already been withdrawn on-chain. There are 0 {tokenSymbol} remaining in escrow for this wallet.
                    </p>
                  </div>
                ) : account ? (
                  <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2333] space-y-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2 text-gray-300 font-semibold">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span>Not Eligible for Refund</span>
                    </div>
                    <p className="leading-relaxed">
                      Connected wallet ({shortenAddress(account)}) did not contribute to this pool. Under smart contract rules, pull refunds are strictly reserved for original contributors.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2333] text-center text-xs text-gray-400">
                    This pool expired under target. Connect a participating wallet to check refund eligibility and withdraw deposits.
                  </div>
                )}
              </div>
            )}

            {/* Case D: Active Pool Contribution Form */}
            {isActive && (
              <form onSubmit={handleContributeSubmit} className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Contribute to Goal</span>
                  <span className="text-gray-400">
                    Your Balance:{' '}
                    <button
                      type="button"
                      onClick={onOpenFaucet}
                      className="font-mono font-bold text-indigo-400 hover:underline"
                    >
                      {formatTokenAmount(tokenBalance)} {tokenSymbol}
                    </button>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="100"
                    disabled={Boolean(actionLoading)}
                    className="w-full bg-[#121624] border border-[#1e2333] focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none transition pr-20"
                  />
                  <span className="absolute right-4 top-3 text-sm font-semibold text-gray-400">
                    {tokenSymbol}
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex gap-2">
                  {['25', '50', '100', '250', '500'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setContributionAmount(preset)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-[#161b28] hover:bg-[#20273a] text-gray-300 hover:text-white border border-[#273046] transition font-mono"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>

                {validationError && (
                  <p className="text-xs text-rose-400 mt-1">{validationError}</p>
                )}

                <button
                  type="submit"
                  disabled={Boolean(actionLoading) || !account}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'approving' || actionLoading === 'contributing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{actionStep || 'Processing on Monad Testnet...'}</span>
                    </>
                  ) : !account ? (
                    <span>Connect Wallet to Back Pool</span>
                  ) : (
                    <>
                      <span>Deposit {contributionAmount} {tokenSymbol}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
