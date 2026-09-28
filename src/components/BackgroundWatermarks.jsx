import React from 'react';

export default function BackgroundWatermarks() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Cyber Game Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e11d48 1px, transparent 1px),
            linear-gradient(to bottom, #f59e0b 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* 2. Vivid Ambient Neon Radial Glows */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-crimson/25 via-rose-600/10 to-transparent rounded-full blur-[140px]" />
      <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-gradient-to-bl from-gold/20 via-amber-500/10 to-transparent rounded-full blur-[140px]" />
      <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-[130px]" />
      <div className="absolute top-2/3 left-1/3 w-[450px] h-[450px] bg-gradient-to-r from-purple-600/15 via-pink-600/10 to-transparent rounded-full blur-[150px]" />

      {/* 3. Floating 3D Wireframe Dice Watermark - Top Left */}
      <svg
        className="absolute -top-12 -left-12 w-96 h-96 opacity-[0.07] text-crimson animate-pulse"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ animationDuration: '8s' }}
      >
        {/* Isometric Cube Outline */}
        <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" />
        <line x1="100" y1="20" x2="100" y2="100" />
        <line x1="170" y1="60" x2="100" y2="100" />
        <line x1="30" y1="60" x2="100" y2="100" />
        <line x1="100" y1="100" x2="100" y2="180" />
        {/* Top Face Pips */}
        <circle cx="100" cy="60" r="4" fill="currentColor" />
        {/* Right Face Pips */}
        <circle cx="130" cy="110" r="4" fill="currentColor" />
        <circle cx="150" cy="90" r="4" fill="currentColor" />
        {/* Left Face Pips */}
        <circle cx="55" cy="90" r="4" fill="currentColor" />
        <circle cx="70" cy="115" r="4" fill="currentColor" />
        <circle cx="85" cy="140" r="4" fill="currentColor" />
      </svg>

      {/* 4. Floating 3D Wireframe Dice Watermark - Bottom Right */}
      <svg
        className="absolute -bottom-16 -right-16 w-[450px] h-[450px] opacity-[0.06] text-gold animate-pulse"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ animationDuration: '10s' }}
      >
        <polygon points="100,25 175,68 175,152 100,195 25,152 25,68" />
        <line x1="100" y1="25" x2="100" y2="110" />
        <line x1="175" y1="68" x2="100" y2="110" />
        <line x1="25" y1="68" x2="100" y2="110" />
        <line x1="100" y1="110" x2="100" y2="195" />
        {/* Pips */}
        <circle cx="75" cy="55" r="4" fill="currentColor" />
        <circle cx="125" cy="80" r="4" fill="currentColor" />
        <circle cx="140" cy="135" r="4" fill="currentColor" />
        <circle cx="60" cy="135" r="4" fill="currentColor" />
        <circle cx="100" cy="110" r="5" fill="currentColor" />
      </svg>

      {/* 5. Translucent Dice Symbols In Background */}
      <div className="absolute top-1/4 left-10 text-8xl font-black text-rose-500/[0.04] select-none rotate-12">
        ⚅
      </div>
      <div className="absolute top-2/3 right-16 text-9xl font-black text-amber-500/[0.04] select-none -rotate-12">
        ⚂
      </div>
      <div className="absolute bottom-20 left-1/4 text-8xl font-black text-cyan-400/[0.03] select-none rotate-45">
        ⚃
      </div>
      <div className="absolute top-16 right-1/3 text-7xl font-black text-purple-400/[0.03] select-none -rotate-6">
        ⚄
      </div>
    </div>
  );
}
