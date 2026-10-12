import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { X, Droplets, Sparkles, Loader2, CheckCircle2, AlertCircle, ExternalLink, Wallet, Copy } from 'lucide-react';
import { MONAD_TESTNET, CONTRACT_ADDRESSES } from '../contracts/config';
import { playCopyChime, playSuccessChime } from '../utils/audioFeedback';

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMint: (amount: string) => Promise<boolean>;
  isLoading: boolean;
  actionStep?: string | null;
  lastTxHash?: string | null;
  tokenSymbol: string;
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
  tokenSymbol,
  account,
  tokenBalance,
}) => {
  const [amount, setAmount] = useState('1000');
  const [success, setSuccess] = useState(false);
  const [addTokenStatus, setAddTokenStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isCopied, setIsCopied] = useState(false);

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

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESSES.mockToken);
    setIsCopied(true);
    playCopyChime();
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleAddToMetaMask = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      alert("No Ethereum wallet found.");
      return;
    }

    setAddTokenStatus('loading');
    try {
      // 1. Ensure network is switched to Monad Testnet first so watchAsset has the right active chain
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MONAD_TESTNET.chainIdHex }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: MONAD_TESTNET.chainIdHex,
              chainName: MONAD_TESTNET.name,
              rpcUrls: [MONAD_TESTNET.rpcUrl],
              nativeCurrency: MONAD_TESTNET.nativeCurrency,
              blockExplorerUrls: [MONAD_TESTNET.blockExplorerUrl],
            }],
          });
        }
      }

      // 2. Request watchAsset
      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT_ADDRESSES.mockToken,
            symbol: tokenSymbol,
            decimals: 18,
          },
        },
      });

      if (wasAdded) {
        setAddTokenStatus('success');
        setTimeout(() => setAddTokenStatus('idle'), 4000);
      } else {
        setAddTokenStatus('idle');
      }
    } catch (err: any) {
      console.error('Failed to add token to MetaMask:', err);
      setAddTokenStatus('error');
      setTimeout(() => setAddTokenStatus('idle'), 4000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faucet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md p-6 sm:p-7 bg-[#10131c] border border-indigo-900/40 rounded-3xl shadow-2xl shadow-indigo-950/60">
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
            <h3 id="faucet-modal-title" className="text-xl font-bold text-white tracking-tight">MockUSD Faucet</h3>
            <p className="text-xs text-indigo-300/80">Claim test {tokenSymbol} for COLLECTIVE</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 space-y-2 mb-4 leading-relaxed">
          <p>
            <strong className="text-indigo-300">Testnet Disclaimer:</strong> {tokenSymbol} is a free mock test token with zero real-world value.
          </p>
          <p className="text-gray-400">
            Note: You also need native <strong className="text-white">MON</strong> in your wallet to cover gas fees on Monad Testnet.
          </p>
        </div>

        {account && tokenBalance !== undefined && (
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-between text-xs mb-4">
            <span className="text-gray-300 font-medium">Your Current Balance:</span>
            <span className="mono font-bold text-white text-sm">
              {parseFloat(ethers.formatEther(tokenBalance)).toLocaleString()} {tokenSymbol}
            </span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs space-y-1">
            <div className="flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{amount} {tokenSymbol} minted successfully!</span>
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
              Amount to Mint ({tokenSymbol})
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
                {tokenSymbol}
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
              <span>Connect Wallet to Claim {tokenSymbol}</span>
            ) : isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Minting on Monad...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mint {amount} {tokenSymbol}</span>
              </>
            )}
          </button>

          {account && (
            <div className="pt-2 space-y-2 border-t border-gray-800/80">
              <button
                type="button"
                onClick={handleAddToMetaMask}
                disabled={addTokenStatus === 'loading'}
                className="w-full py-2.5 px-3 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-750 hover:border-indigo-600/50 text-xs font-semibold text-indigo-300 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {addTokenStatus === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Check MetaMask Prompt...</span>
                  </>
                ) : addTokenStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">mUSD Added to MetaMask!</span>
                  </>
                ) : addTokenStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prompt cancelled or not focused</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Add {tokenSymbol} to MetaMask (1-Click)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-950/60 border border-gray-850 text-[11px]">
                <span className="text-gray-400 truncate mr-2">
                  Address: <code className="text-gray-300 mono">{CONTRACT_ADDRESSES.mockToken.slice(0, 8)}...{CONTRACT_ADDRESSES.mockToken.slice(-6)}</code>
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 font-semibold transition-colors shrink-0 flex items-center space-x-1"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
