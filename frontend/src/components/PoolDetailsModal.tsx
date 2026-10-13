import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
  CheckCircle2,
  Share2,
  Check,
  Copy,
  Coins,
  Sparkles,
  Users,
  Zap,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { PoolData, PoolState } from '../types';
import { getExplorerAddressUrl, getExplorerTxUrl, getTokenConfig } from '../contracts/config';
import { formatTokenAmount, shortenAddress, formatDeadline } from '../utils/formatters';
import { playCopyChime } from '../utils/audioFeedback';
import { calculateFairShare, calculateFundingPace } from '../utils/metadata';

interface PoolDetailsModalProps {
  pool: PoolData | null;
  isOpen: boolean;
  onClose: () => void;
  tokenSymbol?: string;
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
  onOpenReceipt?: (pool: PoolData) => void;
  isRescueRequested?: boolean;
}

export const PoolDetailsModal: React.FC<PoolDetailsModalProps> = ({
  pool,
  isOpen,
  onClose,
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
  onOpenReceipt,
  isRescueRequested = false,
}) => {
  const [contributionAmount, setContributionAmount] = useState('100');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [localRefundSuccess, setLocalRefundSuccess] = useState(false);
  const [localPayoutSuccess, setLocalPayoutSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRescueLink, setCopiedRescueLink] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const tokenConfig = getTokenConfig(pool?.token);

  // Reset local state when pool id changes or modal opens
  useEffect(() => {
    setLocalRefundSuccess(false);
    setLocalPayoutSuccess(false);
    setValidationError(null);
    setCopiedLink(false);
    setCopiedRescueLink(false);
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

  // FairShare Calculation
  const fairShare = calculateFairShare(targetWei, pool.expectedParticipants, pool.userContribution);

  // Funding Pace Calculation
  const pace = calculateFundingPace(targetWei, contributedWei, pool.deadline);
  const remainingNeededFormatted = formatTokenAmount(pace.remainingNeededWei, tokenConfig.decimals);
  const remainingNeededClean = ethers.formatUnits(pace.remainingNeededWei, tokenConfig.decimals);

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
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      playCopyChime();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleCopyRescueLink = async () => {
    const rescueUrl = `${window.location.origin}${window.location.pathname}?pool=${pool.id}&rescue=true`;
    try {
      await navigator.clipboard.writeText(rescueUrl);
      setCopiedRescueLink(true);
      playCopyChime();
      setTimeout(() => setCopiedRescueLink(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleRescueGoalClick = () => {
    if (pace.remainingNeededWei > 0n) {
      setContributionAmount(remainingNeededClean);
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!account) {
      setValidationError("Please connect your wallet first.");
      return;
    }
    const amountNum = parseFloat(contributionAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setValidationError("Contribution must be greater than zero.");
      return;
    }

    const ok = await onContribute(pool.id, contributionAmount);
    if (ok) {
      setContributionAmount('100');
    }
  };

  const handleClaimPayoutClick = async () => {
    const ok = await onClaimPayout(pool.id);
    if (ok) {
      setLocalPayoutSuccess(true);
    }
  };

  const handleClaimRefundClick = async () => {
    const ok = await onClaimRefund(pool.id);
    if (ok) {
      setLocalRefundSuccess(true);
    }
  };

  const displayDescription = pool.cleanDescription || pool.description || "No description provided.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pool-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#0b0e17] border border-[#1e2333] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e2333] bg-[#0e121d]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800/40 px-2.5 py-1 rounded-lg">
              Pool #{pool.id}
            </span>

            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
              tokenConfig.isNativeUsdc
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40'
            }`}>
              {tokenConfig.symbol}
            </span>

            {isCreator && (
              <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2.5 py-0.5 rounded-md">
                Created by You
              </span>
            )}
            {isRecipient && !isCreator && (
              <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-md">
                Recipient
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(isPaidOut || isRefunding) && onOpenReceipt && (
              <button
                onClick={() => onOpenReceipt(pool)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-950/60 text-indigo-300 hover:text-white border border-indigo-800/50 hover:bg-indigo-900/80 transition"
                title="View verified on-chain outcome receipt"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Outcome Receipt</span>
              </button>
            )}

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
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Goal Rescue Alert Banner if rescue mode is triggered */}
          {isRescueRequested && pace.remainingNeededWei > 0n && isActive && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-indigo-950/60 border border-amber-500/50 flex items-center justify-between text-amber-200 text-xs shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Goal Rescue Mode Active</h4>
                  <p className="text-amber-200/90 mt-0.5">
                    This pool is just <strong>{remainingNeededFormatted} {tokenConfig.symbol}</strong> away from hitting its goal! You can rescue this goal below with one click.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRescueGoalClick}
                className="px-3 py-1.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-black text-xs shrink-0 ml-3 transition"
              >
                Match Gap
              </button>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h3 id="pool-modal-title" className="text-2xl font-black text-white tracking-tight leading-snug">
              {pool.title}
            </h3>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              {displayDescription}
            </p>
          </div>

          {/* Funding Progress Card */}
          <div className="p-5 rounded-2xl bg-[#121624] border border-[#1e2333] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Raised</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-3xl font-black text-white">
                    {formatTokenAmount(contributedWei, tokenConfig.decimals)}
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    of {formatTokenAmount(targetWei, tokenConfig.decimals)} {tokenConfig.symbol} target
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="font-mono text-2xl font-bold text-indigo-400">{percentNumber}%</span>
                <span className="text-xs text-gray-400 block">
                  {contributedWei < targetWei
                    ? `${remainingNeededFormatted} ${tokenConfig.symbol} remaining`
                    : 'Goal Secured!'}
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
                  <strong className="font-semibold text-white">Stretch Goal Surplus: </strong>
                  This pool reached <strong>{percentNumber}%</strong> of its target. {isPaidOut ? (
                    <>
                      All surplus (<strong>+{formatTokenAmount(contributedWei - targetWei, tokenConfig.decimals)} {tokenConfig.symbol}</strong>) was transferred directly to the recipient on-chain. Under contract rules, 100% of all contributions are disbursed to the recipient and refunds are permanently closed.
                    </>
                  ) : (
                    <>
                      All surplus (<strong>+{formatTokenAmount(contributedWei - targetWei, tokenConfig.decimals)} {tokenConfig.symbol}</strong>) will be transferred directly to the recipient upon payout. Additional contributions after reaching the target are accepted and will also go to the recipient as stretch funding.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FairShare Voluntary Breakdown Card */}
          {fairShare.hasTargetParticipants && (
            <div className="p-4 rounded-2xl bg-[#121624] border border-[#1e2333] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>FairShare Guidance ({fairShare.expectedParticipants} Participants)</span>
                </span>
                <span className="text-[10px] text-gray-400">Voluntary Guidance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0e121d] border border-[#1b2234]">
                  <span className="text-gray-400 block">Suggested Share per Person</span>
                  <span className="font-mono text-base font-bold text-white mt-0.5 block">
                    ~{formatTokenAmount(fairShare.suggestedPerPersonWei, tokenConfig.decimals)} {tokenConfig.symbol}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#0e121d] border border-[#1b2234]">
                  <span className="text-gray-400 block">Your Contribution so Far</span>
                  <span className="font-mono text-base font-bold text-indigo-300 mt-0.5 block">
                    {formatTokenAmount(fairShare.userContributionWei, tokenConfig.decimals)} {tokenConfig.symbol}
                    {fairShare.isUserShareFulfilled && (
                      <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-sans font-semibold">
                        Suggested share reached!
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed">
                {fairShare.guidanceNotice}
              </p>

              {isActive && !fairShare.isUserShareFulfilled && fairShare.remainingUserShareWei > 0n && (
                <button
                  type="button"
                  onClick={() =>
                    setContributionAmount(
                      ethers.formatUnits(fairShare.remainingUserShareWei, tokenConfig.decimals)
                    )
                  }
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#1a2030] hover:bg-[#252c42] text-indigo-300 border border-indigo-800/40 transition flex items-center justify-center gap-1.5"
                >
                  <span>Fill My Remaining Suggested Share ({formatTokenAmount(fairShare.remainingUserShareWei, tokenConfig.decimals)} {tokenConfig.symbol})</span>
                </button>
              )}
            </div>
          )}

          {/* Funding Pace & Goal Rescue Card */}
          {isActive && pace.remainingNeededWei > 0n && (
            <div className="p-4 rounded-2xl bg-[#121624] border border-[#1e2333] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Funding Pace & Goal Rescue</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {remainingNeededFormatted} {tokenConfig.symbol} needed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-[#0e121d] border border-[#1b2234]">
                  <span className="text-gray-400 text-[11px] block">Required Daily Pace</span>
                  <span className="font-mono text-sm font-bold text-white mt-0.5 block">
                    ~{formatTokenAmount(pace.pacePerDayWei, tokenConfig.decimals)} {tokenConfig.symbol} / day
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0e121d] border border-[#1b2234]">
                  <span className="text-gray-400 text-[11px] block">Required Hourly Pace</span>
                  <span className="font-mono text-sm font-bold text-indigo-300 mt-0.5 block">
                    ~{formatTokenAmount(pace.pacePerHourWei, tokenConfig.decimals)} {tokenConfig.symbol} / hour
                  </span>
                </div>
              </div>

              {/* Goal Rescue Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRescueGoalClick}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rescue Goal: Fill Gap ({remainingNeededFormatted} {tokenConfig.symbol})</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyRescueLink}
                  className="py-2 px-3 rounded-xl text-xs font-semibold bg-[#161b28] hover:bg-[#20273a] text-gray-300 hover:text-white border border-[#273046] transition flex items-center gap-1"
                  title="Copy Goal Rescue link to share with potential sponsors"
                >
                  {copiedRescueLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedRescueLink ? 'Link Copied!' : 'Rescue Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
              <span className="text-[11px] text-gray-400 uppercase font-medium block">Backers</span>
              <span className="font-mono text-lg font-bold text-white mt-0.5 block">{backerCount}</span>
              <span className="text-[10px] text-gray-500">Unique contributors</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
              <span className="text-[11px] text-gray-400 uppercase font-medium block">Avg. Backer</span>
              <span className="font-mono text-lg font-bold text-indigo-300 mt-0.5 block">
                {formatTokenAmount(avgContributionWei, tokenConfig.decimals)}
              </span>
              <span className="text-[10px] text-gray-500">{tokenConfig.symbol} per backer</span>
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
                {localRefundSuccess ? '0' : formatTokenAmount(pool.userContribution, tokenConfig.decimals)}
              </span>
              <span className="text-[10px] text-gray-500">
                {localRefundSuccess ? '100% Refunded' : `${tokenConfig.symbol} deposited`}
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
              <span className="text-gray-400">Token Contract:</span>
              <div className="flex items-center gap-1.5 font-mono">
                <a
                  href={getExplorerAddressUrl(tokenConfig.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:underline"
                >
                  {shortenAddress(tokenConfig.address, 6)} ({tokenConfig.symbol})
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Security Invariant:</span>
              <div className="flex items-center gap-1 text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Non-Custodial Smart Contract</span>
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
                No backers have contributed yet. Be the first to back this pool!
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
                            {formatTokenAmount(pool.userContribution, tokenConfig.decimals)} {tokenConfig.symbol}
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
                      All {formatTokenAmount(contributedWei, tokenConfig.decimals)} {tokenConfig.symbol} have been disbursed on Monad Testnet.
                    </p>
                  </div>
                </div>
                {onOpenReceipt && (
                  <button
                    onClick={() => onOpenReceipt(pool)}
                    className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Receipt</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Case B: Target Reached and Ready for Payout */}
            {isTargetMet && !isPaidOut && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-600/40 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Funding Goal Secured! Ready to release funds.</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  The goal has been achieved. Anyone or the recipient can trigger the release of funds directly to the recipient wallet on-chain. Additional contributions will also transfer to the recipient as stretch funding.
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
                      <span>Release Funds ({formatTokenAmount(contributedWei, tokenConfig.decimals)} {tokenConfig.symbol})</span>
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
                  </div>
                ) : userContributed ? (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>100% Guaranteed Refund Available</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This pool expired without reaching its target. You can pull back 100% of your deposit (
                      <strong className="text-white font-mono">{formatTokenAmount(pool.userContribution, tokenConfig.decimals)} {tokenConfig.symbol}</strong>
                      ) directly into your connected wallet with zero permission needed.
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
                        <span>Claim My 100% Refund ({formatTokenAmount(pool.userContribution, tokenConfig.decimals)} {tokenConfig.symbol})</span>
                      )}
                    </button>
                  </div>
                ) : wasContributor ? (
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-600/40 space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>Refund Already Withdrawn</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Your connected wallet participated in this pool. Your 100% refund has already been withdrawn on-chain.
                    </p>
                  </div>
                ) : account ? (
                  <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2333] space-y-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2 text-gray-300 font-semibold">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span>Not Eligible for Refund</span>
                    </div>
                    <p className="leading-relaxed">
                      Connected wallet did not contribute to this pool. Pull refunds are strictly reserved for original contributors.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2333] text-center text-xs text-gray-400">
                    This pool expired under target. Connect a participating wallet to check refund eligibility.
                  </div>
                )}
              </div>
            )}

            {/* Case D: Active Pool Contribution Form */}
            {isActive && (
              <form onSubmit={handleContributeSubmit} className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Chip in to this Goal</span>
                  <span className="text-gray-400">
                    Your {tokenConfig.symbol} Balance:{' '}
                    <span className="font-mono font-bold text-indigo-400">
                      {formatTokenAmount(tokenBalance, tokenConfig.decimals)} {tokenConfig.symbol}
                    </span>
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
                    className="w-full bg-[#121624] border border-[#1e2333] focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none transition pr-24"
                  />
                  <span className="absolute right-4 top-3 text-sm font-semibold text-gray-400">
                    {tokenConfig.symbol}
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="flex gap-2 flex-wrap">
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
                  {pace.remainingNeededWei > 0n && (
                    <button
                      type="button"
                      onClick={handleRescueGoalClick}
                      className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition font-mono font-bold"
                    >
                      Fill Remaining ({remainingNeededFormatted})
                    </button>
                  )}
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
                      <span>Deposit {contributionAmount} {tokenConfig.symbol}</span>
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
