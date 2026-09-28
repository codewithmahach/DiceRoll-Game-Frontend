import React from 'react';
import Dice3D from './Dice3D';
import { ArrowRight, ShieldCheck, Zap, Coins, Users } from 'lucide-react';

export default function Hero({ onEnterArena, activeRoundsCount = 2, totalPrizePool = "1.5 ETH" }) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 px-4">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-crimson/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
        
        {/* Provably Fair Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-arena-surface/80 border border-gold/40 text-gold text-xs font-bold tracking-widest uppercase mb-6 shadow-gold-glow">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <span>Provably Fair • Player Powered</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-tight sm:leading-none">
          ROLL THE <span className="text-crimson-light drop-shadow-[0_0_35px_rgba(225,29,72,0.6)]">DICE</span>.
          <br />
          WIN THE <span className="text-gold drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]">ARENA</span>.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-gray-300 text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
          Experience the highest-stakes decentralized multiplayer dice battles.
          Commit hidden selections, verify unbiasable VRF rolls, and split transparent reward pools.
          <strong className="text-white block mt-1">Your funds. Your control. Zero house edge manipulation.</strong>
        </p>

        {/* 3D Dice Showcase Centerpiece */}
        <div className="my-6 relative group flex flex-col items-center">
          <Dice3D result={4} isRolling={false} size="lg" showcase={true} interactive={true} />
          <div className="text-[11px] font-mono text-gold uppercase tracking-widest mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Interactive Verifiable VRF Settlement Cube</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono mt-0.5 opacity-75">
            (Click dice to test 3D spin)
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-3 w-full sm:w-auto">
          <button
            onClick={onEnterArena}
            className="crimson-gradient-btn w-full sm:w-auto px-10 py-4.5 rounded-2xl font-heading text-lg font-black text-white uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(225,29,72,0.6)] hover:scale-105 transition-all"
          >
            <span>ENTER DICE ARENA</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Live Features Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 w-full max-w-4xl">
          <div className="glass-panel p-4 rounded-2xl border border-arena-border text-center">
            <ShieldCheck className="w-5 h-5 text-crimson-light mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">Commit-Reveal</span>
            <span className="text-[11px] text-gray-400">Zero front-running</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-arena-border text-center">
            <Zap className="w-5 h-5 text-gold mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">Chainlink VRF</span>
            <span className="text-[11px] text-gray-400">Verifiable randomness</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-arena-border text-center">
            <Coins className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">Dual Isolation</span>
            <span className="text-[11px] text-gray-400">ETH & USDT Arenas</span>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-arena-border text-center">
            <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">Equal Distribution</span>
            <span className="text-[11px] text-gray-400">Claim-based payouts</span>
          </div>
        </div>

      </div>
    </section>
  );
}
