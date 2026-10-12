import React, { useState, useEffect } from 'react';
import { Clock, Target, User, ArrowUpRight, CheckCircle2, AlertOctagon, Share2, Check, ExternalLink } from 'lucide-react';
import { PoolData, PoolState } from '../types';
import { formatTokenAmount, shortenAddress, formatDeadline } from '../utils/formatters';
import { getExplorerAddressUrl } from '../contracts/config';
import { playCopyChime } from '../utils/audioFeedback';

interface PoolCardProps {
  pool: PoolData;
  tokenSymbol: string;
  account: string | null;
  onSelect: (pool: PoolData) => void;
  onClaimPayout: (poolId: number) => void;
  onClaimRefund: (poolId: number) => void;
  actionLoading: string | null;
  onOpenShare?: (pool: PoolData) => void;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  pool,
  tokenSymbol,
  account,
  onSelect,
  onClaimPayout,
  onClaimRefund,
  actionLoading,
  onOpenShare,
}) => {
  const [deadlineInfo, setDeadlineInfo] = useState(() => formatDeadline(pool.deadline));
  const [copiedLink, setCopiedLink] = useState(false);

  // Update countdown ticker every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDeadlineInfo(formatDeadline(pool.deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [pool.deadline]);

  // Handle Share Pool Link
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
        // Fallback to clipboard if user cancels or share fails
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

  const targetWei = pool.targetAmount;
  const contributedWei = pool.totalContributed;
  const isTargetMet = contributedWei >= targetWei && targetWei > 0n;

  // Exact percentage calculation
  const percentNumber = targetWei > 0n ? Number((contributedWei * 100n) / targetWei) : 0;
  const clampedPercent = Math.min(percentNumber, 100);

  const isPaidOut = pool.state === PoolState.PaidOut;
  const isRefundState = deadlineInfo.isExpired && !isTargetMet && !isPaidOut;

  const userContributed = pool.userContribution ? pool.userContribution > 0n : false;

  // Average contribution per backer
  const backerCount = pool.contributors.length;
  const avgContributionWei = backerCount > 0 ? contributedWei / BigInt(backerCount) : 0n;

  const isCreator = account && pool.creator.toLowerCase() === account.toLowerCase();
  const isRecipient = account && pool.recipient.toLowerCase() === account.toLowerCase();

  return (
    <div className="bg-[#0e111a] border border-[#1e2333] hover:border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden">
      <div>
        {/* Top Header: Pool ID, Status Badges & Share Button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-0.5 rounded-lg">
              Pool #{pool.id}
            </span>

            {isCreator && (
              <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-md">
                Created by You
              </span>
            )}

            {isRecipient && !isCreator && (
              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                You are Recipient
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-1 text-gray-400 hover:text-indigo-300 rounded-lg hover:bg-[#1a2030] border border-transparent hover:border-[#273046] transition relative"
              title="Share direct pool link"
              aria-label="Share pool"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink && (
                <span className="absolute -top-7 right-0 text-[10px] font-bold px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 rounded shadow-md whitespace-nowrap">
                  Link Copied!
                </span>
              )}
            </button>

            {/* Lifecycle Status Badge */}
            {isPaidOut ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-600/50">
                <CheckCircle2 className="w-3 h-3" />
                <span>Paid Out</span>
              </span>
            ) : isTargetMet ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-600/50">
                <CheckCircle2 className="w-3 h-3" />
                <span>{percentNumber > 100 ? `${percentNumber}% Funded` : 'Goal Met'}</span>
              </span>
            ) : isRefundState ? (
              pool.remainingHeld !== undefined && pool.remainingHeld === 0n && pool.totalContributed > 0n ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-600/50">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Refunds Settled</span>
                </span>
              ) : pool.totalContributed === 0n ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-900/80 text-gray-400 border border-gray-700/50">
                  <Clock className="w-3 h-3" />
                  <span>Expired (0 Raised)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-600/50 animate-pulse">
                  <AlertOctagon className="w-3 h-3" />
                  <span>Refunds Active</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950/50 text-indigo-300 border border-indigo-800/40">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>{deadlineInfo.text}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h4 className="text-lg font-bold text-white mb-1.5 line-clamp-1 group-hover:text-indigo-200 transition-colors">
          {pool.title}
        </h4>
        <p className="text-xs text-gray-400 mb-4 line-clamp-2 h-8 leading-relaxed">
          {pool.description || "No description provided."}
        </p>

        {/* Real Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className="font-semibold text-white">
              <span className="font-mono text-sm font-bold text-indigo-300">{formatTokenAmount(contributedWei)}</span> / {formatTokenAmount(targetWei)} {tokenSymbol}
            </span>
            <span className="font-mono font-semibold text-indigo-400">
              {percentNumber}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#090b10] rounded-full overflow-hidden border border-[#1e2333]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isPaidOut
                  ? 'bg-emerald-500'
                  : isTargetMet
                  ? 'bg-indigo-500'
                  : isRefundState
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${clampedPercent}%` }}
            />
          </div>

          {/* Overfunding Insight */}
          {percentNumber > 100 && (
            <p className="text-[10px] text-indigo-300/90 mt-1 flex items-center justify-between">
              <span>Stretch Goal: +{formatTokenAmount(contributedWei - targetWei)} {tokenSymbol} surplus</span>
              <span className="text-gray-400">Transfers to recipient</span>
            </p>
          )}
        </div>

        {/* Meta Info Grid: Recipient, Backers & Average Contribution */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 mb-4 bg-[#121622] p-2.5 rounded-xl border border-[#1e2333]">
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <a
              href={getExplorerAddressUrl(pool.recipient)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="truncate hover:text-indigo-300 hover:underline font-mono"
              title="View recipient on Monad Explorer"
            >
              To: {shortenAddress(pool.recipient)}
            </a>
          </div>
          <div className="flex items-center space-x-1.5 justify-end">
            <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{backerCount} {backerCount === 1 ? 'Backer' : 'Backers'}</span>
          </div>
        </div>

        {/* User's Contribution / Refund Status Pill */}
        {userContributed && (
          <div
            className={`mb-4 px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs ${
              isRefundState
                ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                : 'bg-indigo-950/40 border-indigo-800/40 text-indigo-300'
            }`}
          >
            <span className="text-gray-400">
              {isRefundState ? 'Claimable refund:' : 'Your deposit:'}
            </span>
            <span className="font-mono font-bold text-white">
              {formatTokenAmount(pool.userContribution)} {tokenSymbol}
            </span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="pt-2 border-t border-[#1e2333] flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(pool)}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#161a26] hover:bg-[#202538] text-indigo-200 border border-[#23283c] hover:border-[#303752] flex items-center justify-center space-x-1.5 transition-all"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {isRefundState && userContributed && (
          <button
            onClick={() => onClaimRefund(pool.id)}
            disabled={actionLoading === `refund_${pool.id}`}
            className="py-2 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {actionLoading === `refund_${pool.id}` ? 'Refunding...' : 'Claim Refund'}
          </button>
        )}

        {isTargetMet && !isPaidOut && (
          <button
            onClick={() => onClaimPayout(pool.id)}
            disabled={actionLoading === `payout_${pool.id}`}
            className="py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {actionLoading === `payout_${pool.id}` ? 'Releasing...' : 'Claim Payout'}
          </button>
        )}
      </div>
    </div>
  );
};
