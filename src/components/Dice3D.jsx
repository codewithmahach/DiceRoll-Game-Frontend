import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function Dice3D({
  result = null,
  isRolling = false,
  size = "md",
  showcase = false,
  interactive = false
}) {
  const [displayResult, setDisplayResult] = useState(result || 4);
  const [localRolling, setLocalRolling] = useState(false);

  useEffect(() => {
    if (result && result >= 1 && result <= 6) {
      setDisplayResult(result);
    }
  }, [result]);

  const handleInteractiveRoll = () => {
    if (!interactive || isRolling || localRolling) return;
    setLocalRolling(true);
    setTimeout(() => {
      const randomNum = Math.floor(Math.random() * 6) + 1;
      setDisplayResult(randomNum);
      setLocalRolling(false);
    }, 1200);
  };

  const sizeScales = {
    sm: "scale-75",
    md: "scale-100",
    lg: "scale-110 sm:scale-125 md:scale-140",
    xl: "scale-125 sm:scale-150 md:scale-175"
  };

  const rollingNow = isRolling || localRolling;

  // Determine active cube class
  let cubeClass = "";
  if (rollingNow) {
    cubeClass = "rolling-active";
  } else if (showcase) {
    cubeClass = "dice-showcase-spin";
  } else {
    cubeClass = `show-${displayResult} dice-floating-idle`;
  }

  return (
    <div
      className={`dice-scene relative flex flex-col items-center justify-center p-6 ${sizeScales[size] || sizeScales.md} ${
        interactive ? "cursor-pointer group" : ""
      }`}
      onClick={handleInteractiveRoll}
      title={interactive ? "Click to roll the 3D dice!" : undefined}
    >
      {/* 1. Neon Radial Ambient Glow Aura Behind Cube */}
      <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-crimson/40 via-gold/30 to-purple-600/25 blur-3xl pointer-events-none transform -translate-y-4 group-hover:scale-125 transition-transform duration-500" />

      {/* 2. The 3D Cube */}
      <div className={`dice-cube ${cubeClass}`}>
        
        {/* Face 1: 1 Pip Center */}
        <div className="dice-face dice-face-1">
          <div className="pip shadow-[0_0_15px_rgba(245,158,11,1)]" />
        </div>

        {/* Face 2: 2 Pips Diagonal */}
        <div className="dice-face dice-face-2 flex flex-col justify-between p-4">
          <div className="self-start pip" />
          <div className="self-end pip" />
        </div>

        {/* Face 3: 3 Pips Diagonal */}
        <div className="dice-face dice-face-3 flex flex-col justify-between p-4">
          <div className="self-start pip" />
          <div className="self-center pip" />
          <div className="self-end pip" />
        </div>

        {/* Face 4: 4 Pips Corners */}
        <div className="dice-face dice-face-4 flex flex-col justify-between p-4">
          <div className="flex justify-between">
            <div className="pip" />
            <div className="pip" />
          </div>
          <div className="flex justify-between">
            <div className="pip" />
            <div className="pip" />
          </div>
        </div>

        {/* Face 5: 4 Corners + 1 Center */}
        <div className="dice-face dice-face-5 flex flex-col justify-between p-4">
          <div className="flex justify-between">
            <div className="pip" />
            <div className="pip" />
          </div>
          <div className="self-center pip" />
          <div className="flex justify-between">
            <div className="pip" />
            <div className="pip" />
          </div>
        </div>

        {/* Face 6: 6 Pips (2 columns of 3) */}
        <div className="dice-face dice-face-6 flex justify-between p-4">
          <div className="flex flex-col justify-between">
            <div className="pip" />
            <div className="pip" />
            <div className="pip" />
          </div>
          <div className="flex flex-col justify-between">
            <div className="pip" />
            <div className="pip" />
            <div className="pip" />
          </div>
        </div>

      </div>

      {/* 3. 3D Floor Shadow */}
      <div className="dice-floor-shadow" />

      {/* Interactive Helper Text */}
      {interactive && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-mono font-bold text-gold uppercase tracking-widest mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold animate-spin" />
          <span>Click To Test Roll</span>
        </div>
      )}
    </div>
  );
}
