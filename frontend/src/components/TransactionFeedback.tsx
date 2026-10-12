import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, X, Clock } from 'lucide-react';
import { getExplorerTxUrl } from '../contracts/config';
import { shortenTxHash } from '../utils/formatters';
import { playSuccessChime } from '../utils/audioFeedback';

export interface TransactionStatus {
  state: 'idle' | 'awaiting_wallet' | 'submitting' | 'confirmed' | 'error';
  title?: string;
  message?: string;
  txHash?: string | null;
  error?: string | null;
}

interface TransactionFeedbackProps {
  status: TransactionStatus;
  onDismiss: () => void;
}

export const TransactionFeedback: React.FC<TransactionFeedbackProps> = ({ status, onDismiss }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalMs, setFinalMs] = useState<number | null>(null);

  useEffect(() => {
    if (status.state === 'awaiting_wallet' || status.state === 'submitting') {
      const startTime = Date.now();
      setFinalMs(null);
      const timer = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 100);
      return () => clearInterval(timer);
    } else if (status.state === 'confirmed') {
      if (finalMs === null && elapsedMs > 0) {
        setFinalMs(elapsedMs);
      }
      playSuccessChime();
    }
  }, [status.state]);

  if (status.state === 'idle') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-slide-up">
      <div
        className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
          status.state === 'error'
            ? 'bg-[#180d12]/95 border-rose-500/30 text-rose-200'
            : status.state === 'confirmed'
            ? 'bg-[#0d1814]/95 border-emerald-500/30 text-emerald-200'
            : 'bg-[#101422]/95 border-indigo-500/30 text-indigo-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className="mt-0.5 flex-shrink-0">
              {status.state === 'awaiting_wallet' && (
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              {status.state === 'submitting' && (
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              {status.state === 'confirmed' && (
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              {status.state === 'error' && (
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {status.title ||
                  (status.state === 'awaiting_wallet' && 'Awaiting Wallet Confirmation') ||
                  (status.state === 'submitting' && 'Mining on Monad Testnet...') ||
                  (status.state === 'confirmed' && 'Transaction Confirmed!') ||
                  'Transaction Failed'}
              </h4>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed break-words">
                {status.message || status.error}
              </p>

              {/* Monad Stopwatch & Finality */}
              {(status.state === 'submitting' || status.state === 'awaiting_wallet') && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-indigo-300">
                  <Clock className="w-3 h-3 text-indigo-400 animate-spin" />
                  <span>Timer: {(elapsedMs / 1000).toFixed(1)}s (Monad ~1s finality)</span>
                </div>
              )}
              {status.state === 'confirmed' && (finalMs !== null || elapsedMs > 0) && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Confirmed in {((finalMs || elapsedMs) / 1000).toFixed(1)}s on Monad Testnet</span>
                </div>
              )}

              {/* Tx Hash Link */}
              {status.txHash && (
                <div className="mt-2">
                  <a
                    href={getExplorerTxUrl(status.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono hover:underline"
                  >
                    <span>Tx: {shortenTxHash(status.txHash)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
