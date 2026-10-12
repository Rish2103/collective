import { useState, useMemo, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Navbar } from './components/Navbar';
import { PoolCard } from './components/PoolCard';
import { FaucetModal } from './components/FaucetModal';
import { CreatePoolModal } from './components/CreatePoolModal';
import { PoolDetailsModal } from './components/PoolDetailsModal';
import { TrustModal } from './components/TrustModal';
import { ActivityTimeline } from './components/ActivityTimeline';
import { PersonalDashboard } from './components/PersonalDashboard';
import { HowItWorks } from './components/HowItWorks';
import { ShareModal } from './components/ShareModal';
import { TransactionFeedback, TransactionStatus } from './components/TransactionFeedback';
import { useWallet } from './hooks/useWallet';
import { useCollective } from './hooks/useCollective';
import { useActivityTimeline, TimelineEvent } from './hooks/useActivityTimeline';
import { PoolData, PoolState } from './types';
import {
  PlusCircle,
  Zap,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowUpDown,
  Droplets,
  ExternalLink,
  Layers,
  Activity,
  User,
  ShieldCheck,
  X,
} from 'lucide-react';
import { MONAD_TESTNET, CONTRACT_ADDRESSES, getExplorerAddressUrl } from './contracts/config';
import { formatTokenAmount } from './utils/formatters';
import { playClickSound } from './utils/audioFeedback';

export function App() {
  const wallet = useWallet();
  const collective = useCollective(wallet.account);
  const timeline = useActivityTimeline();

  // Modals & Navigation States
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTrustOpen, setIsTrustOpen] = useState(false);
  const [sharingPool, setSharingPool] = useState<PoolData | null>(null);

  // View mode: 'pools' (default grid), 'activity' (timeline), 'portfolio' (my backed pools)
  const [viewMode, setViewMode] = useState<'pools' | 'activity' | 'portfolio'>('pools');

  // Direct pool routing & selection
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [initialUrlPoolId, setInitialUrlPoolId] = useState<number | null>(null);
  const [notFoundNotice, setNotFoundNotice] = useState<string | null>(null);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'success' | 'expired' | 'my-pools' | 'my-deposits'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'endingSoon' | 'mostFunded'>('newest');

  // Global Transaction Status for floating toast feedback
  const [txFeedback, setTxFeedback] = useState<TransactionStatus>({ state: 'idle' });

  // 1. Read initial URL query param (?pool=<id>) on boot
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const poolParam = params.get('pool');
      if (poolParam !== null) {
        const id = parseInt(poolParam, 10);
        if (!isNaN(id) && id >= 0) {
          setInitialUrlPoolId(id);
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, []);

  // 2. Validate URL pool once collective.pools has finished loading
  useEffect(() => {
    if (initialUrlPoolId !== null && !collective.isLoading && collective.pools.length > 0) {
      const match = collective.pools.find((p) => p.id === initialUrlPoolId);
      if (match) {
        setSelectedPoolId(initialUrlPoolId);
      } else {
        setNotFoundNotice(`Pool #${initialUrlPoolId} was not found on Monad Testnet.`);
        // Clean URL without refresh
        window.history.replaceState({}, '', window.location.pathname);
      }
      setInitialUrlPoolId(null); // handled
    }
  }, [initialUrlPoolId, collective.isLoading, collective.pools]);

  // 3. Synchronize selectedPoolId with URL query param (?pool=<id>)
  useEffect(() => {
    if (selectedPoolId !== null) {
      window.history.replaceState({}, '', `${window.location.pathname}?pool=${selectedPoolId}`);
    } else if (initialUrlPoolId === null) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [selectedPoolId, initialUrlPoolId]);

  // Derive reactive selected pool
  const selectedPool = useMemo(() => {
    if (selectedPoolId === null) return null;
    return collective.pools.find((p) => p.id === selectedPoolId) || null;
  }, [selectedPoolId, collective.pools]);

  // Filter and sort pools
  const now = Math.floor(Date.now() / 1000);
  const userLower = wallet.account ? wallet.account.toLowerCase() : '';

  const filteredPools = useMemo(() => {
    return collective.pools
      .filter((p) => {
        const isPaid = p.state === PoolState.PaidOut;
        const isTargetMet = p.totalContributed >= p.targetAmount && p.targetAmount > 0n;
        const isExpired = p.deadline <= now;

        const isCreator = userLower && p.creator.toLowerCase() === userLower;
        const isContributor = userLower && p.userContribution && p.userContribution > 0n;

        // View mode: portfolio forces user-only pools
        if (viewMode === 'portfolio') {
          if (!isCreator && !isContributor) return false;
        }

        // Tab filter
        if (activeTab === 'active') {
          if (isExpired || isPaid) return false;
        } else if (activeTab === 'success') {
          if (!isPaid && !isTargetMet) return false;
        } else if (activeTab === 'expired') {
          if (!isExpired || isTargetMet || isPaid) return false;
        } else if (activeTab === 'my-pools') {
          if (!isCreator) return false;
        } else if (activeTab === 'my-deposits') {
          if (!isContributor) return false;
        }

        // Search query filter (title, description, recipient, or creator)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchRecipient = p.recipient.toLowerCase().includes(q);
          const matchCreator = p.creator.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          if (!matchTitle && !matchRecipient && !matchCreator && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return b.id - a.id;
        }
        if (sortBy === 'endingSoon') {
          return a.deadline - b.deadline;
        }
        if (sortBy === 'mostFunded') {
          const aFunded = a.totalContributed;
          const bFunded = b.totalContributed;
          return bFunded > aFunded ? 1 : bFunded < aFunded ? -1 : 0;
        }
        return 0;
      });
  }, [collective.pools, activeTab, viewMode, searchQuery, sortBy, now, userLower]);

  // Aggregate platform statistics computed 100% from on-chain pools
  const stats = useMemo(() => {
    const totalCount = collective.pools.length;
    let totalContributedWei = 0n;
    let currentHeldWei = 0n;
    let totalDisbursedWei = 0n;
    let activeCount = 0;
    let successfulCount = 0;
    let expiredRefundCount = 0;

    for (const p of collective.pools) {
      totalContributedWei += p.totalContributed;
      if (p.remainingHeld !== undefined) {
        currentHeldWei += p.remainingHeld;
      } else if (p.state === PoolState.Active) {
        currentHeldWei += p.totalContributed;
      }

      if (p.state === PoolState.PaidOut) {
        totalDisbursedWei += p.totalContributed;
      }

      const isTargetMet = p.totalContributed >= p.targetAmount && p.targetAmount > 0n;
      const isExpired = p.deadline <= now;
      if (!isExpired && p.state === PoolState.Active) {
        activeCount++;
      }
      if (p.state === PoolState.PaidOut || isTargetMet) {
        successfulCount++;
      }
      if (isExpired && !isTargetMet && p.state !== PoolState.PaidOut) {
        expiredRefundCount++;
      }
    }

    return {
      totalCount,
      totalPooledEth: formatTokenAmount(totalContributedWei),
      currentHeldEth: formatTokenAmount(currentHeldWei),
      totalDisbursedEth: formatTokenAmount(totalDisbursedWei),
      activeCount,
      successfulCount,
      expiredRefundCount,
    };
  }, [collective.pools, now]);

  // Handlers with Transaction Feedback & Timeline Event Recording
  const handleMint = async (amount: string) => {
    setTxFeedback({
      state: 'awaiting_wallet',
      title: 'Awaiting Signature',
      message: `Please confirm minting ${amount} ${wallet.tokenSymbol} in your wallet...`,
    });

    const ok = await collective.mintTestTokens(amount);
    if (ok) {
      wallet.refreshBalance();
      setTxFeedback({
        state: 'confirmed',
        title: 'Mint Succeeded!',
        message: `Successfully received ${amount} ${wallet.tokenSymbol} into your wallet.`,
        txHash: collective.lastTxHash,
      });
    } else {
      setTxFeedback({
        state: 'error',
        title: 'Minting Failed',
        message: collective.error || 'The faucet transaction was cancelled or reverted.',
      });
    }
    return ok;
  };

  const handleContribute = async (poolId: number, amount: string) => {
    setTxFeedback({
      state: 'awaiting_wallet',
      title: 'Backing Pool',
      message: `Approving and depositing ${amount} ${wallet.tokenSymbol}...`,
    });

    const ok = await collective.contributeToPool(poolId, amount);
    if (ok) {
      wallet.refreshBalance();
      setTxFeedback({
        state: 'confirmed',
        title: 'Contribution Confirmed!',
        message: `Deposited ${amount} ${wallet.tokenSymbol} into Pool #${poolId}.`,
        txHash: collective.lastTxHash,
      });

      if (collective.lastTxHash && wallet.account) {
        timeline.recordEvent({
          id: `${collective.lastTxHash}_contrib`,
          type: 'ContributionMade',
          poolId,
          account: wallet.account,
          amount: ethers.parseEther(amount),
          txHash: collective.lastTxHash,
          blockNumber: 0,
          timestamp: Math.floor(Date.now() / 1000),
        });
      }
    } else {
      setTxFeedback({
        state: 'error',
        title: 'Contribution Failed',
        message: collective.error || 'Transaction was rejected or reverted by the network.',
      });
    }
    return ok;
  };

  const handleClaimPayout = async (poolId: number) => {
    setTxFeedback({
      state: 'awaiting_wallet',
      title: 'Disbursing Funds',
      message: 'Releasing pool funds to designated recipient...',
    });

    const ok = await collective.claimPayout(poolId);
    if (ok) {
      wallet.refreshBalance();
      setTxFeedback({
        state: 'confirmed',
        title: 'Payout Released!',
        message: `Funds from Pool #${poolId} have been disbursed to the recipient.`,
        txHash: collective.lastTxHash,
      });

      const p = collective.pools.find((x) => x.id === poolId);
      if (collective.lastTxHash && p) {
        timeline.recordEvent({
          id: `${collective.lastTxHash}_payout`,
          type: 'PayoutClaimed',
          poolId,
          account: p.recipient,
          amount: p.totalContributed,
          txHash: collective.lastTxHash,
          blockNumber: 0,
          timestamp: Math.floor(Date.now() / 1000),
        });
      }
    } else {
      setTxFeedback({
        state: 'error',
        title: 'Payout Failed',
        message: collective.error || 'Failed to claim payout.',
      });
    }
    return ok;
  };

  const handleClaimRefund = async (poolId: number) => {
    setTxFeedback({
      state: 'awaiting_wallet',
      title: 'Processing Refund',
      message: 'Claiming 100% refund from expired pool...',
    });

    const ok = await collective.claimRefund(poolId);
    if (ok) {
      wallet.refreshBalance();
      setTxFeedback({
        state: 'confirmed',
        title: 'Refund Claimed!',
        message: `100% of your deposit has been returned to your wallet.`,
        txHash: collective.lastTxHash,
      });

      const p = collective.pools.find((x) => x.id === poolId);
      if (collective.lastTxHash && wallet.account && p) {
        timeline.recordEvent({
          id: `${collective.lastTxHash}_refund`,
          type: 'RefundClaimed',
          poolId,
          account: wallet.account,
          amount: p.userContribution || 0n,
          txHash: collective.lastTxHash,
          blockNumber: 0,
          timestamp: Math.floor(Date.now() / 1000),
        });
      }
    } else {
      setTxFeedback({
        state: 'error',
        title: 'Refund Failed',
        message: collective.error || 'Failed to claim refund.',
      });
    }
    return ok;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-gray-100 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden w-full">
      <Navbar
        account={wallet.account}
        chainId={wallet.chainId}
        isConnected={wallet.isConnected}
        isCorrectNetwork={wallet.isCorrectNetwork}
        tokenBalance={wallet.tokenBalance}
        tokenSymbol={wallet.tokenSymbol}
        isConnecting={wallet.isConnecting}
        onConnect={wallet.connectWallet}
        onSwitchNetwork={wallet.switchToMonad}
        onOpenFaucet={() => setIsFaucetOpen(true)}
        onOpenCreatePool={() => setIsCreateOpen(true)}
        onOpenTrustModal={() => setIsTrustOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-x-hidden">
        {/* Invalid Pool ID URL Notice */}
        {notFoundNotice && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-between text-amber-200 text-xs sm:text-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{notFoundNotice}</span>
            </div>
            <button
              onClick={() => setNotFoundNotice(null)}
              className="p-1 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error Banners */}
        {wallet.error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-between text-rose-300 text-xs sm:text-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{wallet.error}</span>
            </div>
            <button
              onClick={wallet.clearError}
              className="text-xs font-semibold underline hover:text-white shrink-0 ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {collective.error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-between text-rose-300 text-xs sm:text-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{collective.error}</span>
            </div>
            <button
              onClick={collective.clearError}
              className="text-xs font-semibold underline hover:text-white shrink-0 ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/20 via-purple-950/10 to-transparent border border-[#1e2333] p-8 sm:p-12 text-center shadow-2xl">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Metropolis Consumer Products & Payments • Monad Testnet</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Group Payments with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">Guaranteed Pull Refunds</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Create a group funding pool for team dinners, group travel, community gifts, or shared projects. If the target is met before the deadline, funds unlock for the recipient. If underfunded, contributors pull back 100% of their deposits trustlessly.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  playClickSound();
                  setIsCreateOpen(true);
                }}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create a Pool</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setIsFaucetOpen(true);
                }}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-[#121622] hover:bg-[#1a2030] text-indigo-200 border border-indigo-800/40 flex items-center space-x-2 transition-all"
              >
                <Droplets className="w-4 h-4 text-indigo-400" />
                <span>Claim Free Test {wallet.tokenSymbol}</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setIsTrustOpen(true);
                }}
                className="px-5 py-3.5 rounded-2xl font-semibold text-sm bg-[#121622] hover:bg-[#1a2030] text-gray-300 hover:text-white border border-[#20273a] flex items-center space-x-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Protocol Rules</span>
              </button>
            </div>
          </div>

          {/* Key Metric Stats Cards - 100% Derived from On-Chain State */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-8 border-t border-[#1e2333] max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-[#0e111a]/80 border border-[#1e2333] text-left">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-medium">Pools Created</span>
              <span className="font-mono text-2xl font-black text-white">{stats.totalCount}</span>
              <span className="text-[10px] text-indigo-400 block mt-0.5">On Monad Testnet</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e111a]/80 border border-[#1e2333] text-left">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-medium">Cumulative Volume</span>
              <span className="font-mono text-2xl font-black text-indigo-300">{stats.totalPooledEth}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">All-time historical {wallet.tokenSymbol}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e111a]/80 border border-[#1e2333] text-left">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-medium">Current Escrow</span>
              <span className="font-mono text-2xl font-black text-white">{stats.currentHeldEth}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">{wallet.tokenSymbol} active & pending</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0e111a]/80 border border-[#1e2333] text-left">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-medium">Disbursed Payouts</span>
              <span className="font-mono text-2xl font-black text-emerald-400">{stats.totalDisbursedEth}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">{wallet.tokenSymbol} released to recipients</span>
            </div>
          </div>

          {/* How COLLECTIVE Works: 3-Step Lifecycle Explainer */}
          <HowItWorks tokenSymbol={wallet.tokenSymbol} />
        </section>

        {/* View Switcher: Browse Pools vs On-Chain Activity vs Personal Portfolio */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e2333]">
            {/* View Mode Pills */}
            <div className="flex items-center space-x-1 p-1 bg-[#0e111a] rounded-2xl border border-[#1e2333]">
              <button
                onClick={() => {
                  playClickSound();
                  setViewMode('pools');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  viewMode === 'pools'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Browse Pools ({collective.pools.length})</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setViewMode('activity');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  viewMode === 'activity'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>On-Chain Activity</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setViewMode('portfolio');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  viewMode === 'portfolio'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Activity</span>
              </button>
            </div>

            {/* Quick Sync */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  collective.loadPools();
                  timeline.refreshEvents();
                }}
                disabled={collective.isLoading}
                title="Refresh smart contract state from Monad RPC"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#121622] hover:bg-[#1a2030] text-gray-300 border border-[#20273a] transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${collective.isLoading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Sync On-Chain</span>
              </button>
            </div>
          </div>

          {/* VIEW A: ON-CHAIN ACTIVITY TIMELINE */}
          {viewMode === 'activity' && (
            <ActivityTimeline
              events={timeline.events}
              isLoading={timeline.isLoading}
              lastSynced={timeline.lastSynced}
              rpcNotice={timeline.rpcNotice}
              blockScope={timeline.blockScope}
              onRefresh={timeline.refreshEvents}
              onLoadOlder={timeline.loadOlderEvents}
              onSelectPool={(id) => setSelectedPoolId(id)}
              pools={collective.pools}
            />
          )}

          {/* VIEW B: PERSONAL DASHBOARD */}
          {viewMode === 'portfolio' && (
            <div className="space-y-6">
              <PersonalDashboard
                account={wallet.account}
                pools={collective.pools}
                tokenSymbol={wallet.tokenSymbol}
                onConnectWallet={wallet.connectWallet}
                onOpenCreatePool={() => setIsCreateOpen(true)}
                onSelectPool={(id) => setSelectedPoolId(id)}
              />

              {wallet.account && (
                <div>
                  <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
                    Your Associated Pools ({filteredPools.length})
                  </h4>
                  {filteredPools.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-[#1e2333] rounded-2xl bg-[#0e111a]/40 p-6">
                      <p className="text-xs text-gray-400">
                        You have not created or contributed to any pools yet with this wallet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPools.map((pool) => (
                        <PoolCard
                          key={pool.id}
                          pool={pool}
                          tokenSymbol={wallet.tokenSymbol}
                          account={wallet.account}
                          onSelect={(p) => setSelectedPoolId(p.id)}
                          onClaimPayout={handleClaimPayout}
                          onClaimRefund={handleClaimRefund}
                          actionLoading={collective.actionLoading}
                          onOpenShare={(p) => setSharingPool(p)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW C: MAIN POOLS BROWSER */}
          {viewMode === 'pools' && (
            <div className="space-y-5">
              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Filter Tabs */}
                <div className="flex items-center space-x-1 p-1 bg-[#0e111a] rounded-2xl border border-[#1e2333] overflow-x-auto">
                  {[
                    { key: 'all', label: `All Pools (${collective.pools.length})` },
                    { key: 'active', label: `Active (${stats.activeCount})` },
                    { key: 'success', label: `Goal Met (${stats.successfulCount})` },
                    { key: 'expired', label: `Refunds Open (${stats.expiredRefundCount})` },
                    ...(wallet.account
                      ? [
                          { key: 'my-pools', label: 'Created by Me' },
                          { key: 'my-deposits', label: 'Backed by Me' },
                        ]
                      : []),
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        playClickSound();
                        setActiveTab(tab.key as any);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        activeTab === tab.key
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Input & Sort Dropdown */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 lg:max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, description, or address..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0e111a] border border-[#1e2333] focus:border-indigo-500 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-[#0e111a] border border-[#1e2333] text-xs text-gray-300">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      aria-label="Sort funding pools"
                      className="bg-transparent text-gray-300 outline-none text-xs cursor-pointer"
                    >
                      <option value="newest" className="bg-[#10131c]">Newest</option>
                      <option value="endingSoon" className="bg-[#10131c]">Ending Soon</option>
                      <option value="mostFunded" className="bg-[#10131c]">Most Funded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pools Grid Section */}
              {collective.isLoading && collective.pools.length === 0 ? (
                <div className="py-24 text-center">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">Reading smart contract state from Monad Testnet...</p>
                </div>
              ) : filteredPools.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-[#1e2333] rounded-3xl bg-[#0e111a]/40 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {searchQuery
                      ? 'No pools match your search query'
                      : activeTab === 'active'
                      ? 'No Active Funding Pools Right Now'
                      : activeTab === 'my-pools'
                      ? 'No Pools Created by Connected Wallet'
                      : activeTab === 'my-deposits'
                      ? 'No Contributions Found for Connected Wallet'
                      : 'No pools found in this view'}
                  </h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto mb-5 leading-relaxed">
                    {searchQuery
                      ? `No funding pools match "${searchQuery}". Clear your search or launch a new pool.`
                      : activeTab === 'active'
                      ? 'All existing pools on Monad Testnet have reached their goals or concluded their deadlines. Start a new pool in seconds to demonstrate live contributions!'
                      : activeTab === 'my-pools'
                      ? 'You have not initiated any pools yet with this wallet address. Click below to launch one in seconds.'
                      : activeTab === 'my-deposits'
                      ? 'This wallet has not deposited into any pool yet. Claim free test tokens from the faucet to back a pool!'
                      : 'Launch a group funding pool for your friends or team on Monad Testnet today!'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1a2030] hover:bg-[#252c42] text-gray-300 border border-[#273046] transition"
                      >
                        Clear Search
                      </button>
                    )}
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
                    >
                      + Create New Pool
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPools.map((pool) => (
                    <PoolCard
                      key={pool.id}
                      pool={pool}
                      tokenSymbol={wallet.tokenSymbol}
                      account={wallet.account}
                      onSelect={(p) => setSelectedPoolId(p.id)}
                      onClaimPayout={handleClaimPayout}
                      onClaimRefund={handleClaimRefund}
                      actionLoading={collective.actionLoading}
                      onOpenShare={(p) => setSharingPool(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e2333] bg-[#07080b] py-10 text-xs text-gray-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-sm">COLLECTIVE</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-800/40 text-indigo-300">
                  Monad Testnet 10143
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Consumer Group Payments with Guaranteed Pull Refunds • Metropolis Hackathon Track
              </p>
            </div>

            <div className="flex items-center space-x-4 text-[11px]">
              <button
                onClick={() => setIsTrustOpen(true)}
                className="text-gray-300 hover:text-white inline-flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Protocol Verification</span>
              </button>
              <a
                href={getExplorerAddressUrl(CONTRACT_ADDRESSES.collectivePool)}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1"
              >
                <span>Pool Contract</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={getExplorerAddressUrl(CONTRACT_ADDRESSES.mockToken)}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1"
              >
                <span>mUSD Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 text-center sm:text-left pt-2 border-t border-[#121622]">
            mUSD and MON are testnet tokens with zero fiat value, intended strictly for developer demonstration on Monad Testnet.
          </p>
        </div>
      </footer>

      {/* Floating Real-Time Transaction Feedback */}
      <TransactionFeedback
        status={txFeedback}
        onDismiss={() => setTxFeedback({ state: 'idle' })}
      />

      {/* Modals */}
      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        onMint={handleMint}
        isLoading={collective.actionLoading === 'minting'}
        actionStep={collective.actionStep}
        lastTxHash={collective.lastTxHash}
        tokenSymbol={wallet.tokenSymbol}
        account={wallet.account}
        tokenBalance={wallet.tokenBalance}
      />

      <CreatePoolModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={collective.createPool}
        isLoading={collective.actionLoading === 'creating'}
        actionStep={collective.actionStep}
        account={wallet.account}
        tokenSymbol={wallet.tokenSymbol}
      />

      <TrustModal
        isOpen={isTrustOpen}
        onClose={() => setIsTrustOpen(false)}
      />

      <PoolDetailsModal
        pool={selectedPool}
        isOpen={selectedPoolId !== null}
        onClose={() => {
          setSelectedPoolId(null);
          collective.clearError();
        }}
        tokenSymbol={wallet.tokenSymbol}
        account={wallet.account}
        onContribute={handleContribute}
        onClaimPayout={handleClaimPayout}
        onClaimRefund={handleClaimRefund}
        actionLoading={collective.actionLoading}
        actionStep={collective.actionStep}
        lastTxHash={collective.lastTxHash}
        error={collective.error}
        onClearError={collective.clearError}
        onOpenFaucet={() => {
          setSelectedPoolId(null);
          setIsFaucetOpen(true);
        }}
        tokenBalance={wallet.tokenBalance}
        onOpenShare={(p) => setSharingPool(p)}
      />

      {/* Enhanced Share & QR Drawer Modal */}
      <ShareModal
        isOpen={sharingPool !== null}
        onClose={() => setSharingPool(null)}
        pool={sharingPool}
        tokenSymbol={wallet.tokenSymbol}
      />
    </div>
  );
}

export default App;
