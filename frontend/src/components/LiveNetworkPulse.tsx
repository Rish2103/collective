import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Activity, ExternalLink, ArrowRight } from 'lucide-react';
import { CONTRACT_ADDRESSES, getExplorerAddressUrl } from '../contracts/config';

interface LiveNetworkPulseProps {
  onOpenTrustModal?: () => void;
  className?: string;
}

export const LiveNetworkPulse: React.FC<LiveNetworkPulseProps> = ({
  onOpenTrustModal,
  className = '',
}) => {
  // Simulate live block incrementing on Monad testnet
  const [currentBlock, setCurrentBlock] = useState(14892420);
  const [blockPulse, setBlockPulse] = useState(false);
  const [latency, setLatency] = useState(782);

  useEffect(() => {
    // Monad has ~1 second block time
    const interval = setInterval(() => {
      setCurrentBlock((prev) => prev + 1);
      setBlockPulse(true);
      // Small jitter between 760ms and 805ms
      setLatency(760 + Math.floor(Math.random() * 45));
      setTimeout(() => setBlockPulse(false), 400);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`w-full rounded-2xl bg-gradient-to-r from-[#0c0e17] via-[#101424] to-[#0c0e17] border border-[#1e2333] p-3 sm:px-5 sm:py-3.5 shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}
    >
      {/* Background ambient light */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Left: Monad Live Status & Block Height */}
      <div className="flex items-center space-x-3.5 flex-wrap gap-y-2">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-white tracking-wide uppercase text-[11px]">
            Monad Testnet <span className="text-gray-400 font-mono font-normal">#10143</span>
          </span>
        </div>

        <div className="h-3.5 w-px bg-gray-700/60 hidden sm:block" />

        {/* Live Block Counter with ping effect */}
        <div className="flex items-center space-x-1.5 font-mono text-gray-300">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-gray-400 text-[11px]">Block:</span>
          <span
            className={`font-semibold text-white transition-colors duration-200 ${
              blockPulse ? 'text-emerald-400 scale-105' : 'text-gray-200'
            }`}
          >
            #{currentBlock.toLocaleString()}
          </span>
        </div>

        <div className="h-3.5 w-px bg-gray-700/60 hidden sm:block" />

        {/* Sub-Second Latency */}
        <div className="flex items-center space-x-1.5 text-gray-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-gray-400 text-[11px]">Finality:</span>
          <span className="font-mono font-bold text-emerald-400">{latency} ms</span>
        </div>
      </div>

      {/* Right: Security & Contract Guarantee Links */}
      <div className="flex items-center space-x-3 text-[11px] text-gray-400">
        <button
          onClick={onOpenTrustModal}
          className="hover:text-indigo-300 flex items-center space-x-1 transition font-medium text-gray-300"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>100% Bytecode Pull-Refunds</span>
        </button>

        <a
          href={getExplorerAddressUrl(CONTRACT_ADDRESSES.collectivePool)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white flex items-center space-x-1 text-indigo-400 transition ml-2 font-mono"
        >
          <span>Contract</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
