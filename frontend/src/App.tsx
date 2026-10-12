import { useState } from 'react';
import { ethers } from 'ethers';
import { Navbar } from './components/Navbar';
import { PoolCard } from './components/PoolCard';
import { FaucetModal } from './components/FaucetModal';
import { CreatePoolModal } from './components/CreatePoolModal';
import { PoolDetailsModal } from './components/PoolDetailsModal';
import { useWallet } from './hooks/useWallet';
import { useCollective } from './hooks/useCollective';
import { PoolData, PoolState } from './types';
import { PlusCircle, ShieldCheck, Zap, AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const wallet = useWallet();
  const collective = useCollective(wallet.account);

  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'success' | 'expired'>('all');

  // Filter logic
  const now = Math.floor(Date.now() / 1000);
  const filteredPools = collective.pools.filter((p) => {
    const isPaid = p.state === PoolState.PaidOut;
    const isTargetMet = parseFloat(ethers.formatEther(p.totalContributed)) >= parseFloat(ethers.formatEther(p.targetAmount));
    const isExpired = p.deadline <= now;

    if (activeTab === 'active') {
      return !isExpired && !isPaid;
    }
    if (activeTab === 'success') {
      return isPaid || isTargetMet;
    }
    if (activeTab === 'expired') {
      return isExpired && !isTargetMet && !isPaid;
    }
    return true;
  });

  // Handle mint wrapper to also update wallet token balance
  const handleMint = async (amount: string) => {
    const ok = await collective.mintTestTokens(amount);
    if (ok) {
      wallet.refreshBalance();
    }
    return ok;
  };

  const handleContribute = async (poolId: number, amount: string) => {
    const ok = await collective.contributeToPool(poolId, amount);
    if (ok) {
      wallet.refreshBalance();
      // Refresh selected pool details
      const updated = collective.pools.find((p) => p.id === poolId);
      if (updated) setSelectedPool(updated);
    }
    return ok;
  };

  const handleClaimPayout = async (poolId: number) => {
    const ok = await collective.claimPayout(poolId);
    if (ok) {
      const updated = collective.pools.find((p) => p.id === poolId);
      if (updated) setSelectedPool(updated);
    }
    return ok;
  };

  const handleClaimRefund = async (poolId: number) => {
    const ok = await collective.claimRefund(poolId);
    if (ok) {
      wallet.refreshBalance();
      const updated = collective.pools.find((p) => p.id === poolId);
      if (updated) setSelectedPool(updated);
    }
    return ok;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c10] text-gray-100">
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
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Banners */}
        {wallet.error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-between text-rose-300 text-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{wallet.error}</span>
            </div>
          </div>
        )}

        {collective.error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-600/40 flex items-center justify-between text-rose-300 text-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{collective.error}</span>
            </div>
            <button
              onClick={collective.clearError}
              className="text-xs font-semibold underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-purple-900/30 via-purple-950/20 to-transparent border border-purple-800/30 p-8 sm:p-12 text-center shadow-2xl">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Metropolis Hackathon MVP • Monad Testnet</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Group Payments with <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">Guaranteed Refunds</span>
            </h1>

            <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Create a funding pool for trips, events, gifts, or team purchases. Contributors pool mock ERC-20 tokens. If the target is met before the deadline, funds release to the fixed recipient. If not, 100% is refunded trustlessly.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create a Pool</span>
              </button>

              <button
                onClick={() => setIsFaucetOpen(true)}
                className="px-6 py-3 rounded-2xl font-bold text-sm bg-gray-900 hover:bg-gray-800 text-purple-300 border border-purple-700/40 flex items-center space-x-2 transition-all"
              >
                <span>Get Free Test {wallet.tokenSymbol}</span>
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-purple-900/30 text-left max-w-4xl mx-auto text-xs">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-gray-950/40 border border-gray-900">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white">Trustless Smart Contract</h4>
                <p className="text-gray-400 mt-0.5">Solidity contracts strictly govern state transitions and funds locking.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-gray-950/40 border border-gray-900">
              <Zap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white">High-Speed Monad Testnet</h4>
                <p className="text-gray-400 mt-0.5">Instant block confirmations and minimal transaction overhead.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-gray-950/40 border border-gray-900">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white">100% Pull Refunds</h4>
                <p className="text-gray-400 mt-0.5">Unfunded pool members reclaim their exact token allocation safely.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar & Controls */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 p-1 bg-gray-950/80 rounded-2xl border border-gray-800/80 w-full sm:w-auto">
            {[
              { key: 'all', label: 'All Pools' },
              { key: 'active', label: 'Active' },
              { key: 'success', label: 'Successful' },
              { key: 'expired', label: 'Expired (Refunds)' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-purple-900/40 text-purple-200 border border-purple-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={collective.loadPools}
            disabled={collective.isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 transition-colors self-end sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${collective.isLoading ? 'animate-spin' : ''}`} />
            <span>Sync On-Chain</span>
          </button>
        </section>

        {/* Pools Grid */}
        <section>
          {collective.isLoading && collective.pools.length === 0 ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading funding pools from Monad...</p>
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-gray-800 rounded-3xl bg-gray-950/30">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-center mx-auto mb-3 text-purple-400">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">No funding pools in this category</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                Be the first to launch a group payment pool for your team or event on Monad Testnet!
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30"
              >
                + Create New Pool
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  tokenSymbol={wallet.tokenSymbol}
                  account={wallet.account}
                  onSelect={(p) => setSelectedPool(p)}
                  onClaimPayout={handleClaimPayout}
                  onClaimRefund={handleClaimRefund}
                  actionLoading={collective.actionLoading}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-[#0b0c10] py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-gray-400">COLLECTIVE — Consumer Group Payments</p>
          <p>Built for the Metropolis Consumer Products & Payments Hackathon on Monad Testnet.</p>
        </div>
      </footer>

      {/* Modals */}
      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        onMint={handleMint}
        isLoading={collective.actionLoading === 'minting'}
        tokenSymbol={wallet.tokenSymbol}
      />

      <CreatePoolModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={collective.createPool}
        isLoading={collective.actionLoading === 'creating'}
        account={wallet.account}
        tokenSymbol={wallet.tokenSymbol}
      />

      <PoolDetailsModal
        pool={selectedPool}
        isOpen={!!selectedPool}
        onClose={() => setSelectedPool(null)}
        tokenSymbol={wallet.tokenSymbol}
        account={wallet.account}
        onContribute={handleContribute}
        onClaimPayout={handleClaimPayout}
        onClaimRefund={handleClaimRefund}
        actionLoading={collective.actionLoading}
        onOpenFaucet={() => {
          setSelectedPool(null);
          setIsFaucetOpen(true);
        }}
        tokenBalance={wallet.tokenBalance}
      />
    </div>
  );
}
export default App;
