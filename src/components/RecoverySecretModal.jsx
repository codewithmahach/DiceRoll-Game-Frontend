import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, Lock, X } from 'lucide-react';

export default function RecoverySecretModal({ isOpen, onClose, secretData, roundId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !secretData) return null;

  const handleCopy = () => {
    const backupText = JSON.stringify({
      roundId,
      player: secretData.player,
      selectedNumber: secretData.selectedNumber,
      secretSalt: secretData.secretSalt,
      commitment: secretData.commitment
    }, null, 2);

    navigator.clipboard.writeText(backupText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-gold/40 shadow-card-glow relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-gold mb-4">
          <div className="p-3 rounded-2xl bg-gold/10 border border-gold/30">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-white">Backup Secret Salt</h3>
            <p className="text-xs text-gold">Commitment Cryptographic Proof</p>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3.5 rounded-xl bg-crimson/10 border border-crimson/30 flex items-start gap-2.5 mb-5">
          <ShieldAlert className="w-5 h-5 text-crimson-light flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300 space-y-1">
            <p className="font-bold text-crimson-light">
              CRITICAL: Failure to reveal before the deadline forfeits your entry!
            </p>
            <p>
              Your selected number (<strong>{secretData.selectedNumber}</strong>) is currently stored in your local browser cache. If you clear cookies, switch devices, or close private tabs, you must restore this secret to reveal.
            </p>
          </div>
        </div>

        {/* Key Values */}
        <div className="space-y-3 mb-5 text-xs font-mono">
          <div className="p-3 rounded-xl bg-arena-surface border border-arena-border">
            <span className="text-gray-400 block text-[10px] uppercase font-sans mb-1">Round ID</span>
            <span className="text-white font-bold">Round #{roundId}</span>
          </div>

          <div className="p-3 rounded-xl bg-arena-surface border border-arena-border">
            <span className="text-gray-400 block text-[10px] uppercase font-sans mb-1">Selected Dice Number</span>
            <span className="text-gold font-bold text-sm">Dice #{secretData.selectedNumber}</span>
          </div>

          <div className="p-3 rounded-xl bg-arena-surface border border-arena-border overflow-hidden">
            <span className="text-gray-400 block text-[10px] uppercase font-sans mb-1">Secret Salt (32 Bytes)</span>
            <span className="text-gray-300 break-all">{secretData.secretSalt}</span>
          </div>

          <div className="p-3 rounded-xl bg-arena-surface border border-arena-border overflow-hidden">
            <span className="text-gray-400 block text-[10px] uppercase font-sans mb-1">On-Chain Commitment Hash</span>
            <span className="text-emerald-400 break-all">{secretData.commitment}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-xl bg-arena-hover hover:bg-arena-border border border-arena-border text-white text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied to Clipboard!" : "Copy Secret Backup"}</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 gold-gradient-btn py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            I Have Saved It
          </button>
        </div>
      </div>
    </div>
  );
}
