import React, { useState } from 'react';
import { ethers } from 'ethers';
import { X, User, Target, Clock, ShieldCheck, ArrowRight, Loader2, RotateCcw, Award, AlertCircle } from 'lucide-react';
import { PoolData, PoolState } from '../types';

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
  onOpenFaucet: () => void;
  tokenBalance: bigint;
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
  onOpenFaucet,
  tokenBalance,
}) => {
  const [contributionAmount, setContributionAmount] = useState('100');

  if (!isOpen || !pool) return null;

  const targetEth = parseFloat(ethers.formatEther(pool.targetAmount));
  const contributedEth = parseFloat(ethers.formatEther(pool.totalContributed));
  const percent = targetEth > 0 ? Math.min(Math.round((contributedEth / targetEth) * 100), 100) : 0;
  const isTargetMet = contributedEth >= targetEth;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = pool.deadline <= now;

  const isPaidOut = pool.state === PoolState.PaidOut;
  const isRefunding = isExpired && !isTargetMet && !isPaidOut;
  const isActive = !isExpired && !isPaidOut;

  const userContributedEth = pool.userContribution
    ? parseFloat(ethers.formatEther(pool.userContribution))
    : 0;

  const userTokenBalanceEth = parseFloat(ethers.formatEther(tokenBalance));

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onContribute(pool.id, contributionAmount);
  };

  const isUserRecipient = account && pool.recipient.toLowerCase() === account.toLowerCase();
  const isUserCreator = account && pool.creator.toLowerCase() === account.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#12141c] border border-purple-800/40 rounded-3xl shadow-2xl shadow-purple-950/60 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-mono text-purple-400 bg-purple-950/50 border border-purple-800/40 px-2.5 py-0.5 rounded-md">
                Pool #{pool.id}
              </span>
              {isPaidOut && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                  Paid Out to Recipient
                </span>
              )}
              {isTargetMet && !isPaidOut && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-600/40">
                  Target Met (Ready for Payout)
                </span>
              )}
              {isRefunding && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-600/40">
                  Expired — 100% Refunds Active
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{pool.title}</h2>
            <p className="text-sm text-gray-300 mt-1 leading-relaxed">
              {pool.description || "No description provided."}
            </p>
          </div>

          {/* Progress Box */}
          <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-3">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider block">Raised</span>
                <span className="mono text-2xl font-extrabold text-white">
                  {contributedEth.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 ml-1.5 font-medium">/ {targetEth.toLocaleString()} {tokenSymbol}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 uppercase tracking-wider block">Progress</span>
                <span className="mono text-2xl font-extrabold text-purple-400">{percent}%</span>
              </div>
            </div>

            <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
              <div
                className={`h-full transition-all duration-500 ${
                  isPaidOut
                    ? 'bg-emerald-500'
                    : isTargetMet
                    ? 'bg-indigo-500'
                    : isRefunding
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Key Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-950/50 p-3.5 rounded-xl border border-gray-800/80 space-y-1">
              <span className="text-gray-400 font-medium flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Recipient (Receives Payout)</span>
              </span>
              <p className="mono font-semibold text-gray-200 truncate">{pool.recipient}</p>
            </div>
            <div className="bg-gray-950/50 p-3.5 rounded-xl border border-gray-800/80 space-y-1">
              <span className="text-gray-400 font-medium flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Deadline</span>
              </span>
              <p className="mono font-semibold text-gray-200">
                {new Date(pool.deadline * 1000).toLocaleString()}
              </p>
            </div>
          </div>

          {/* User's Contribution Status */}
          {account && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-300 font-medium block">Your Contribution</span>
                <span className="mono text-lg font-bold text-white">
                  {userContributedEth.toLocaleString()} {tokenSymbol}
                </span>
              </div>
              {userContributedEth > 0 && isRefunding && (
                <button
                  onClick={() => onClaimRefund(pool.id)}
                  disabled={actionLoading === `refund_${pool.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center space-x-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {actionLoading === `refund_${pool.id}` ? 'Claiming Refund...' : 'Claim 100% Refund'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Payout Action (When Target Reached) */}
          {isTargetMet && !isPaidOut && (
            <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-700/50 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-300">
                <Award className="w-5 h-5" />
                <h4 className="text-sm font-bold">Funding Goal Accomplished!</h4>
              </div>
              <p className="text-xs text-gray-300">
                The target has been met. The total pooled amount ({contributedEth} {tokenSymbol}) can now be transferred directly to the designated recipient ({pool.recipient.slice(0, 8)}...).
              </p>
              <button
                onClick={() => onClaimPayout(pool.id)}
                disabled={actionLoading === `payout_${pool.id}`}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                {actionLoading === `payout_${pool.id}` ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Releasing Payout on Monad...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Execute Payout to Recipient</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Contribution Form (When Active) */}
          {isActive && (
            <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Contribute with Guaranteed Refund</span>
                </h4>
                <span className="text-xs text-gray-400">
                  Balance: <span className="mono font-semibold text-gray-200">{userTokenBalanceEth.toLocaleString()} {tokenSymbol}</span>
                </span>
              </div>

              {userTokenBalanceEth <= 0 && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>You don't have test tokens yet.</span>
                  </div>
                  <button
                    onClick={onOpenFaucet}
                    className="underline hover:text-white font-semibold"
                  >
                    Open Faucet
                  </button>
                </div>
              )}

              <form onSubmit={handleContributeSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-700 focus:border-purple-500 font-mono text-white outline-none text-base transition-all"
                    required
                  />
                  <span className="absolute right-4 top-3 text-sm font-semibold text-gray-400">
                    {tokenSymbol}
                  </span>
                </div>

                <div className="flex space-x-2">
                  {['25', '50', '100', '250', '500'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setContributionAmount(preset)}
                      className="flex-1 py-1 text-xs font-mono rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white transition-colors"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={
                    !!actionLoading ||
                    !contributionAmount ||
                    parseFloat(contributionAmount) <= 0 ||
                    !account
                  }
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all"
                >
                  {actionLoading === 'checking_allowance' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking ERC-20 Allowance...</span>
                    </>
                  )}
                  {actionLoading === 'approving' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Step 1/2: Approving Token Spending...</span>
                    </>
                  )}
                  {actionLoading === 'contributing' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Step 2/2: Confirming Deposit on Monad...</span>
                    </>
                  )}
                  {!actionLoading && (
                    <>
                      <span>Deposit {contributionAmount} {tokenSymbol}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Contributor List */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Backers ({pool.contributors.length})
            </h4>
            {pool.contributors.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No contributions yet. Be the first backer!</p>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-2">
                {pool.contributors.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-gray-950/40 border border-gray-900"
                  >
                    <span className="mono text-gray-300 truncate">{c}</span>
                    {account && c.toLowerCase() === account.toLowerCase() && (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
