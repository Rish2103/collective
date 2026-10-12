import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Copy, Check, Activity, ShieldCheck, ArrowRight, History, Layers, CheckCircle2, Clock } from 'lucide-react';
import { TimelineEvent } from '../hooks/useActivityTimeline';
import { PoolData, PoolState } from '../types';
import { formatTokenAmount, shortenAddress, shortenTxHash, formatBlockTime } from '../utils/formatters';
import { getExplorerAddressUrl, getExplorerTxUrl } from '../contracts/config';

interface ActivityTimelineProps {
  events: TimelineEvent[];
  isLoading: boolean;
  lastSynced: Date | null;
  rpcNotice: string | null;
  blockScope?: { from: number; to: number } | null;
  onRefresh: () => void;
  onLoadOlder?: () => void;
  onSelectPool?: (poolId: number) => void;
  pools?: PoolData[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  isLoading,
  lastSynced,
  rpcNotice,
  blockScope,
  onRefresh,
  onLoadOlder,
  onSelectPool,
  pools = [],
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<'events' | 'milestones'>('events');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getEventBadge = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'PoolCreated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Pool Created
          </span>
        );
      case 'ContributionMade':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Contribution
          </span>
        );
      case 'PayoutClaimed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Payout Disbursed
          </span>
        );
      case 'RefundClaimed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Refund Claimed
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0e111a] border border-[#1e2333] rounded-2xl p-5 md:p-6 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1e2333]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">On-Chain Activity Timeline</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Verified Monad Logs
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Decoded settlement events emitted directly by the CollectivePool smart contract
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {lastSynced && (
            <span className="text-xs text-gray-500">
              Synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {onLoadOlder && (
            <button
              onClick={onLoadOlder}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#161a26] hover:bg-[#202538] text-gray-300 hover:text-white rounded-lg border border-[#23283c] transition disabled:opacity-50"
              title="Query preceding blocks backwards"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Scan Older Blocks</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#161a26] hover:bg-[#202538] text-gray-300 hover:text-white rounded-lg border border-[#23283c] transition disabled:opacity-50"
            title="Query latest blocks from Monad Testnet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            {isLoading ? 'Scanning...' : 'Sync Logs'}
          </button>
        </div>
      </div>

      {/* Sub-view Switcher: Live Logs vs Verified Milestones */}
      <div className="flex items-center space-x-2 mt-4">
        <button
          onClick={() => setActiveSubView('events')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubView === 'events'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-[#121622] text-gray-400 hover:text-white border border-[#1e2333]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Monad Logs ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('milestones')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeSubView === 'milestones'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-[#121622] text-gray-400 hover:text-white border border-[#1e2333]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Verified Pool Status ({pools.length})</span>
        </button>
      </div>

      {activeSubView === 'events' ? (
        <>
          {/* Scope Transparency Notice */}
      <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            {rpcNotice ||
              (blockScope
                ? `Scanned blocks #${blockScope.from.toLocaleString()} to #${blockScope.to.toLocaleString()} on Monad Testnet`
                : 'Scanning bounded block window on Monad Testnet')}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono bg-[#111520] px-2 py-0.5 rounded border border-[#1f2538] self-start sm:self-auto">
          Bounded 100-blk chunks (RPC safe)
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500 px-1">
        Bounded query window: Monad Testnet limits <code className="text-gray-400 font-mono">eth_getLogs</code> to 100 blocks per request. This feed reflects events from the scanned range and confirmed session transactions; it does not claim complete all-time ledger history.
      </p>

      {/* Timeline Event Feed */}
      <div className="mt-5 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-[#1e2333] rounded-xl bg-[#090b10]">
            <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-300">No events in current scanned window</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              Events appear as transactions execute on Monad Testnet. On-chain actions (pool creation, contributions, payouts, refunds) executed during this session or within the block window are decoded here.
            </p>
            {onLoadOlder && (
              <button
                onClick={onLoadOlder}
                disabled={isLoading}
                className="mt-4 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg border border-indigo-500/30 transition inline-flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                <span>Scan Prior Blocks</span>
              </button>
            )}
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="group relative p-4 rounded-xl bg-[#121622] hover:bg-[#161b2a] border border-[#1e2333] hover:border-indigo-500/30 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">{getEventBadge(event.type)}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.type === 'PoolCreated' && (
                      <span className="text-sm font-semibold text-white">
                        "{event.title || `Pool #${event.poolId}`}" was registered
                      </span>
                    )}
                    {event.type === 'ContributionMade' && (
                      <span className="text-sm font-semibold text-white">
                        <strong className="text-emerald-400 font-mono">+{formatTokenAmount(event.amount)} mUSD</strong> deposited into Pool #{event.poolId}
                      </span>
                    )}
                    {event.type === 'PayoutClaimed' && (
                      <span className="text-sm font-semibold text-white">
                        <strong className="text-amber-400 font-mono">{formatTokenAmount(event.amount)} mUSD</strong> claimed by recipient
                      </span>
                    )}
                    {event.type === 'RefundClaimed' && (
                      <span className="text-sm font-semibold text-white">
                        <strong className="text-cyan-400 font-mono">{formatTokenAmount(event.amount)} mUSD</strong> refund returned to contributor
                      </span>
                    )}

                    {onSelectPool && (
                      <button
                        onClick={() => onSelectPool(event.poolId)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 underline underline-offset-2 ml-1"
                      >
                        View Pool #{event.poolId}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Metadata Row: Address & Block */}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                    <span>
                      Caller:{' '}
                      <button
                        onClick={() => copyToClipboard(event.account, `addr_${event.id}`)}
                        className="text-gray-300 hover:text-white font-mono inline-flex items-center gap-1 hover:underline"
                        title="Copy address"
                      >
                        {shortenAddress(event.account)}
                        {copiedId === `addr_${event.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition" />
                        )}
                      </button>
                    </span>

                    <span className="text-gray-600">•</span>
                    <span>Block #{event.blockNumber}</span>

                    {event.timestamp > 0 && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span>{formatBlockTime(event.timestamp)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tx Hash & Explorer Link */}
              <div className="flex items-center gap-2 self-start md:self-auto text-xs">
                <a
                  href={getExplorerTxUrl(event.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2030] hover:bg-indigo-900/30 text-gray-300 hover:text-indigo-300 border border-[#273046] transition font-mono"
                  title="View transaction receipt on Monad Explorer"
                >
                  <span>Tx: {shortenTxHash(event.txHash)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  ) : (
    <div className="mt-4 space-y-4">
      <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>Verified On-Chain Pool Status (Live Contract Storage Reads)</span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono bg-[#111520] px-2 py-0.5 rounded border border-[#1f2538]">
          {pools.length} Monad Pools Loaded
        </span>
      </div>

      <p className="text-[11px] text-gray-500 px-1">
        Verified status snapshot derived directly from immutable smart contract storage on Monad Testnet.
      </p>

      <div className="space-y-3">
        {pools.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[#1e2333] rounded-xl bg-[#090b10] text-gray-500 text-xs">
            No pools registered on-chain yet.
          </div>
        ) : (
          pools.map((p) => {
            const targetWei = p.targetAmount;
            const contributedWei = p.totalContributed;
            const isTargetMet = contributedWei >= targetWei && targetWei > 0n;
            const percent = targetWei > 0n ? Number((contributedWei * 100n) / targetWei) : 0;
            const isPaidOut = p.state === PoolState.PaidOut;
            const isExpired = Date.now() / 1000 >= Number(p.deadline);
            const isRefundState = isExpired && !isTargetMet && !isPaidOut;
            const isSettled = isRefundState && p.remainingHeld === 0n && p.totalContributed > 0n;

            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-[#121622] hover:bg-[#161b2a] border border-[#1e2333] hover:border-indigo-500/30 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                      Pool #{p.id}
                    </span>
                    <h4 className="text-sm font-bold text-white">{p.title}</h4>
                    {isPaidOut ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Paid Out to Recipient</span>
                      </span>
                    ) : isTargetMet ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-600/40">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Goal Met ({percent}%)</span>
                      </span>
                    ) : isSettled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-600/40">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Refunds Settled (100% Claimed)</span>
                      </span>
                    ) : isRefundState ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/40">
                        <Clock className="w-3 h-3" />
                        <span>Expired Below Target (Refunds Open)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                        <Clock className="w-3 h-3" />
                        <span>Active Funding</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                    <span>Raised: <strong className="text-white">{formatTokenAmount(p.totalContributed)}</strong> / {formatTokenAmount(p.targetAmount)} mUSD</span>
                    <span>•</span>
                    <span>Backers: <strong className="text-white">{p.contributors.length}</strong></span>
                    <span>•</span>
                    <span>Held in Escrow: <strong className="text-white">{formatTokenAmount(p.remainingHeld)} mUSD</strong></span>
                  </div>
                </div>

                {onSelectPool && (
                  <button
                    onClick={() => onSelectPool(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1.5 self-start md:self-auto"
                  >
                    <span>Inspect Pool #{p.id}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  )}
</div>
);
};
