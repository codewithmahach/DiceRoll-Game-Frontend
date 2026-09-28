import React from 'react';
import { Lock, Eye, Award, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Commit & Stake",
      subtitle: "Cryptographic Concealment",
      description: "Pick your arena (ETH or USDT), choose a stake, and select your dice number (1–6). Your choice is hashed with a private salt locally so no opponent or mempool watcher can front-run your strategy.",
      icon: Lock,
      accent: "from-rose-500/20 to-crimson/10",
      border: "border-crimson/30",
      iconColor: "text-crimson-light",
    },
    {
      num: "02",
      title: "Reveal & Roll",
      subtitle: "Verifiable Randomness",
      description: "When the round locks, submit your reveal. The smart contract validates your commitment hash. Chainlink VRF generates a provably fair, unbiasable on-chain roll—immune to operator influence.",
      icon: Eye,
      accent: "from-amber-500/20 to-gold/10",
      border: "border-gold/30",
      iconColor: "text-gold",
    },
    {
      num: "03",
      title: "Settle & Claim",
      subtitle: "Equal Distribution",
      description: "If your number hits, you win! Multiple winners split the distributable prize pool equally. Safe remainder accounting guarantees zero fund loss. Claim your payout directly to your wallet in one click.",
      icon: Award,
      accent: "from-emerald-500/20 to-teal-500/10",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
    }
  ];

  return (
    <section className="py-14 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/10 border border-crimson/30 text-crimson-light text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Provably Fair Mechanics</span>
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-black text-white">
          Simple 3-Step Play
        </h2>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto mt-2">
          Pure decentralized multiplayer dice duels. No house bias, no strategic front-running, and complete wallet autonomy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className={`glass-panel p-6 rounded-2xl border ${step.border} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${step.accent} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />
              
              <div className="flex items-center justify-between mb-5">
                <span className="font-heading text-3xl font-black text-white/30 group-hover:text-white/60 transition-colors">
                  {step.num}
                </span>
                <div className={`p-3 rounded-xl bg-arena-surface border border-arena-border ${step.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {step.subtitle}
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {step.description}
              </p>

              <div className="mt-4 pt-3 border-t border-arena-border/50 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold" />
                  <span>On-Chain Enforcement</span>
                </span>
                <span className="font-mono text-[11px] text-gray-500">100% Auditable</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
