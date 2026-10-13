import React, { useState, useEffect } from 'react';
import {
  Zap,
  Users,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Sliders,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { playClickSound, playSuccessChime } from '../utils/audioFeedback';
import { SpotlightCard } from './SpotlightCard';

export interface SimulatorPreset {
  id: string;
  name: string;
  emoji: string;
  title: string;
  description: string;
  target: number;
  participants: number;
  token: 'USDC' | 'mUSD';
}

const PRESETS: SimulatorPreset[] = [
  {
    id: 'dinner',
    name: 'Team Dinner',
    emoji: '🍕',
    title: 'Hackathon Team Dinner',
    description: 'Post-hackathon celebration meal and drinks split fairly among builders.',
    target: 180,
    participants: 6,
    token: 'USDC',
  },
  {
    id: 'cabin',
    name: 'Weekend Cabin',
    emoji: '🏖️',
    title: 'Mountain Cabin Getaway',
    description: 'Shared 3-day Airbnb rental, firewood, and grocery supplies.',
    target: 1200,
    participants: 8,
    token: 'USDC',
  },
  {
    id: 'gift',
    name: 'Farewell Gift',
    emoji: '🎁',
    title: 'Community Tech Farewell Gift',
    description: 'Pooling together for a top-tier ergonomic mechanical keyboard.',
    target: 350,
    participants: 7,
    token: 'mUSD',
  },
  {
    id: 'bounty',
    name: 'Hackathon Prize',
    emoji: '🏆',
    title: 'Metropolis Dev Bounty',
    description: 'Consortium developer reward pool with decentralized escrow.',
    target: 3000,
    participants: 5,
    token: 'USDC',
  },
];

interface LiveSimulatorProps {
  onLaunchPool?: (preset: {
    title: string;
    target: string;
    tokenKey: 'MUSD' | 'USDC';
    participants: number;
    description: string;
  }) => void;
  className?: string;
}

export const LiveSimulator: React.FC<LiveSimulatorProps> = ({
  onLaunchPool,
  className = '',
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('dinner');
  const [targetAmount, setTargetAmount] = useState<number>(180);
  const [participants, setParticipants] = useState<number>(6);
  const [tokenType, setTokenType] = useState<'USDC' | 'mUSD'>('USDC');
  const [activeOutcomeTab, setActiveOutcomeTab] = useState<'payout' | 'refund'>('payout');

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number>(0); // 0: Idle, 1: Validation, 2: Escrow, 3: Finalized
  const [stopwatchMs, setStopwatchMs] = useState<number>(0);
  const [simSuccess, setSimSuccess] = useState(false);

  // Load preset data
  const handleSelectPreset = (preset: SimulatorPreset) => {
    playClickSound();
    setSelectedPresetId(preset.id);
    setTargetAmount(preset.target);
    setParticipants(preset.participants);
    setTokenType(preset.token);
    setSimSuccess(false);
    setSimStep(0);
    setStopwatchMs(0);
  };

  // Run Sub-Second Monad Simulation
  const handleRunSimulation = () => {
    if (isSimulating) return;
    playClickSound();
    setIsSimulating(true);
    setSimStep(1);
    setSimSuccess(false);
    setStopwatchMs(0);

    const startTime = performance.now();
    const targetMs = 784; // Sub-second Monad finality benchmark

    const interval = setInterval(() => {
      const elapsed = Math.round(performance.now() - startTime);
      if (elapsed >= targetMs) {
        clearInterval(interval);
        setStopwatchMs(targetMs);
        setSimStep(3);
        setIsSimulating(false);
        setSimSuccess(true);
        playSuccessChime();
      } else {
        setStopwatchMs(elapsed);
        if (elapsed > 380) {
          setSimStep(2);
        } else {
          setSimStep(1);
        }
      }
    }, 16);
  };

  const perPerson = participants > 0 ? (targetAmount / participants).toFixed(2) : '0';
  const ethL1Gas = 36.50; // Average Ethereum L1 transfer/call gas in USD
  const monadGas = 0.0008; // Average Monad execution fee in USD
  const totalEthGas = (ethL1Gas * participants).toFixed(2);
  const totalMonadGas = (monadGas * participants).toFixed(4);
  const totalSaved = (Number(totalEthGas) - Number(totalMonadGas)).toFixed(2);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Container with Stripe-style multi-hue ambient backdrop */}
      <SpotlightCard
        spotlightColor="rgba(99, 102, 241, 0.16)"
        borderColor="rgba(129, 140, 248, 0.4)"
        enableTilt={false}
        className="rounded-3xl bg-gradient-to-b from-[#0e111d] via-[#090b12] to-[#07080b] border border-[#1e2338] p-6 sm:p-8 lg:p-10 shadow-2xl relative"
      >
        {/* Subtle decorative aurora mesh */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Header & Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1e2333]">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-cyan-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Interactive Monad Settlement Playground</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Experience <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-200 to-cyan-300">Sub-Second Finality</span> in Real Time
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
                Simulate consumer group escrow on Monad's parallel EVM. Test live FairShare splits, sub-second block confirmations, and guaranteed 100% pull-refund mechanics without spending real tokens.
              </p>
            </div>

            {/* Live Monad Badge */}
            <div className="flex items-center space-x-2.5 bg-[#121624] border border-[#232a42] px-4 py-2.5 rounded-2xl shrink-0 self-start md:self-auto shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="text-left">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Execution Engine</span>
                <span className="text-xs font-bold text-white font-mono">Monad Parallel EVM &bull; &lt;800ms</span>
              </div>
            </div>
          </div>

          {/* Scenario Quick-Picks (Stripe pill buttons) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>1. Choose a Real-World Group Funding Scenario</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-950/60 to-purple-950/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                        : 'bg-[#0d101a] border-[#1e2333] hover:border-gray-600 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{preset.emoji}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        preset.token === 'USDC' ? 'bg-emerald-950/80 text-emerald-300' : 'bg-indigo-950/80 text-indigo-300'
                      }`}>
                        {preset.token}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs block truncate">{preset.name}</span>
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        ${preset.target} &bull; {preset.participants}p
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Sliders & Live Split Calculation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Sliders Column */}
            <div className="lg:col-span-7 bg-[#0b0e17] border border-[#1b2030] rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Interactive Parameters</span>
                </span>
                <span className="text-[11px] text-gray-400">Drag sliders to adjust in real-time</span>
              </div>

              {/* Target Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total Group Target:</span>
                  <span className="font-mono font-bold text-white text-base">${targetAmount.toLocaleString()} {tokenType}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="25"
                  value={targetAmount}
                  onChange={(e) => {
                    setTargetAmount(Number(e.target.value));
                    setSelectedPresetId('');
                  }}
                  className="w-full h-2 bg-[#171c2b] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>$50</span>
                  <span>$1,000</span>
                  <span>$2,500</span>
                  <span>$5,000</span>
                </div>
              </div>

              {/* Headcount Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Group Contributors:</span>
                  <span className="font-mono font-bold text-white text-base">{participants} people</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={participants}
                  onChange={(e) => {
                    setParticipants(Number(e.target.value));
                    setSelectedPresetId('');
                  }}
                  className="w-full h-2 bg-[#171c2b] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>2 friends</span>
                  <span>5 friends</span>
                  <span>10 friends</span>
                  <span>20 friends</span>
                </div>
              </div>

              {/* Currency & Preset Shortcuts */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1a1f2e]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">Asset:</span>
                  <div className="flex items-center space-x-1 bg-[#121622] p-1 rounded-xl border border-[#20273a]">
                    <button
                      onClick={() => setTokenType('USDC')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        tokenType === 'USDC' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Circle USDC
                    </button>
                    <button
                      onClick={() => setTokenType('mUSD')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        tokenType === 'mUSD' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Test mUSD
                    </button>
                  </div>
                </div>

                {onLaunchPool && (
                  <button
                    onClick={() => {
                      playClickSound();
                      onLaunchPool({
                        title: PRESETS.find(p => p.id === selectedPresetId)?.title || `Collective Group Pool ($${targetAmount})`,
                        target: targetAmount.toString(),
                        tokenKey: tokenType === 'USDC' ? 'USDC' : 'MUSD',
                        participants,
                        description: PRESETS.find(p => p.id === selectedPresetId)?.description || `Group pot of $${targetAmount} split among ${participants} contributors.`,
                      });
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition"
                  >
                    <span>Launch This Pool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Live FairShare & Simulation Trigger Column */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#111524] to-[#0c0e17] border border-[#23293d] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Computed FairShare Allocation
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                    ${perPerson}
                  </span>
                  <span className="text-xs text-indigo-300 font-semibold font-mono">
                    {tokenType} / person
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Exact equal split calculated on-chain. If {participants} friends pledge ${perPerson}, the ${targetAmount} goal is reached with 100% precision.
                </p>
              </div>

              {/* Sub-Second Execution Trigger */}
              <div className="space-y-3 pt-4 border-t border-[#1e2336]">
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all duration-200 transform ${
                    isSimulating
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 cursor-wait'
                      : simSuccess
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:-translate-y-0.5'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isSimulating ? 'animate-bounce text-amber-300' : 'text-amber-400'}`} />
                  <span>
                    {isSimulating
                      ? `Executing on Monad Parallel EVM... (${stopwatchMs}ms)`
                      : simSuccess
                      ? `Finalized in ${stopwatchMs}ms! (Simulate Again)`
                      : '⚡ Test Sub-Second Monad Finality'}
                  </span>
                </button>

                {/* Live Stopwatch & Progress Pipeline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-400">Finality Stopwatch:</span>
                    <span className={`font-bold ${simSuccess ? 'text-emerald-400' : 'text-indigo-300'}`}>
                      {stopwatchMs} ms / 800 ms
                    </span>
                  </div>

                  <div className="w-full bg-[#171c2b] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 ${
                        simSuccess ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${Math.min((stopwatchMs / 784) * 100, 100)}%` }}
                    />
                  </div>

                  {/* 3 Micro-Stages */}
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center">
                    <div className={`p-1 rounded ${simStep >= 1 ? 'text-indigo-300 bg-indigo-950/60 font-semibold' : 'text-gray-500'}`}>
                      1. Parallel Gas
                    </div>
                    <div className={`p-1 rounded ${simStep >= 2 ? 'text-purple-300 bg-purple-950/60 font-semibold' : 'text-gray-500'}`}>
                      2. Escrow Lock
                    </div>
                    <div className={`p-1 rounded ${simStep >= 3 ? 'text-emerald-300 bg-emerald-950/60 font-semibold' : 'text-gray-500'}`}>
                      3. Finalized
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Outcome Guarantee Tabs (Stripe-caliber product showcase) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                2. Experience the Dual Guarantees of COLLECTIVE Smart Contracts
              </span>
              <div className="flex items-center space-x-1 bg-[#121622] p-1 rounded-2xl border border-[#20273a]">
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveOutcomeTab('payout');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeOutcomeTab === 'payout'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🎯 Scenario A: Goal Met (Instant Payout)
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveOutcomeTab('refund');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    activeOutcomeTab === 'refund'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🛡️ Scenario B: Under Target (100% Pull-Refund)
                </button>
              </div>
            </div>

            {/* Outcome Detail Panels */}
            {activeOutcomeTab === 'payout' ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-[#0e141a] to-[#0c0e17] border border-emerald-800/40 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center shrink-0 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Instant Payout Disbursed with 0% Platform Cut
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed mt-1">
                      When all {participants} contributors deposit their ${perPerson} pledge and the ${targetAmount} target is reached, the pool locks into <code>Goal Secured</code>. Anyone or the designated recipient can claim the full sum in a single sub-second transaction. 100% of the funds go directly to the destination with zero platform deductions.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/25 via-[#0e111a] to-[#0c0e17] border border-indigo-800/40 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center shrink-0 text-indigo-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Guaranteed 100% Pull-Refunds Enforced by Contract Bytecode
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed mt-1">
                      If the pool expires with even $1 missing from the ${targetAmount} target, no one can touch or freeze your deposit. Each participant's pull-refund function unlocks automatically. With 1 click, your ${perPerson} deposit returns directly to your wallet. You never have to chase delinquent friends or beg an admin for help.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stripe-Caliber Side-by-Side Savings Matrix */}
          <div className="pt-2 border-t border-[#1e2333] space-y-3">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              3. Architectural Efficiency: Monad vs Traditional Ethereum L1
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#0b0e17] border border-[#1e2333] text-left">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Execution Finality</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-xl font-mono font-bold text-emerald-400">&lt; 800 ms</span>
                  <span className="text-[10px] text-gray-400">vs 15,000 ms on L1</span>
                </div>
                <span className="text-[11px] text-gray-400 block mt-1">
                  18x faster confirmation for seamless in-person group splits.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0e17] border border-[#1e2333] text-left">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Total Group Gas Cost</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-xl font-mono font-bold text-white">${totalMonadGas}</span>
                  <span className="text-[10px] text-rose-400">vs ${totalEthGas} on L1</span>
                </div>
                <span className="text-[11px] text-emerald-400 block mt-1">
                  ${totalSaved} saved in collective network fees!
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0b0e17] border border-[#1e2333] text-left">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Refund Guarantee</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-xl font-mono font-bold text-indigo-300">100% Bytecode</span>
                </div>
                <span className="text-[11px] text-gray-400 block mt-1">
                  Independent pull-refunds prevent any single delinquent backer from locking group funds.
                </span>
              </div>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};
