import React, { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import FeeTransparency from './components/FeeTransparency';
import ArenaLobby from './components/ArenaLobby';
import RoundView from './components/RoundView';
import Leaderboard from './components/Leaderboard';
import CreateRoundModal from './components/CreateRoundModal';
import BackgroundWatermarks from './components/BackgroundWatermarks';
import Logo from './components/Logo';
import { ShieldCheck, Swords, Dices } from 'lucide-react';

function AppContent() {
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const [initialDiceNumber, setInitialDiceNumber] = useState(4);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalAsset, setCreateModalAsset] = useState("ETH");
  const [inArenaView, setInArenaView] = useState(false);

  const handleEnterArena = (open = true) => {
    setInArenaView(open);
    if (!open) {
      setSelectedRoundId(null);
    }
  };

  const handleOpenCreate = (asset = "ETH") => {
    setCreateModalAsset(asset);
    setIsCreateModalOpen(true);
  };

  const handleSelectRound = (roundId, diceNumber = 4) => {
    if (diceNumber) setInitialDiceNumber(diceNumber);
    setSelectedRoundId(roundId);
  };

  const handleBackToLobby = () => {
    setSelectedRoundId(null);
    setInArenaView(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080c] text-gray-100 relative selection:bg-crimson selection:text-white">
      {/* Background Watermarks (Dice & Cyber Grid) */}
      <BackgroundWatermarks />

      {/* Navigation Header */}
      <Navbar onEnterArena={handleEnterArena} inArena={inArenaView || !!selectedRoundId} />

      <main className="flex-1 relative z-10">
        {selectedRoundId ? (
          /* View 1: Active Duel Arena / Round Screen */
          <RoundView
            roundId={selectedRoundId}
            initialNumber={initialDiceNumber}
            onBack={handleBackToLobby}
          />
        ) : inArenaView ? (
          /* View 2: Dedicated Multiplayer Arena Lobby */
          <ArenaLobby
            onSelectRound={handleSelectRound}
            onOpenCreateModal={handleOpenCreate}
            onBackHome={() => handleEnterArena(false)}
          />
        ) : (
          /* View 3: Front Page (Hero + Simple 3-Step Play + Protocol Details) */
          <>
            <Hero onEnterArena={() => handleEnterArena(true)} />
            
            {/* Simple 3-Step Play directly on front page */}
            <HowItWorks />

            {/* Fee Transparency */}
            <FeeTransparency onEnterArena={() => handleEnterArena(true)} />

            {/* Leaderboard */}
            <Leaderboard />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-arena-border py-10 px-4 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div onClick={() => handleEnterArena(false)} className="cursor-pointer">
            <Logo size="sm" />
          </div>
          
          <div className="text-xs text-gray-400 text-center sm:text-left font-mono">
            <span>© 2026 DiceClash Web3 Protocol. Provably fair on-chain multiplayer gaming.</span>
          </div>

          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Chainlink VRF v2.5 Verified</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Create Round Modal */}
      <CreateRoundModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultAsset={createModalAsset}
        onRoundCreated={() => {
          setIsCreateModalOpen(false);
          setInArenaView(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}
