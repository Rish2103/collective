import React, { useState } from 'react';
import { X, Droplets, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMint: (amount: string) => Promise<boolean>;
  isLoading: boolean;
  tokenSymbol: string;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  onMint,
  isLoading,
  tokenSymbol,
}) => {
  const [amount, setAmount] = useState('1000');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    const ok = await onMint(amount);
    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 bg-[#12141c] border border-purple-800/40 rounded-2xl shadow-2xl shadow-purple-950/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-400 border border-purple-700/50">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Mock Token Faucet</h3>
            <p className="text-xs text-gray-400">Claim test {tokenSymbol} for Metropolis Hackathon</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-5 leading-relaxed">
          Mint free test tokens directly to your connected wallet on Monad Testnet to test creating pools and contributing.
        </p>

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/40 flex items-center space-x-2 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tokens minted successfully! Refreshing balance...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Amount ({tokenSymbol})
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-900/90 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white font-mono text-lg outline-none transition-all"
                placeholder="1000"
                required
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
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  amount === preset
                    ? 'bg-purple-900/40 border-purple-500 text-purple-200'
                    : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                +{preset}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Minting on Monad...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mint {amount} {tokenSymbol}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
