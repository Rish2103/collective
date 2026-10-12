import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Clock, Target, User, ArrowUpRight, CheckCircle2, AlertOctagon, RotateCcw } from 'lucide-react';
import { PoolData, PoolState } from '../types';

interface PoolCardProps {
  pool: PoolData;
  tokenSymbol: string;
  account: string | null;
  onSelect: (pool: PoolData) => void;
  onClaimPayout: (poolId: number) => void;
  onClaimRefund: (poolId: number) => void;
  actionLoading: string | null;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  pool,
  tokenSymbol,
  account,
  onSelect,
  onClaimPayout,
  onClaimRefund,
  actionLoading,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Update countdown ticker
  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = pool.deadline - now;

      if (remaining <= 0) {
        setIsExpired(true);
        const past = Math.abs(remaining);
        if (past < 60) setTimeLeft('Just ended');
        else if (past < 3600) setTimeLeft(`Ended ${Math.floor(past / 60)}m ago`);
        else setTimeLeft(`Ended ${Math.floor(past / 3600)}h ago`);
      } else {
        setIsExpired(false);
        const hours = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        const secs = remaining % 60;
        if (hours > 0) {
          setTimeLeft(`${hours}h ${mins}m left`);
        } else {
          setTimeLeft(`${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s left`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pool.deadline]);

  const targetEth = parseFloat(ethers.formatEther(pool.targetAmount));
  const contributedEth = parseFloat(ethers.formatEther(pool.totalContributed));
  const percent = targetEth > 0 ? Math.min(Math.round((contributedEth / targetEth) * 100), 100) : 0;
  const isTargetMet = contributedEth >= targetEth;

  const isPaidOut = pool.state === PoolState.PaidOut;
  const isRefundState = isExpired && !isTargetMet && !isPaidOut;

  const userContributed = pool.userContribution ? pool.userContribution > 0n : false;

  return (
    <div className="bg-[#12141c]/90 border border-gray-800/80 hover:border-purple-600/40 rounded-2xl p-5 shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Header & Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-800/30 px-2 py-0.5 rounded-md">
            Pool #{pool.id}
          </span>

          {isPaidOut ? (
            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-600/40">
              <CheckCircle2 className="w-3 h-3" />
              <span>Paid Out</span>
            </span>
          ) : isTargetMet ? (
            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-600/40">
              <CheckCircle2 className="w-3 h-3" />
              <span>Target Reached</span>
            </span>
          ) : isRefundState ? (
            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-600/40">
              <AlertOctagon className="w-3 h-3" />
              <span>Refund Open</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-600/40">
              <Clock className="w-3 h-3" />
              <span>{timeLeft}</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h4 className="text-base font-bold text-white mb-1.5 line-clamp-1">{pool.title}</h4>
        <p className="text-xs text-gray-400 mb-4 line-clamp-2 h-8">{pool.description || "No description provided."}</p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className="font-semibold text-white">
              <span className="mono text-sm font-bold text-purple-300">{contributedEth.toLocaleString()}</span> / {targetEth.toLocaleString()} {tokenSymbol}
            </span>
            <span className="mono font-semibold text-purple-400">{percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div
              className={`h-full transition-all duration-500 ${
                isPaidOut
                  ? 'bg-emerald-500'
                  : isTargetMet
                  ? 'bg-indigo-500'
                  : isRefundState
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Info badges */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 mb-4 bg-gray-950/40 p-2.5 rounded-xl border border-gray-900">
          <div className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span className="truncate">To: {pool.recipient.slice(0, 6)}...{pool.recipient.slice(-4)}</span>
          </div>
          <div className="flex items-center space-x-1.5 justify-end">
            <Target className="w-3.5 h-3.5 text-gray-500" />
            <span>{pool.contributors.length} Backers</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelect(pool)}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 flex items-center justify-center space-x-1 transition-colors"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {/* Conditional quick action */}
        {isTargetMet && !isPaidOut && (
          <button
            onClick={() => onClaimPayout(pool.id)}
            disabled={actionLoading === `payout_${pool.id}`}
            className="py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
          >
            {actionLoading === `payout_${pool.id}` ? 'Releasing...' : 'Claim Payout'}
          </button>
        )}

        {isRefundState && userContributed && (
          <button
            onClick={() => onClaimRefund(pool.id)}
            disabled={actionLoading === `refund_${pool.id}`}
            className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{actionLoading === `refund_${pool.id}` ? 'Refunding...' : 'Claim Refund'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
