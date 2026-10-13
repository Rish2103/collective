import React, { useState } from 'react';
import { X, CheckCircle2, AlertOctagon, ExternalLink, Copy, Check, Share2, ShieldCheck, FileText, ArrowRight, Clock } from 'lucide-react';
import { PoolData, PoolState } from '../types';
import { formatTokenAmount, shortenAddress, shortenTxHash, formatBlockTime } from '../utils/formatters';
import { getExplorerAddressUrl, getExplorerTxUrl, getTokenConfig, CONTRACT_ADDRESSES } from '../contracts/config';
import { playCopyChime } from '../utils/audioFeedback';

interface OutcomeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolData | null;
  account: string | null;
  payoutTxHash?: string | null;
}

export const OutcomeReceiptModal: React.FC<OutcomeReceiptModalProps> = ({
  isOpen,
  onClose,
  pool,
  account,
  payoutTxHash,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  if (!isOpen || !pool) return null;

  const tokenConfig = getTokenConfig(pool.token);
  const isPaidOut = pool.state === PoolState.PaidOut;
  const isTargetMet = pool.totalContributed >= pool.targetAmount && pool.targetAmount > 0n;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = pool.deadline <= now;

  const targetFormatted = formatTokenAmount(pool.targetAmount, tokenConfig.decimals);
  const contributedFormatted = formatTokenAmount(pool.totalContributed, tokenConfig.decimals);
  const surplusWei = pool.totalContributed > pool.targetAmount ? pool.totalContributed - pool.targetAmount : 0n;
  const surplusFormatted = formatTokenAmount(surplusWei, tokenConfig.decimals);

  const userContributed = pool.userContribution !== undefined && pool.userContribution > 0n;
  const userContributionFormatted = formatTokenAmount(pool.userContribution || 0n, tokenConfig.decimals);

  const shareReceiptUrl = `${window.location.origin}${window.location.pathname}?pool=${pool.id}&receipt=true`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareReceiptUrl);
      setCopiedLink(true);
      playCopyChime();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      // Fallback
    }
  };

  const receiptSummaryText = `=== COLLECTIVE VERIFIABLE OUTCOME RECEIPT ===
Pool #${pool.id}: "${pool.title}"
Status: ${isPaidOut ? 'Successfully Settled (Funds Disbursed)' : isExpired ? 'Expired Underfunded (100% Pull-Refunds)' : 'Goal Secured'}
Token: ${tokenConfig.symbol}
Total Raised: ${contributedFormatted} / Target: ${targetFormatted} ${tokenConfig.symbol}
${surplusWei > 0n ? `Surplus Disbursed: +${surplusFormatted} ${tokenConfig.symbol}\n` : ''}Recipient: ${pool.recipient}
Verified Contract: ${CONTRACT_ADDRESSES.collectivePool}
Network: Monad Testnet (Chain ID 10143)
Receipt Link: ${shareReceiptUrl}`;

  const handleCopyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(receiptSummaryText);
      setCopiedReceipt(true);
      playCopyChime();
      setTimeout(() => setCopiedReceipt(false), 2000);
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl p-6 sm:p-7 bg-[#10131c] border border-indigo-900/40 rounded-3xl shadow-2xl shadow-indigo-950/60 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close receipt"
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Header */}
        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-[#1e2333]">
          <div className={`p-3 rounded-2xl ${
            isPaidOut
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
              : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
          }`}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="receipt-modal-title" className="text-xl font-bold text-white tracking-tight">
                Verifiable Outcome Receipt
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                Monad #{pool.id}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Cryptographically verified from on-chain smart contract storage
            </p>
          </div>
        </div>

        {/* Outcome Status Banner */}
        <div className={`p-4 rounded-2xl border mb-5 ${
          isPaidOut
            ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-200'
            : isExpired && !isTargetMet
            ? 'bg-rose-950/30 border-rose-600/40 text-rose-200'
            : 'bg-indigo-950/30 border-indigo-600/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2.5 font-bold text-sm mb-1">
            {isPaidOut ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Successfully Settled & Disbursed</span>
              </>
            ) : isExpired && !isTargetMet ? (
              <>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Funding Expired: 100% Refunds Available</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Funding Goal Secured</span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {isPaidOut
              ? `The funding goal was met before the deadline. All collected ${tokenConfig.symbol} tokens were released directly to the verified recipient.`
              : isExpired && !isTargetMet
              ? `The pool deadline passed without meeting the ${targetFormatted} ${tokenConfig.symbol} target. Under the smart contract rules, 100% of deposits are held safely for contributors to withdraw.`
              : `The target goal has been reached and funds are secured in the smart contract ready for payout.`}
          </p>
        </div>

        {/* Financial Breakdown Table */}
        <div className="p-4 rounded-2xl bg-[#0b0e17] border border-[#1e2333] space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#181d2e]">
            <span className="text-gray-400 font-medium">Pool Title:</span>
            <span className="text-white font-bold">{pool.title}</span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#181d2e]">
            <span className="text-gray-400 font-medium">Currency Token:</span>
            <span className="font-mono text-white font-semibold">
              {tokenConfig.name} ({tokenConfig.symbol})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#181d2e]">
            <span className="text-gray-400 font-medium">Target Funding Goal:</span>
            <span className="font-mono text-white font-semibold">
              {targetFormatted} {tokenConfig.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#181d2e]">
            <span className="text-gray-400 font-medium">Total Contributed:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {contributedFormatted} {tokenConfig.symbol}
            </span>
          </div>

          {surplusWei > 0n && (
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#181d2e]">
              <span className="text-indigo-300 font-medium">Stretch Goal Surplus:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                +{surplusFormatted} {tokenConfig.symbol} (Released to Recipient)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#181d2e]">
            <span className="text-gray-400 font-medium">Total Backers:</span>
            <span className="text-white font-semibold">{pool.contributors.length} verified wallets</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium">Designated Recipient:</span>
            <a
              href={getExplorerAddressUrl(pool.recipient)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>{shortenAddress(pool.recipient, 6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Verification & Transaction Proof */}
        <div className="p-3.5 rounded-xl bg-[#090b10] border border-[#1b2030] text-[11px] space-y-2 mb-5">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>On-Chain Verification & Proof</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 uppercase font-mono tracking-wider">Smart Contract:</span>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESSES.collectivePool)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>{shortenAddress(CONTRACT_ADDRESSES.collectivePool, 6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 uppercase font-mono tracking-wider">Settlement Network:</span>
            <span className="text-gray-300 font-mono">Monad Testnet (Chain ID 10143)</span>
          </div>

          {payoutTxHash && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 uppercase font-mono tracking-wider">Payout Tx Hash:</span>
              <a
                href={getExplorerTxUrl(payoutTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{shortenTxHash(payoutTxHash)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {isExpired && !isTargetMet && (
            <div className="pt-2 border-t border-[#171b26] text-gray-400">
              <span className="text-gray-300 font-semibold">Refund Accounting Truth: </span>
              {pool.remainingHeld !== undefined && pool.remainingHeld === 0n ? (
                <span>All contributors have claimed and withdrawn their 100% refunds from the contract.</span>
              ) : (
                <span>
                  Refunds are claimed individually by each backer. Approximately {formatTokenAmount(pool.remainingHeld, tokenConfig.decimals)} {tokenConfig.symbol} remains unclaimed in contract escrow.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Receipt Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1e2333]">
          <button
            onClick={handleCopyReceipt}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#161a26] hover:bg-[#202538] text-gray-200 border border-[#23283c] transition flex items-center justify-center gap-1.5"
          >
            {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReceipt ? 'Receipt Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Receipt Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
