import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { X, PlusCircle, Clock, Target, User, Loader2, AlertCircle, Info, Sparkles, Users, Coins, Calculator, Check } from 'lucide-react';
import { playClickSound } from '../utils/audioFeedback';
import { SUPPORTED_TOKENS, TokenConfig } from '../contracts/config';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    tokenAddress: string,
    recipient: string,
    target: string,
    durationSeconds: number,
    title: string,
    description: string,
    expectedParticipants?: number | null
  ) => Promise<boolean>;
  isLoading: boolean;
  actionStep?: string | null;
  account: string | null;
  tokenSymbol: string;
}

export interface PoolTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  description: string;
  target: string;
  tokenKey: 'MUSD' | 'USDC';
  durationSeconds: number;
  durationLabel: string;
  participants?: number;
}

export const QUICK_TEMPLATES: PoolTemplate[] = [
  {
    id: 'dinner',
    name: 'Hackathon Team Dinner',
    icon: '🍕',
    title: 'Hackathon Team Dinner',
    description: 'Splitting dinner and refreshments for our Metropolis Hackathon build team.',
    target: '150',
    tokenKey: 'USDC',
    durationSeconds: 86400, // 24 hours
    durationLabel: '24h',
    participants: 5,
  },
  {
    id: 'trip',
    name: 'Weekend Cabin Trip',
    icon: '✈️',
    title: 'Weekend Cabin Trip',
    description: 'Shared Airbnb accommodation, travel passes, and group grocery supplies.',
    target: '1200',
    tokenKey: 'USDC',
    durationSeconds: 259200, // 3 days
    durationLabel: '3d',
    participants: 6,
  },
  {
    id: 'gift',
    name: 'Colleague Farewell Gift',
    icon: '🎁',
    title: 'Colleague Farewell Gift',
    description: 'Community pool for a farewell tech gift and customized memory card.',
    target: '80',
    tokenKey: 'MUSD',
    durationSeconds: 43200, // 12 hours
    durationLabel: '12h',
    participants: 4,
  },
  {
    id: 'fast-demo',
    name: 'Fast Demo Test',
    icon: '⚡',
    title: 'Fast Demo Test Pool',
    description: 'Rapid test pool for live judge demonstration with 10-minute expiry.',
    target: '50',
    tokenKey: 'MUSD',
    durationSeconds: 600, // 10 minutes
    durationLabel: '10m',
    participants: 2,
  },
];

const DURATION_PRESETS = [
  { label: '3 Mins (Demo)', seconds: 180 },
  { label: '5 Mins (Demo)', seconds: 300 },
  { label: '10 Mins (Demo)', seconds: 600 },
  { label: '12 Hours', seconds: 43200 },
  { label: '1 Day', seconds: 86400 },
  { label: '3 Days', seconds: 259200 },
  { label: '7 Days', seconds: 604800 },
];

export const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading,
  actionStep,
  account,
}) => {
  const [selectedTokenKey, setSelectedTokenKey] = useState<'MUSD' | 'USDC'>('MUSD');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('500');
  const [recipient, setRecipient] = useState(account || '');
  const [durationSeconds, setDurationSeconds] = useState(300); // 5 min default for demo
  const [expectedParticipants, setExpectedParticipants] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Bill-Splitter & Tip Calculator State
  const [showBillSplitter, setShowBillSplitter] = useState(false);
  const [billBaseAmount, setBillBaseAmount] = useState('120');
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [splitCount, setSplitCount] = useState('4');
  const [splitterApplied, setSplitterApplied] = useState(false);

  const baseNum = parseFloat(billBaseAmount) || 0;
  const tipAmount = (baseNum * tipPercent) / 100;
  const totalWithTip = baseNum + tipAmount;
  const splitNum = parseInt(splitCount, 10) || 1;
  const perPersonSplit = splitNum > 0 ? (totalWithTip / splitNum).toFixed(2) : '0';

  const handleApplySplitter = () => {
    if (baseNum <= 0) return;
    setTarget(totalWithTip.toFixed(2));
    setExpectedParticipants(String(splitNum));
    const summary = `🧾 Bill Split: $${baseNum.toFixed(2)}${tipPercent > 0 ? ` + ${tipPercent}% Tip ($${tipAmount.toFixed(2)})` : ''} split across ${splitNum} people (~$${perPersonSplit} each).`;
    if (!description.includes('Bill Split:')) {
      setDescription((prev) => (prev ? `${summary}\n\n${prev}` : summary));
    }
    setSplitterApplied(true);
    playClickSound();
    setTimeout(() => setSplitterApplied(false), 2000);
  };

  const activeToken: TokenConfig = SUPPORTED_TOKENS[selectedTokenKey];

  const handleSelectTemplate = (tmpl: PoolTemplate) => {
    playClickSound();
    setSelectedTemplateId(tmpl.id);
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setTarget(tmpl.target);
    setSelectedTokenKey(tmpl.tokenKey);
    setDurationSeconds(tmpl.durationSeconds);
    setExpectedParticipants(tmpl.participants ? String(tmpl.participants) : '');
    setValidationError(null);

    if (account) {
      setRecipient(account);
    } else {
      setValidationError("Please connect your wallet to set your address as recipient.");
    }
  };

  // Update recipient when account connects
  useEffect(() => {
    if (account && !recipient) {
      setRecipient(account);
    }
  }, [account, recipient]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const targetNum = parseFloat(target) || 0;
  const participantsNum = parseInt(expectedParticipants, 10);
  const suggestedShare =
    participantsNum > 1 && targetNum > 0
      ? (targetNum / participantsNum).toFixed(activeToken.decimals === 6 ? 2 : 2)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      setValidationError("Please connect your wallet to create a pool on Monad Testnet.");
      return;
    }

    // Validation
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setValidationError("Please enter a descriptive pool title.");
      return;
    }

    if (targetNum <= 0) {
      setValidationError("Funding target must be greater than zero.");
      return;
    }

    const cleanRecipient = recipient.trim();
    if (!cleanRecipient || !ethers.isAddress(cleanRecipient)) {
      setValidationError("Please enter a valid wallet address (0x...) for the recipient.");
      return;
    }

    const parsedParticipants = participantsNum > 1 ? participantsNum : null;

    const ok = await onCreate(
      activeToken.address,
      cleanRecipient,
      target,
      durationSeconds,
      cleanTitle,
      description.trim(),
      parsedParticipants
    );
    if (ok) {
      setTitle('');
      setDescription('');
      setExpectedParticipants('');
      setSelectedTemplateId(null);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-pool-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg p-6 sm:p-7 bg-[#10131c] border border-indigo-900/40 rounded-3xl shadow-2xl shadow-indigo-950/60 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="create-pool-title" className="text-xl font-bold text-white tracking-tight">Create Funding Pool</h3>
            <p className="text-xs text-indigo-300/80">Automated group money box with guaranteed refunds</p>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Start Templates */}
          <div className="p-3.5 rounded-2xl bg-[#131722]/80 border border-[#212638]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Start Presets</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">1-Click Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  disabled={isLoading}
                  className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2 ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                      : 'bg-[#0f121a] border-[#1d2232] hover:border-indigo-800/60 text-gray-300 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none mt-0.5">{tmpl.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{tmpl.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {tmpl.target} {SUPPORTED_TOKENS[tmpl.tokenKey].symbol} · {tmpl.durationLabel}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Token Currency Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-indigo-400" />
                <span>Choose Currency *</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setSelectedTokenKey('MUSD');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTokenKey === 'MUSD'
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">mUSD</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">18 Dec</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                  Free test dollars (instant in-app mint)
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setSelectedTokenKey('USDC');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTokenKey === 'USDC'
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">USDC</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Circle 6 Dec</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                  Official Circle USD Coin on Monad
                </p>
              </button>
            </div>
          </div>

          {/* Pool Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Pool Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hackathon Team Dinner & Refreshments"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white outline-none text-sm transition-all"
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the purpose of this group fund to your friends..."
              rows={2}
              className="w-full px-4 py-2 rounded-xl bg-gray-900/90 border border-gray-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white outline-none text-sm transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Feature: Split The Bill & Tip Calculator */}
          <div className="p-3.5 rounded-2xl bg-[#131722]/90 border border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowBillSplitter(!showBillSplitter);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-white transition"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-950/80 flex items-center justify-center text-indigo-400 border border-indigo-800/40">
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <span>Bill-Splitter & Tip Tool</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {showBillSplitter ? 'Close' : 'Calculate Split'}
                </span>
              </button>
              <span className="text-[10px] text-gray-400 font-mono">Dinner / Travel / Shared Cart</span>
            </div>

            {showBillSplitter && (
              <div className="pt-2 border-t border-[#1e2538] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-gray-400 block mb-1">
                      Raw Bill Amount ({activeToken.symbol})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={billBaseAmount}
                      onChange={(e) => setBillBaseAmount(e.target.value)}
                      placeholder="120"
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-gray-400 block mb-1">
                      Split Among (Friends)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={splitCount}
                      onChange={(e) => setSplitCount(e.target.value)}
                      placeholder="4"
                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-700 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-400 block mb-1">
                    Tip / Service Buffer
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 10, 15, 18, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setTipPercent(pct);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                          tipPercent === pct
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-[#0f121a] text-gray-400 border-[#1d2232] hover:text-white'
                        }`}
                      >
                        {pct === 0 ? '0%' : `+${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Result & Apply Button */}
                <div className="p-2.5 rounded-xl bg-[#0c0f18] border border-indigo-950/80 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-gray-400">Total: </span>
                    <strong className="text-white font-mono font-bold">${totalWithTip.toFixed(2)}</strong>
                    <span className="text-gray-500"> (Tip: ${tipAmount.toFixed(2)}) · </span>
                    <strong className="text-emerald-400 font-mono font-bold">${perPersonSplit}</strong>
                    <span className="text-gray-400"> / person</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplySplitter}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1 transition shadow-sm"
                  >
                    {splitterApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Applied!</span>
                      </>
                    ) : (
                      <span>Apply to Target & FairShare</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Funding Goal ({activeToken.symbol}) *</span>
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="500"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-white outline-none text-sm transition-all"
                required
                disabled={isLoading}
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-gray-400">
                {activeToken.symbol}
              </span>
            </div>
          </div>

          {/* FairShare: Expected Group Size / Participants */}
          <div className="p-3.5 rounded-2xl bg-[#131722]/80 border border-[#212638] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>FairShare: Group Size (Optional)</span>
              </label>
              <span className="text-[10px] text-gray-400">Voluntary Guidance</span>
            </div>
            <input
              type="number"
              min="2"
              max="500"
              step="1"
              value={expectedParticipants}
              onChange={(e) => setExpectedParticipants(e.target.value)}
              placeholder="e.g. 5 friends splitting"
              className="w-full px-4 py-2 rounded-xl bg-gray-900/90 border border-gray-700/80 focus:border-indigo-500 text-white outline-none text-xs transition-all"
              disabled={isLoading}
            />
            {suggestedShare && (
              <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl flex items-center justify-between">
                <span>Suggested share per person:</span>
                <span className="font-mono font-bold text-white">~{suggestedShare} {activeToken.symbol}</span>
              </div>
            )}
            <p className="text-[10px] text-gray-400">
              Suggested shares are non-binding guidance to help friends see their equal share. Anyone can contribute any amount.
            </p>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Recipient Wallet Address *</span>
              </span>
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs text-white outline-none transition-all"
              required
              disabled={isLoading}
            />
            {account && recipient !== account && (
              <button
                type="button"
                onClick={() => setRecipient(account)}
                className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Use my connected wallet address
              </button>
            )}
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Funding Countdown Duration *</span>
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => setDurationSeconds(preset.seconds)}
                  disabled={isLoading}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                    durationSeconds === preset.seconds
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>If the goal is not reached before time runs out, 100% refunds unlock immediately.</span>
            </p>
          </div>

          {/* Action Step Feedback */}
          {isLoading && actionStep && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center space-x-2 text-indigo-300 text-xs">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{actionStep}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !account}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition-all"
          >
            {!account ? (
              <span>Connect Wallet to Launch Pool</span>
            ) : isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Pool on Monad...</span>
              </>
            ) : (
              <span>Create Pool on Monad</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
