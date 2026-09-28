import React from 'react';
import { Percent, Flame, Coins, ShieldAlert, ArrowRight } from 'lucide-react';

export default function FeeTransparency({ onEnterArena }) {
  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <div className="glass-panel-gold rounded-3xl p-6 lg:p-10 border border-gold/30 relative overflow-hidden">
        {/* Decorative corner tag */}
        <div className="absolute top-0 right-0 bg-gold text-arena-bg font-extrabold text-[10px] tracking-widest px-8 py-1 rotate-45 translate-x-7 translate-y-3 uppercase shadow-md">
          Audited Model
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Explanation */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider">
              <Percent className="w-3.5 h-3.5" />
              <span>Transparent Protocol Economics</span>
            </div>

            <h2 className="font-heading text-2xl lg:text-3xl font-black text-white">
              Zero Hidden Costs. Complete Fee Clarity.
            </h2>

            <p className="text-gray-300 text-sm leading-relaxed">
              Unlike traditional online casinos that hide massive house edges in algorithm opacity, DiceClash operates with an immutable on-chain fee structure.
            </p>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-arena-surface/80 border border-arena-border">
                <div className="flex items-center gap-2 text-crimson-light font-bold text-xs uppercase mb-1">
                  <Flame className="w-4 h-4" />
                  <span>Blockchain Gas (Validators)</span>
                </div>
                <p className="text-xs text-gray-400">
                  Network computation cost paid strictly to decentralized network validators. The protocol never touches or profits from gas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-arena-surface/80 border border-gold/30">
                <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase mb-1">
                  <Coins className="w-4 h-4" />
                  <span>Platform Fee (2.0% Flat)</span>
                </div>
                <p className="text-xs text-gray-400">
                  A minimal 2% (200 BPS) fee deducted only from total round deposits to sustain Chainlink VRF costs and treasury reserves. Capped at 10% max on-chain.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-arena-surface to-arena-card border border-gold/40 text-center relative shadow-card-glow">
            <span className="text-xs font-bold text-gold uppercase tracking-widest mb-1">
              Genesis Protocol Rate
            </span>
            <div className="flex items-baseline gap-1 my-2">
              <span className="font-heading text-5xl font-black text-white">2.0%</span>
              <span className="text-sm font-semibold text-gray-400">Flat Fee</span>
            </div>
            <p className="text-xs text-gray-300 max-w-xs mb-6">
              98% of all player deposits form the distributable reward pool, split equally among matching winners.
            </p>

            <button
              onClick={onEnterArena}
              className="gold-gradient-btn w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <span>Enter Arena</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
