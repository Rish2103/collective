import React, { useState } from 'react';
import { X, ShieldCheck, ExternalLink, Copy, Check, Lock, Award, AlertCircle, Cpu } from 'lucide-react';
import { MONAD_TESTNET, CONTRACT_ADDRESSES, getExplorerAddressUrl } from '../contracts/config';
import { shortenAddress } from '../utils/formatters';

interface TrustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrustModal: React.FC<TrustModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyAddress = (address: string, key: string) => {
    navigator.clipboard.writeText(address);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#0b0e17] border border-[#1e2333] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e2333] bg-[#0f1320]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Trust & Transparency Architecture</h3>
              <p className="text-xs text-gray-400">Verified contracts, deterministic rules & Monad Testnet details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2030] transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Network Info Card */}
          <div className="p-4 rounded-xl bg-[#121624] border border-[#1e2333]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Settlement Network</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block">Network</span>
                <span className="font-semibold text-white">{MONAD_TESTNET.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Chain ID</span>
                <span className="font-semibold text-white font-mono">{MONAD_TESTNET.chainId}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Gas Currency</span>
                <span className="font-semibold text-white font-mono">{MONAD_TESTNET.nativeCurrency.symbol} (Testnet)</span>
              </div>
              <div>
                <span className="text-gray-500 block">Block Time</span>
                <span className="font-semibold text-white font-mono">~400ms</span>
              </div>
            </div>
          </div>

          {/* Deployed Contracts */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deployed Verified Contracts</h4>

            {/* CollectivePool */}
            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">CollectivePool Manager</span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Solidity 0.8.24
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                  {shortenAddress(CONTRACT_ADDRESSES.collectivePool, 8)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyAddress(CONTRACT_ADDRESSES.collectivePool, 'pool')}
                  className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#232b42] text-gray-400 hover:text-white border border-[#273046] transition"
                  title="Copy contract address"
                >
                  {copiedKey === 'pool' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getExplorerAddressUrl(CONTRACT_ADDRESSES.collectivePool)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#232b42] text-gray-400 hover:text-indigo-400 border border-[#273046] transition"
                  title="View in Monad Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* MockToken */}
            <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">MockUSD (mUSD) Token</span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ERC-20 Faucet
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                  {shortenAddress(CONTRACT_ADDRESSES.mockToken, 8)}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyAddress(CONTRACT_ADDRESSES.mockToken, 'token')}
                  className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#232b42] text-gray-400 hover:text-white border border-[#273046] transition"
                  title="Copy token address"
                >
                  {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getExplorerAddressUrl(CONTRACT_ADDRESSES.mockToken)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#232b42] text-gray-400 hover:text-indigo-400 border border-[#273046] transition"
                  title="View in Monad Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Guarantees & Contract Invariants */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Protocol Invariants</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                  <Lock className="w-4 h-4" />
                  <span>Guaranteed Pull Refunds</span>
                </div>
                <p className="text-gray-400">
                  If the target is not reached before expiry, 100% of each deposit remains claimable directly by the contributor. Funds can never be held hostage.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                  <Award className="w-4 h-4" />
                  <span>Overfunding Policy</span>
                </div>
                <p className="text-gray-400">
                  Contributions exceeding the target are disbursed in full to the recipient upon payout, enabling stretch goals without refund lockup.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>Non-Custodial Escrow</span>
                </div>
                <p className="text-gray-400">
                  Funds reside purely in the immutable smart contract bytecode. Neither developers nor operators hold private keys or administrative backdoors.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121624] border border-[#1e2333]">
                <div className="flex items-center gap-2 text-rose-400 font-semibold mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Zero Fiat Value</span>
                </div>
                <p className="text-gray-400">
                  mUSD and MON are testnet tokens intended exclusively for developer testing and demonstration on Monad Testnet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e2333] bg-[#0f1320] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
