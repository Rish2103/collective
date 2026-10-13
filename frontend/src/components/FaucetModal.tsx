import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { X, Droplets, Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink, Wallet, Copy, Check } from 'lucide-react';
import { MONAD_TESTNET, CONTRACT_ADDRESSES } from '../contracts/config';
import { playCopyChime, playSuccessChime } from '../utils/audioFeedback';

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMint: (amount: string) => Promise<boolean>;
  isLoading: boolean;
  actionStep?: string | null;
  lastTxHash?: string | null;
  tokenSymbol?: string;
  account?: string | null;
  tokenBalance?: bigint;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  onMint,
  isLoading,
  actionStep,
  lastTxHash,
  tokenSymbol = 'mUSD',
  account,
  tokenBalance,
}) => {
  const [activeTab, setActiveTab] = useState<'musd' | 'usdc'>('musd');
  const [amount, setAmount] = useState('1000');
  const [success, setSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    const ok = await onMint(amount);
    if (ok) {
      setSuccess(true);
      playSuccessChime();
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  const handleCopyAddress = (addr: string, key: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedToken(key);
    playCopyChime();
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleAddToMetaMask = async (tokenAddress: string, symbol: string, decimals: number) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert("No browser wallet found.");
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol,
            decimals,
          },
        },
      });
    } catch (err: any) {
      console.error('Failed to add token to MetaMask:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faucet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md p-6 sm:p-7 bg-[#10131c] border border-indigo-900/40 rounded-3xl shadow-2xl shadow-indigo-950/60 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 id="faucet-modal-title" className="text-xl font-bold text-white tracking-tight">Claim Test Tokens</h3>
            <p className="text-xs text-indigo-300/80">Free test currency for trying out COLLECTIVE</p>
          </div>
        </div>

        {/* Tab Switcher: mUSD vs USDC */}
        <div className="flex p-1 rounded-2xl bg-[#090b10] border border-[#1e2333] mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('musd')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'musd'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Test mUSD (Instant Mint)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usdc')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'usdc'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Circle USDC (Official)
          </button>
        </div>

        {activeTab === 'musd' && (
          <div>
            <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 space-y-2 mb-4 leading-relaxed">
              <p>
                <strong className="text-indigo-300">Free Test Tokens:</strong> mUSD is a mock currency with zero real-world cost, designed for testing payments and pull-refunds.
              </p>
              <p className="text-gray-400">
                Note: You will also need native <strong className="text-white">MON</strong> in your wallet to cover network transaction fees on Monad Testnet.
              </p>
            </div>

            {account && tokenBalance !== undefined && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-between text-xs mb-4">
                <span className="text-gray-300 font-medium">Your Current mUSD:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {parseFloat(ethers.formatEther(tokenBalance)).toLocaleString()} mUSD
                </span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs space-y-1">
                <div className="flex items-center space-x-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{amount} mUSD minted successfully!</span>
                </div>
                {lastTxHash && (
                  <a
                    href={`${MONAD_TESTNET.blockExplorerUrl}/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-emerald-400 hover:underline pt-0.5"
                  >
                    <span>View on Monad Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Amount to Claim (mUSD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-900/90 border border-gray-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white font-mono text-lg outline-none transition-all"
                    placeholder="1000"
                    required
                    disabled={isLoading}
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-semibold text-gray-400">
                    mUSD
                  </span>
                </div>
              </div>

              {/* Quick preset buttons */}
              <div className="flex space-x-2">
                {['500', '1000', '5000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    disabled={isLoading}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      amount === preset
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              {isLoading && actionStep && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center space-x-2 text-indigo-300 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{actionStep}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !account || !amount || parseFloat(amount) <= 0}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all"
              >
                {!account ? (
                  <span>Connect Wallet to Claim mUSD</span>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Minting on Monad...</span>
                  </>
                ) : (
                  <span>Mint Free mUSD</span>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'usdc' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-2 text-xs text-emerald-200 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-white">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Native Circle USDC on Monad Testnet</span>
              </div>
              <p>
                COLLECTIVE supports official <strong>Circle USDC</strong> (6 decimals) deployed on Monad Testnet.
              </p>
              <p className="text-gray-300 text-[11px]">
                Contract Address: <code className="font-mono text-emerald-300">{CONTRACT_ADDRESSES.usdc}</code>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1e2333] space-y-3">
              <span className="text-xs font-semibold text-gray-300 block">How to get testnet USDC:</span>
              <p className="text-xs text-gray-400 leading-relaxed">
                Circle provides free testnet USDC through the official Circle Web3 Faucet. Select <strong>Monad Testnet</strong>, paste your address, and receive test USDC in seconds.
              </p>

              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <span>Open Official Circle Faucet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyAddress(CONTRACT_ADDRESSES.usdc, 'usdc')}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#121622] hover:bg-[#1a2030] text-gray-300 border border-[#20273a] transition flex items-center justify-center gap-1.5"
              >
                {copiedToken === 'usdc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken === 'usdc' ? 'Copied!' : 'Copy USDC Address'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddToMetaMask(CONTRACT_ADDRESSES.usdc, 'USDC', 6)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-[#121622] hover:bg-[#1a2030] text-gray-300 border border-[#20273a] transition flex items-center justify-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add to MetaMask</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
