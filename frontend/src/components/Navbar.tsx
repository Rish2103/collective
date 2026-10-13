import React, { useState } from 'react';
import { Wallet, Droplets, AlertTriangle, Menu, X, PlusCircle, ShieldCheck, Volume2, VolumeX, Zap } from 'lucide-react';
import { MONAD_TESTNET, CONTRACT_ADDRESSES } from '../contracts/config';
import { formatTokenAmount, shortenAddress } from '../utils/formatters';
import { useBlockTicker } from '../hooks/useBlockTicker';
import { isAudioEnabled, setAudioEnabled, playToggleSound } from '../utils/audioFeedback';

interface NavbarProps {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  tokenBalance: bigint;
  tokenSymbol: string;
  balances?: Record<string, bigint>;
  isConnecting: boolean;
  onConnect: () => void;
  onSwitchNetwork: () => void;
  onOpenFaucet: () => void;
  onOpenCreatePool: () => void;
  onOpenTrustModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  isConnected,
  isCorrectNetwork,
  tokenBalance,
  tokenSymbol,
  balances,
  isConnecting,
  onConnect,
  onSwitchNetwork,
  onOpenFaucet,
  onOpenCreatePool,
  onOpenTrustModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { blockNumber } = useBlockTicker();
  const [soundEnabled, setSoundEnabled] = useState(() => isAudioEnabled());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioEnabled(next);
    playToggleSound(next);
  };

  const musdBalance = balances?.[CONTRACT_ADDRESSES.mockToken.toLowerCase()] ?? tokenBalance;
  const usdcBalance = balances?.[CONTRACT_ADDRESSES.usdc.toLowerCase()] ?? 0n;

  const shortAddress = shortenAddress(account);

  return (
    <header className="sticky top-3 sm:top-5 z-40 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
      <div className="relative group/nav rounded-2xl sm:rounded-3xl border border-[#20273a]/90 hover:border-indigo-500/50 bg-[#0c0f18]/90 hover:bg-[#0f1322]/95 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_24px_65px_-10px_rgba(99,102,241,0.22)] px-5 sm:px-7 min-h-[82px] sm:h-[88px] flex items-center justify-between transition-all duration-300 ease-out hover:-translate-y-1">
        {/* Ambient Top Glow Line on Hover */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent group-hover/nav:via-indigo-400/60 transition-all duration-500 pointer-events-none rounded-t-3xl" />
        {/* Soft Background Hover Aura */}
        <div className="absolute -inset-0.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover/nav:from-indigo-500/10 group-hover/nav:via-purple-500/15 group-hover/nav:to-indigo-500/10 -z-10 blur-xl opacity-0 group-hover/nav:opacity-100 transition-all duration-500 pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/15 transition-all duration-300 group-hover/nav:scale-105 group-hover/nav:shadow-indigo-500/50">
            <span className="font-black text-white text-2xl tracking-tighter">C</span>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover/nav:text-indigo-100 transition-colors">
                COLLECTIVE
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 tracking-wider">
                2.0
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium hidden lg:block mt-0.5 tracking-wide">
              Consumer Group Payments & Guaranteed Escrow
            </p>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-3 xl:space-x-3.5">
          {/* Monad Live Performance Pill */}
          <div className="hidden xl:flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#121622]/90 hover:bg-[#161c2c] border border-[#20273a] hover:border-purple-500/40 text-xs transition-all duration-200 hover:scale-[1.02] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-300 font-semibold font-mono text-xs">Monad ~400ms</span>
            {blockNumber && (
              <a
                href={`https://testnet.monadexplorer.com/block/${blockNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-indigo-300 transition font-mono text-xs border-l border-[#20273a] pl-2"
                title="Current Monad Testnet block height"
              >
                #{blockNumber.toLocaleString()}
              </a>
            )}
          </div>

          {/* Safety & Protocol Rules Button */}
          <button
            onClick={onOpenTrustModal}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#121622]/90 hover:bg-[#181f33] text-gray-200 hover:text-white border border-[#20273a] hover:border-indigo-500/40 transition-all duration-200 hover:scale-[1.02] shadow-sm"
            title="Inspect verified contracts & protocol rules"
          >
            <div className="w-5 h-5 rounded-lg bg-indigo-950/80 flex items-center justify-center text-indigo-400 border border-indigo-800/40">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>Trust & Rules</span>
          </button>

          {/* Audio Feedback Toggle */}
          <button
            onClick={toggleSound}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold border transition-all duration-200 hover:scale-105 shadow-sm ${
              soundEnabled
                ? 'bg-indigo-950/70 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/80 shadow-indigo-950/40'
                : 'bg-[#121622]/90 text-gray-500 border-[#20273a] hover:text-gray-300 hover:bg-[#181d2e] hover:border-gray-700'
            }`}
            title={soundEnabled ? 'Mute sound effects' : 'Enable subtle sound effects'}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable subtle sound effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Network indicator */}
          {isConnected && (
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs bg-[#121622]/90 border border-[#20273a] shadow-sm">
              {isCorrectNetwork ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-gray-300 font-medium">{MONAD_TESTNET.name}</span>
                </>
              ) : (
                <button
                  onClick={onSwitchNetwork}
                  className="flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>Switch to Monad</span>
                </button>
              )}
            </div>
          )}

          {/* Token Balances & Faucet button */}
          {isConnected && (
            <button
              onClick={onOpenFaucet}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/40 hover:border-indigo-600/60 transition-all duration-200 hover:scale-[1.02] shadow-sm"
              title="Claim test tokens (mUSD or Circle USDC)"
            >
              <div className="w-5 h-5 rounded-lg bg-indigo-900/60 flex items-center justify-center text-indigo-400">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono font-bold text-white">
                {formatTokenAmount(musdBalance, 18)} mUSD
              </span>
              <span className="text-gray-500">·</span>
              <span className="font-mono font-bold text-emerald-300">
                {formatTokenAmount(usdcBalance, 6)} USDC
              </span>
            </button>
          )}

          {/* Create Pool CTA - Stripe-style primary button */}
          <button
            onClick={onOpenCreatePool}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/35 hover:shadow-indigo-500/50 transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.03] flex items-center space-x-2 ring-1 ring-white/15"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Pool</span>
          </button>

          {/* Connect / Account - Stripe-style secondary button */}
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#151927] hover:bg-[#1d2337] text-white border border-[#273046] hover:border-indigo-500/40 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.02]"
            >
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#121622] border border-[#20273a] hover:border-indigo-500/30 text-gray-200 shadow-sm transition-all duration-200">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono font-semibold">{shortAddress}</span>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center space-x-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-[#121622] border border-[#20273a] text-gray-400 hover:text-white transition hover:scale-105"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-2xl border border-[#20273a] bg-[#0c0f17]/95 backdrop-blur-xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1a2030]">
            <span className="text-xs text-gray-400">Network:</span>
            <span className="text-xs font-semibold text-emerald-400">{MONAD_TESTNET.name}</span>
          </div>

          {isConnected && (
            <div className="p-3 rounded-xl bg-[#121622] border border-[#20273a] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Test mUSD:</span>
                <span className="font-mono font-bold text-white">{formatTokenAmount(musdBalance, 18)} mUSD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Circle USDC:</span>
                <span className="font-mono font-bold text-emerald-400">{formatTokenAmount(usdcBalance, 6)} USDC</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrustModal();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#121622] border border-[#20273a] text-gray-300 text-center flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Safety & Rules</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreatePool();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center"
            >
              + Create Pool
            </button>

            {isConnected && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenFaucet();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-center"
              >
                Claim Test Tokens
              </button>
            )}

            {!isConnected ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onConnect();
                }}
                disabled={isConnecting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#161a26] border border-[#273046] text-white text-center"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="py-2 text-center font-mono text-xs text-gray-400">
                Connected: {shortAddress}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
