import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, MessageCircle, Send, Twitter, AlertTriangle, ExternalLink, QrCode } from 'lucide-react';
import { PoolData } from '../types';
import { playCopyChime } from '../utils/audioFeedback';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolData | null;
  tokenSymbol?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  pool,
  tokenSymbol = 'mUSD',
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  // Compute canonical dynamic share URL
  const shareUrl = useMemo(() => {
    if (!pool || typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?pool=${pool.id}`;
  }, [pool]);

  const isLocalhost = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }, []);

  const inviteMessage = useMemo(() => {
    if (!pool) return '';
    return `Join my COLLECTIVE pool: "${pool.title}". Check the funding goal, deadline, recipient and refund rules before contributing: ${shareUrl}`;
  }, [pool, shareUrl]);

  // Generate QR code safely when modal opens or URL changes
  useEffect(() => {
    if (!isOpen || !shareUrl) {
      setQrDataUrl(null);
      setQrError(false);
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(shareUrl, {
      margin: 2,
      width: 220,
      color: {
        dark: '#05070d',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setQrError(false);
        }
      })
      .catch((err) => {
        console.warn('QR Code generation failed:', err);
        if (isMounted) setQrError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, shareUrl]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pool) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      playCopyChime();
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedLink(true);
      playCopyChime();
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopiedInvite(true);
      playCopyChime();
      setTimeout(() => setCopiedInvite(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = inviteMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedInvite(true);
      playCopyChime();
      setTimeout(() => setCopiedInvite(false), 2200);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Join my COLLECTIVE pool: "${pool.title}"`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleXShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(inviteMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-pool-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg p-6 bg-[#10131c] border border-indigo-900/40 rounded-3xl shadow-2xl shadow-indigo-950/60 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close share dialog"
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                Pool #{pool.id}
              </span>
              <h3 id="share-pool-title" className="text-lg font-bold text-white tracking-tight">
                Share & Invite Contributors
              </h3>
            </div>
            <p className="text-xs text-indigo-300/80 truncate max-w-xs">{pool.title}</p>
          </div>
        </div>

        {/* Localhost Warning Notice */}
        {isLocalhost && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-start space-x-2.5 text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Local Host Warning:</strong> This invite link uses <code>localhost</code> and will only resolve on this computer unless deployed to a public URL.
            </span>
          </div>
        )}

        {/* QR Code Section */}
        <div className="mb-5 flex flex-col items-center p-4 rounded-2xl bg-[#0a0d14] border border-[#1b2131]">
          {qrDataUrl && !qrError ? (
            <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-indigo-500/20">
              <img
                src={qrDataUrl}
                alt={`QR code for pool ${pool.id}`}
                className="w-44 h-44 object-contain rounded-lg"
              />
            </div>
          ) : qrError ? (
            <div className="h-44 flex flex-col items-center justify-center text-gray-500 text-xs space-y-2">
              <QrCode className="w-8 h-8 text-gray-600" />
              <span>QR preview unavailable. Use direct link below.</span>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-500 text-xs">
              <span>Generating QR code...</span>
            </div>
          )}
          <p className="text-[11px] text-gray-400 mt-2.5 font-medium">
            Scan with mobile camera to view pool on Monad Testnet
          </p>
        </div>

        {/* Direct Link Box */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Direct Pool Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                aria-label="Direct share URL"
                className="w-full px-3 py-2 rounded-xl bg-[#0d1017] border border-gray-700/80 font-mono text-xs text-indigo-300 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 transition-colors flex-shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              One-Click Social & Messaging Share
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="p-2.5 rounded-xl bg-[#0e161c] hover:bg-[#13222d] border border-emerald-900/40 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleTelegramShare}
                className="p-2.5 rounded-xl bg-[#0e1422] hover:bg-[#121c32] border border-sky-900/40 text-sky-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleXShare}
                className="p-2.5 rounded-xl bg-[#14151b] hover:bg-[#1c1d26] border border-gray-800 text-gray-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Twitter className="w-3.5 h-3.5 text-white" />
                <span>X (Twitter)</span>
              </button>
            </div>
          </div>

          {/* Formatted Invite Message */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Full Invite Message
              </span>
              <button
                onClick={handleCopyInvite}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-medium"
              >
                {copiedInvite ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedInvite ? 'Copied Message' : 'Copy Message'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-[#0d1017] border border-[#1b2131] text-xs text-gray-300 leading-relaxed font-sans">
              "{inviteMessage}"
            </div>
          </div>
        </div>

        {/* Safety Disclaimer */}
        <div className="p-3 rounded-xl bg-[#0a0d14] border border-[#181d2a] text-[11px] text-gray-400 leading-relaxed">
          <strong>Protocol Rule:</strong> Contributing sends test {tokenSymbol} into non-custodial smart contract escrow on Monad Testnet. Contributed funds disburse to the recipient if the target is met, or become individually pull-refundable by original contributing wallets if the pool expires below target.
        </div>
      </div>
    </div>
  );
};
