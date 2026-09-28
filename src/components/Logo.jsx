import React from "react";

export default function Logo({ size = "md", showText = true }) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  return (
    <div className="flex items-center gap-3 cursor-pointer group">
      <div className={`relative ${sizeMap[size] || sizeMap.md} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        {/* Glowing backdrop halo */}
        <div className="absolute inset-0 bg-crimson/30 rounded-xl blur-md group-hover:bg-gold/40 transition-colors duration-500" />
        
        {/* Custom Vector Icon */}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_4px_12px_rgba(225,29,72,0.4)]">
          <defs>
            <linearGradient id="logoTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="logoLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="logoRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>
            <linearGradient id="goldCrown" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Isometric Dice Base */}
          <polygon points="50,16 82,32 50,48 18,32" fill="url(#logoTop)" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="18,32 50,48 50,82 18,66" fill="url(#logoLeft)" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="50,48 82,32 82,66 50,82" fill="url(#logoRight)" stroke="#f59e0b" strokeWidth="1.5" />

          {/* Golden Crown on top edge */}
          <path d="M38 18 L50 8 L62 18 L58 24 L42 24 Z" fill="url(#goldCrown)" stroke="#fff" strokeWidth="0.5" />

          {/* Pips with Gold Gradients */}
          {/* Top Pip */}
          <circle cx="50" cy="32" r="3.5" fill="#fde047" stroke="#fff" strokeWidth="0.5" />

          {/* Left Pips */}
          <circle cx="32" cy="46" r="2.8" fill="#fde047" />
          <circle cx="38" cy="65" r="2.8" fill="#fde047" />

          {/* Right Pips */}
          <circle cx="62" cy="65" r="2.8" fill="#fde047" />
          <circle cx="68" cy="54" r="2.8" fill="#fde047" />
          <circle cx="74" cy="43" r="2.8" fill="#fde047" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-heading text-xl font-black tracking-wider text-white">
              DICE<span className="text-crimson-light">CLASH</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/40 tracking-wider">
              PROVABLY FAIR
            </span>
          </div>
          <span className="text-[10px] text-gray-400 tracking-widest font-semibold uppercase mt-1">
            Multiplayer Web3 Arena
          </span>
        </div>
      )}
    </div>
  );
}
