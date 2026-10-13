import React from 'react';
import { PiggyBank, ShieldAlert, PlusCircle, ArrowRight, CheckCircle2, Clock, Check } from 'lucide-react';
import { PoolData, PoolState } from '../types';
import { formatTokenAmount, shortenAddress } from '../utils/formatters';
import { getTokenConfig } from '../contracts/config';

interface PersonalDashboardProps {
  account: string | null;
  pools: PoolData[];
  tokenSymbol: string;
  onConnectWallet: () => void;
  onOpenCreatePool: () => void;
  onSelectPool: (poolId: number) => void;
  onClaimRefund?: (poolId: number) => Promise<boolean> | void;
  onClaimPayout?: (poolId: number) => Promise<boolean> | void;
  actionLoading?: string | null;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  account,
  pools,
  tokenSymbol,
  onConnectWallet,
  onOpenCreatePool,
  onSelectPool,
  onClaimRefund,
  onClaimPayout,
  actionLoading,
}) => {
  if (!account) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-[#0e111a] border border-[#1e2333] shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <PiggyBank className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Connect Wallet to View Your Activity</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-5">
          Track pools you've created, track your active contributions, and claim 100% refunds directly from your personal dashboard.
        </p>
        <button
          onClick={onConnectWallet}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const userLower = account.toLowerCase();

  const backedPools: {
    pool: PoolData;
    status: 'active' | 'claimable' | 'settled' | 'paid_out';
    userDeposit: bigint;
  }[] = [];

  const createdPools: PoolData[] = [];
  const eligibleRefundPools: PoolData[] = [];

  let activePoolsCount = 0;
  let settledPoolsCount = 0;

  for (const p of pools) {
    const isCreator = p.creator.toLowerCase() === userLower;
    if (isCreator) createdPools.push(p);

    const userDeposit = p.userContribution ?? 0n;
    const wasContributor = p.contributors.some((c) => c.toLowerCase() === userLower);
    const hasCurrentDeposit = userDeposit > 0n;

    if (wasContributor || hasCurrentDeposit) {
      const isTargetMet = p.totalContributed >= p.targetAmount && p.targetAmount > 0n;
      const isExpired = p.deadline <= now;
      const isPaid = p.state === PoolState.PaidOut;

      if (isPaid || isTargetMet) {
        settledPoolsCount++;
        backedPools.push({ pool: p, status: 'paid_out', userDeposit });
      } else if (!isExpired) {
        activePoolsCount++;
        backedPools.push({ pool: p, status: 'active', userDeposit });
      } else {
        if (hasCurrentDeposit) {
          eligibleRefundPools.push(p);
          backedPools.push({ pool: p, status: 'claimable', userDeposit });
        } else {
          settledPoolsCount++;
          backedPools.push({ pool: p, status: 'settled', userDeposit: 0n });
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Stats Card */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#0e111a] border border-[#1e2333] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1e2333] gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Personal Backer Dashboard</h2>
                <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/40">
                  {shortenAddress(account)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Deterministic accounting of your active deposits, settled goals, and claimable refunds
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreatePool}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Pool</span>
          </button>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-[#121622] border border-[#1e2333]">
            <span className="text-[11px] text-gray-400 uppercase font-medium block">Active Backed</span>
            <span className="font-mono text-xl font-black text-white mt-0.5 block">
              {activePoolsCount}
            </span>
            <span className="text-[10px] text-gray-500">Ongoing funding pots</span>
          </div>

          <div
            className={`p-3.5 rounded-xl border ${
              eligibleRefundPools.length > 0
                ? 'bg-rose-950/20 border-rose-600/40 text-rose-300'
                : 'bg-[#121622] border-[#1e2333]'
            }`}
          >
            <span className="text-[11px] text-gray-400 uppercase font-medium block">Claimable Refunds</span>
            <span
              className={`font-mono text-xl font-black mt-0.5 block ${
                eligibleRefundPools.length > 0 ? 'text-rose-400' : 'text-gray-400'
              }`}
            >
              {eligibleRefundPools.length}
            </span>
            <span className="text-[10px] text-gray-500">
              {eligibleRefundPools.length > 0 ? 'Ready to pull back' : 'No pending refunds'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121622] border border-[#1e2333]">
            <span className="text-[11px] text-gray-400 uppercase font-medium block">Pools Created</span>
            <span className="font-mono text-xl font-black text-indigo-300 mt-0.5 block">
              {createdPools.length}
            </span>
            <span className="text-[10px] text-gray-500">By connected wallet</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121622] border border-[#1e2333]">
            <span className="text-[11px] text-gray-400 uppercase font-medium block">Settled Goals</span>
            <span className="font-mono text-xl font-black text-emerald-400 mt-0.5 block">
              {settledPoolsCount}
            </span>
            <span className="text-[10px] text-gray-500">Completed or refunded</span>
          </div>
        </div>
      </div>

      {/* Claimable Refund Alert Banner if strictly eligible */}
      {eligibleRefundPools.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                You have {eligibleRefundPools.length} pool{eligibleRefundPools.length === 1 ? '' : 's'} with claimable refunds
              </h4>
              <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">
                {eligibleRefundPools.length === 1
                  ? `Pool #${eligibleRefundPools[0].id} ("${eligibleRefundPools[0].title}") concluded without reaching its target. 100% of your deposit is secured for withdrawal.`
                  : `${eligibleRefundPools.length} pools expired under target. You can pull back your deposits anytime with zero penalty.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            {eligibleRefundPools.length === 1 && onClaimRefund ? (
              <button
                onClick={() => onClaimRefund(eligibleRefundPools[0].id)}
                disabled={Boolean(actionLoading)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-600/20 transition disabled:opacity-50"
              >
                {actionLoading ? 'Claiming...' : 'Claim 100% Refund'}
              </button>
            ) : null}
            <button
              onClick={() => onSelectPool(eligibleRefundPools[0].id)}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-600/20 transition self-start sm:self-auto flex-shrink-0"
            >
              Review & Claim
            </button>
          </div>
        </div>
      )}

      {/* Backed Pools List Breakdown */}
      {backedPools.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0e111a] border border-[#1e2333] shadow-xl">
          <h4 className="text-sm font-bold text-white mb-3">Your Supported Pools Breakdown</h4>
          <div className="space-y-2">
            {backedPools.map(({ pool, status, userDeposit }) => {
              const poolToken = getTokenConfig(pool.token);
              return (
                <div
                  key={pool.id}
                  onClick={() => onSelectPool(pool.id)}
                  className="p-3 rounded-xl bg-[#121622] hover:bg-[#161b2a] border border-[#1e2333] hover:border-indigo-500/30 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                      #{pool.id}
                    </span>
                    <span className="font-medium text-white">{pool.title || `Pool #${pool.id}`}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {status === 'active' && (
                      <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Active: {formatTokenAmount(userDeposit, poolToken.decimals)} {poolToken.symbol}
                      </span>
                    )}
                    {status === 'claimable' && (
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                          <ShieldAlert className="w-3 h-3" />
                          Claimable: {formatTokenAmount(userDeposit, poolToken.decimals)} {poolToken.symbol}
                        </span>
                        {onClaimRefund && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClaimRefund(pool.id);
                            }}
                            disabled={Boolean(actionLoading)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm transition disabled:opacity-50"
                          >
                            {actionLoading ? 'Claiming...' : 'Claim Refund'}
                          </button>
                        )}
                      </div>
                    )}
                    {status === 'settled' && (
                      <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Refund Settled (0 {poolToken.symbol} remaining)
                      </span>
                    )}
                    {status === 'paid_out' && (
                      <span className="text-gray-400 bg-gray-800/40 border border-gray-700/40 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Goal Met & Disbursed
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
