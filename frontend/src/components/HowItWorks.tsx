import React, { useState } from 'react';
import { PlusCircle, Users, Scale, ArrowRight, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface HowItWorksProps {
  tokenSymbol?: string;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ tokenSymbol = 'mUSD' }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      <div className="bg-[#0b0e17]/80 border border-[#1b2030] rounded-2xl p-4 sm:p-5 shadow-lg">
        {/* Header / Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider">
              How COLLECTIVE Works
            </h3>
            <span className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-full font-mono">
              3-Step Lifecycle
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-400 hover:text-white flex items-center space-x-1 transition-colors px-2 py-1 rounded-lg hover:bg-gray-800/40"
            aria-expanded={isExpanded}
            aria-label="Toggle How COLLECTIVE Works guide"
          >
            <span>{isExpanded ? 'Collapse' : 'Learn More'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 3 Steps Grid */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#171b28]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Step 1 */}
              <div className="relative p-4 rounded-xl bg-[#101420]/70 border border-[#1d2334] flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded">
                      STEP 01
                    </span>
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white">Create a Funding Pool</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Set a purpose, funding target ({tokenSymbol}), expiration deadline, and designated recipient. Non-custodial escrow is deployed directly to the smart contract.
                  </p>
                </div>
                <div className="hidden md:flex justify-end pt-2 text-gray-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative p-4 rounded-xl bg-[#101420]/70 border border-[#1d2334] flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded">
                      STEP 02
                    </span>
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white">Back It Together</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Friends and participants deposit test {tokenSymbol} via wallet transactions on Monad Testnet. Every contribution is tracked individually on-chain.
                  </p>
                </div>
                <div className="hidden md:flex justify-end pt-2 text-gray-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative p-4 rounded-xl bg-[#101420]/70 border border-[#1d2334] flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                      STEP 03
                    </span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Scale className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white">Resolve Transparently</h4>
                  <div className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
                    <p>
                      <strong className="text-emerald-300">Target Reached:</strong> Recipient claims 100% of pooled funds.
                    </p>
                    <p>
                      <strong className="text-rose-300">Underfunded at Expiry:</strong> Each contributor pulls back 100% of their deposit trustlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testnet & Conditions Footnote */}
            <div className="mt-3.5 pt-3 border-t border-[#171b28] flex items-center justify-between text-[11px] text-gray-400">
              <div className="flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>
                  Refunds use the secure pull pattern (claimable individually by contributing wallets). {tokenSymbol} is a test token on Monad Testnet (Chain ID 10143) with zero fiat value.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
