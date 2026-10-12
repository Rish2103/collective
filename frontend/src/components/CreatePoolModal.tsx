import React, { useState } from 'react';
import { X, PlusCircle, Clock, Target, User, Loader2 } from 'lucide-react';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    recipient: string,
    target: string,
    durationSeconds: number,
    title: string,
    description: string
  ) => Promise<boolean>;
  isLoading: boolean;
  account: string | null;
  tokenSymbol: string;
}

const DURATION_PRESETS = [
  { label: '3 Mins (Demo)', seconds: 180 },
  { label: '5 Mins (Demo)', seconds: 300 },
  { label: '1 Hour', seconds: 3600 },
  { label: '1 Day', seconds: 86400 },
  { label: '7 Days', seconds: 604800 },
];

export const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isLoading,
  account,
  tokenSymbol,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('500');
  const [recipient, setRecipient] = useState(account || '');
  const [durationSeconds, setDurationSeconds] = useState(300); // 5 min default for demo

  // Update recipient when account connects
  React.useEffect(() => {
    if (account && !recipient) {
      setRecipient(account);
    }
  }, [account, recipient]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onCreate(recipient, target, durationSeconds, title, description);
    if (ok) {
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 bg-[#12141c] border border-purple-800/40 rounded-2xl shadow-2xl shadow-purple-950/50 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-900/40 text-purple-400 border border-purple-700/50">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create Group Funding Pool</h3>
            <p className="text-xs text-gray-400">Enforced by Monad smart contract</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pool Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Pool Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hackathon Team Dinner & Lodging"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 focus:border-purple-500 text-white outline-none text-sm transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this pool funding? Add details for your members."
              rows={2}
              className="w-full px-4 py-2 rounded-xl bg-gray-900/90 border border-gray-700 focus:border-purple-500 text-white outline-none text-sm transition-all resize-none"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center space-x-1">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span>Target Amount ({tokenSymbol}) *</span>
              </span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="500"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 focus:border-purple-500 font-mono text-white outline-none text-sm transition-all"
              required
            />
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Fixed Recipient Address *</span>
              </span>
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700 focus:border-purple-500 font-mono text-white outline-none text-xs transition-all"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Recipient who will receive the full payout if the target is reached.
            </p>
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Pool Deadline Duration</span>
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => setDurationSeconds(preset.seconds)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    durationSeconds === preset.seconds
                      ? 'bg-purple-900/50 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Select 3 or 5 minutes for rapid live demo and judging evaluation.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !title || !recipient || !target}
            className="w-full mt-4 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Deploying Pool to Monad...</span>
              </>
            ) : (
              <span>Deploy Pool</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
