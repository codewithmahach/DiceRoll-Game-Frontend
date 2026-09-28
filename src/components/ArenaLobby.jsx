import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import {
  PlusCircle,
  Flame,
  Coins,
  Users,
  Lock,
  ChevronRight,
  RefreshCw,
  Trophy,
  Wallet,
  Sparkles,
  Dices,
  Play,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  Swords,
  Eye,
  Zap,
  Filter
} from 'lucide-react';
import { ethers } from 'ethers';
import { API_BASE_URL } from '../config/api';

const STATUS_LABELS = {
  0: { label: "OPEN FOR DUEL", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]" },
  1: { label: "LOCKED", color: "bg-blue-500/20 text-blue-300 border-blue-500/50" },
  2: { label: "REVEAL PHASE", color: "bg-amber-500/20 text-gold border-gold/50 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]" },
  3: { label: "SECURING ROLL (VRF)", color: "bg-purple-500/20 text-purple-300 border-purple-500/50 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.35)]" },
  4: { label: "VICTORY READY", color: "bg-crimson/25 text-rose-300 border-crimson/50 shadow-[0_0_15px_rgba(225,29,72,0.3)]" },
  5: { label: "NO WINNER (REROLL)", color: "bg-orange-500/20 text-orange-300 border-orange-500/50" },
  6: { label: "SETTLED", color: "bg-gray-500/20 text-gray-400 border-gray-500/50" },
  7: { label: "CANCELLED", color: "bg-red-500/20 text-red-400 border-red-500/50" },
};

export default function ArenaLobby({ onSelectRound, onOpenCreateModal, onBackHome }) {
  const { account, connectWallet, isConnecting, diceContract, deploymentConfig } = useWeb3();
  const [activeTab, setActiveTab] = useState("ETH"); // "ETH" or "USDT"
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL", "OPEN", "ROLLING", "COMPLETED"
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSelectNumber, setQuickSelectNumber] = useState(4);

  const fetchRounds = async () => {
    try {
      setLoading(true);
      // Fetch from backend API or smart contract
      try {
        const res = await fetch(`${API_BASE_URL}/api/rounds?asset=${activeTab}`);
        const data = await res.json();
        if (data.success && data.rounds.length > 0) {
          setRounds(data.rounds);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to direct contract read
      }

      if (diceContract) {
        const nextId = await diceContract.nextRoundId();
        const loaded = [];
        const isTargetETH = activeTab === "ETH";

        // Read all existing rounds backwards
        for (let i = Number(nextId) - 1; i >= 1; i--) {
          const r = await diceContract.getRound(i);
          const isRoundETH = r.paymentToken === ethers.ZeroAddress;

          if (isRoundETH === isTargetETH) {
            loaded.push({
              roundId: Number(r.roundId),
              paymentToken: r.paymentToken,
              isETH: isRoundETH,
              entryAmount: r.entryAmount.toString(),
              minPlayers: Number(r.minPlayers),
              maxPlayers: Number(r.maxPlayers),
              playerCount: Number(r.playerCount),
              revealedCount: Number(r.revealedCount),
              totalDeposits: r.totalDeposits.toString(),
              state: Number(r.state),
              winningNumber: Number(r.winningNumber),
              winnerCount: Number(r.winnerCount),
              winnerReward: r.winnerReward.toString(),
              joinDeadline: Number(r.joinDeadline),
              revealDeadline: Number(r.revealDeadline)
            });
          }
        }
        setRounds(loaded);
      }
    } catch (e) {
      console.error("Error loading rounds:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
    const interval = setInterval(fetchRounds, 4000);
    return () => clearInterval(interval);
  }, [activeTab, diceContract]);

  // Find the first open round for quick-play
  const openRound = rounds.find((r) => r.state === 0);

  // Filtered rounds
  const filteredRounds = rounds.filter((r) => {
    if (statusFilter === "OPEN") return r.state === 0;
    if (statusFilter === "ROLLING") return r.state === 3 || r.state === 2;
    if (statusFilter === "COMPLETED") return r.state === 4 || r.state === 6;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Return to Home Bar */}
      {onBackHome && (
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBackHome}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-arena-surface/80 hover:bg-arena-surface border border-arena-border text-xs font-bold text-gray-300 hover:text-white transition shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-crimson-light group-hover:-translate-x-1 transition-transform" />
            <span>← Return to Home / 3-Step Guide</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-300">Live Web3 Battle Arena</span>
          </div>
        </div>
      )}

      {/* Header & Arena Currency Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-arena-border/50">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-crimson-light" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-gold font-bold">
              MULTIPLAYER ON-CHAIN DUELS
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-white flex items-center gap-2 mt-0.5">
            <span>DICE ARENA LOBBY</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Pick your isolated currency arena. ETH and USDT are completely segregated.
          </p>
        </div>

        {/* Tab Buttons & Create Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Arena Tabs */}
          <div className="flex p-1 rounded-2xl bg-arena-surface border border-arena-border shadow-inner">
            <button
              onClick={() => setActiveTab("ETH")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "ETH"
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-cyan-300" />
              <span>ETH Arena</span>
            </button>

            <button
              onClick={() => setActiveTab("USDT")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === "USDT"
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-300" />
              <span>USDT Arena</span>
            </button>
          </div>

          {/* Create Game Button */}
          <button
            onClick={() => onOpenCreateModal(activeTab)}
            className="crimson-gradient-btn px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5 shadow-[0_0_20px_rgba(225,29,72,0.4)] flex-shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create Game</span>
          </button>
        </div>
      </div>

      {/* FEATURED ACTIVE DUEL / QUICK PLAY COCKPIT */}
      {openRound ? (
        <div className="glass-panel-gamer p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/50 mb-12 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          {/* Top Gaming Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-arena-border/70">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
              </span>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  ● ACTIVE BATTLEGROUND — ARENA #{openRound.roundId}
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <span>Join Duel Arena ({openRound.isETH ? "ETH Game" : "USDT Game"})</span>
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-arena-surface border border-arena-border text-xs font-mono">
                <span className="text-gray-400">Fixed Entry: </span>
                <span className="font-bold text-white">
                  {openRound.isETH
                    ? `${ethers.formatEther(openRound.entryAmount)} ETH`
                    : `${ethers.formatUnits(openRound.entryAmount, 6)} USDT`}
                </span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-xs font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="text-emerald-300">Fighters: </span>
                <span className="font-bold text-emerald-400">
                  {openRound.playerCount} / {openRound.maxPlayers}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Player Slots Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Arena Fighter Squad (Min {openRound.minPlayers} to roll):</span>
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">
                {openRound.playerCount >= openRound.minPlayers
                  ? "✓ Minimum Players Reached"
                  : `Need ${openRound.minPlayers - openRound.playerCount} more player(s)`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {Array.from({ length: openRound.maxPlayers }).map((_, i) => {
                const isFilled = i < openRound.playerCount;
                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      isFilled
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-arena-surface/40 border-arena-border/60 text-gray-500 border-dashed"
                    }`}
                  >
                    <Users className={`w-4 h-4 mx-auto mb-1 ${isFilled ? "text-emerald-400" : "text-gray-600"}`} />
                    <span className="text-[11px] font-mono font-bold block">
                      {isFilled ? `Fighter ${i + 1}` : `Slot ${i + 1}`}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider block opacity-75 font-mono">
                      {isFilled ? "Ready" : "Waiting"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1: Select Dice Number */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Dices className="w-4 h-4 text-gold animate-bounce" />
                <span>CHOOSE YOUR LUCKY DICE NUMBER (1 – 6):</span>
              </label>
              <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-gold" />
                <span>Hashed secretly via client salt until reveal</span>
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const isSelected = quickSelectNumber === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuickSelectNumber(num)}
                    className={`py-4 sm:py-5 rounded-2xl font-heading text-2xl sm:text-3xl font-black border transition-all duration-200 transform ${
                      isSelected
                        ? "bg-gradient-to-br from-crimson via-rose-600 to-rose-700 text-white border-crimson shadow-[0_0_25px_rgba(225,29,72,0.7)] scale-105"
                        : "bg-arena-surface/80 border-arena-border text-gray-300 hover:border-gold/50 hover:text-white hover:scale-102"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="crimson-gradient-btn w-full sm:flex-1 py-4.5 rounded-2xl font-heading font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(225,29,72,0.6)] hover:scale-[1.01] transition-transform"
              >
                <Wallet className="w-5 h-5" />
                <span>{isConnecting ? "Connecting MetaMask..." : "Connect MetaMask to Join Duel"}</span>
              </button>
            ) : (
              <button
                onClick={() => onSelectRound(openRound.roundId, quickSelectNumber)}
                className="crimson-gradient-btn w-full sm:flex-1 py-4.5 rounded-2xl font-heading font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(225,29,72,0.6)] hover:scale-[1.01] transition-transform"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  Lock Number #{quickSelectNumber} & Enter Round #{openRound.roundId} (
                  {openRound.isETH
                    ? `${ethers.formatEther(openRound.entryAmount)} ETH`
                    : `${ethers.formatUnits(openRound.entryAmount, 6)} USDT`}
                  ) ➜
                </span>
              </button>
            )}

            {account && openRound.playerCount >= openRound.minPlayers && (
              <button
                type="button"
                onClick={() => onSelectRound(openRound.roundId, quickSelectNumber)}
                className="w-full sm:w-auto px-6 py-4.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] transition"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START MATCH ({openRound.playerCount} READY) ➜</span>
              </button>
            )}

            <button
              onClick={() => onOpenCreateModal(activeTab)}
              className="w-full sm:w-auto px-6 py-4.5 rounded-2xl bg-arena-surface hover:bg-arena-hover border border-arena-border text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Custom Arena</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel-gamer p-8 rounded-3xl border border-arena-border text-center mb-12">
          <Dices className="w-14 h-14 text-gold mx-auto mb-3 opacity-80" />
          <h3 className="font-heading text-xl font-bold text-white mb-2">
            No Open Rounds in {activeTab} Arena Currently
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Active duels are currently securing on-chain rolls via Chainlink VRF. You can open a new duel right now!
          </p>
          <button
            onClick={() => onOpenCreateModal(activeTab)}
            className="crimson-gradient-btn px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-white inline-flex items-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.5)]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New {activeTab} Game</span>
          </button>
        </div>
      )}

      {/* GAMER BATTLEGROUNDS HUD (POINT 2: All ETH Arenas Redesign) */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-arena-border/70">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                CYBERPUNK DUEL GRID
              </span>
            </div>
            <h3 className="font-heading text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>All {activeTab} Battlegrounds</span>
              <span className="text-xs font-mono text-gray-400 font-normal">
                ({filteredRounds.length} Active Matches)
              </span>
            </h3>
          </div>

          {/* Gamer Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Matches" },
              { id: "OPEN", label: "🟢 Open" },
              { id: "ROLLING", label: "🎲 Reveals & Rolling" },
              { id: "COMPLETED", label: "🏆 Results" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition font-mono ${
                  statusFilter === f.id
                    ? "bg-gold/20 text-gold border border-gold/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : "bg-arena-surface border border-arena-border text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={fetchRounds}
              className="p-2 rounded-xl bg-arena-surface hover:bg-arena-hover border border-arena-border text-gray-400 hover:text-white transition ml-1"
              title="Refresh battlegrounds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-crimson" : ""}`} />
            </button>
          </div>
        </div>

        {/* Gamer Battle Cards Grid */}
        {loading && rounds.length === 0 ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-crimson animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-mono">Syncing {activeTab} Battlegrounds...</p>
          </div>
        ) : filteredRounds.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-3xl border border-arena-border p-8">
            <p className="text-sm text-gray-400 font-mono">No matches found matching filter: {statusFilter}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRounds.map((round) => {
              const statusInfo = STATUS_LABELS[round.state] || STATUS_LABELS[0];
              const isETH = round.isETH;
              const entryFormatted = isETH
                ? `${ethers.formatEther(round.entryAmount)} ETH`
                : `${ethers.formatUnits(round.entryAmount, 6)} USDT`;
              const poolFormatted = isETH
                ? `${ethers.formatEther(round.totalDeposits)} ETH`
                : `${ethers.formatUnits(round.totalDeposits, 6)} USDT`;

              return (
                <div
                  key={round.roundId}
                  onClick={() => onSelectRound(round.roundId, quickSelectNumber)}
                  className={`glass-panel-gamer p-6 rounded-3xl border cursor-pointer group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden shadow-card-glow ${
                    round.state === 0
                      ? "border-emerald-500/50 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                      : round.state === 3
                      ? "border-purple-500/50 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]"
                      : "border-arena-border hover:border-gold/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                  }`}
                >
                  {/* Gamer Header: Arena Match Tag & Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-base font-black text-white">
                        ARENA #{round.roundId}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-arena-surface border border-arena-border text-gray-400">
                        {isETH ? "ETH" : "USDT"}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Holographic Stake & Pool HUD */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-arena-surface/80 border border-arena-border mb-4">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block font-mono">
                        Fixed Stake
                      </span>
                      <span className="font-mono text-sm font-bold text-white flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{entryFormatted}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block font-mono">
                        Bounty Pool
                      </span>
                      <span className="font-mono text-sm font-bold text-gold flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-gold" />
                        <span>{poolFormatted}</span>
                      </span>
                    </div>
                  </div>

                  {/* Player Squad Indicators */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5 font-mono">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Fighters Joined</span>
                      </span>
                      <span className="font-bold text-white font-mono">
                        {round.playerCount} / {round.maxPlayers}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-arena-surface h-2 rounded-full overflow-hidden border border-arena-border/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          round.state === 0
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_#10b981]"
                            : round.state === 3
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_#a855f7]"
                            : "bg-gradient-to-r from-crimson to-gold"
                        }`}
                        style={{ width: `${Math.min(100, (round.playerCount / round.maxPlayers) * 100)}%` }}
                      />
                    </div>

                    {/* Mini Gamer Callout */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 font-mono">
                      {round.state === 0 ? (
                        <span className="text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Accepting Selections</span>
                        </span>
                      ) : (round.state === 1 || round.state === 2) ? (
                        <span className="text-amber-300 flex items-center gap-1 font-bold">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>Reveal Phase ({round.revealedCount || 0}/{round.playerCount} Revealed)</span>
                        </span>
                      ) : round.state === 3 ? (
                        <span className="text-purple-300 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                          <span>VRF Roll In Progress</span>
                        </span>
                      ) : round.state === 4 ? (
                        <span className="text-gold flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-gold" />
                          <span>Winning Dice: #{round.winningNumber}</span>
                        </span>
                      ) : round.state === 5 ? (
                        <span className="text-blue-400 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-blue-400" />
                          <span>No Winner (Reroll Ready)</span>
                        </span>
                      ) : round.state === 6 ? (
                        <span className="text-gray-400 flex items-center gap-1">
                          <span>Match Settled & Claimed</span>
                        </span>
                      ) : (
                        <span className="text-red-400">Match Cancelled</span>
                      )}

                      <span className="text-gray-500 text-[10px]">Provably Fair</span>
                    </div>
                  </div>

                  {/* High-Impact Gamer Action Button */}
                  <div className="pt-2">
                    {round.state === 0 ? (
                      round.playerCount >= round.minPlayers ? (
                        <button className="w-full py-3 rounded-xl font-heading text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 transition-all">
                          <Play className="w-4 h-4 fill-current" />
                          <span>🚀 START GAME ({round.playerCount} FIGHTERS READY) ➜</span>
                        </button>
                      ) : (
                        <button className="w-full py-3 rounded-xl font-heading text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all">
                          <Swords className="w-4 h-4" />
                          <span>LOCK & JOIN DUEL ({entryFormatted}) ➜</span>
                        </button>
                      )
                    ) : (round.state === 1 || round.state === 2) ? (
                      <button className="w-full py-3 rounded-xl font-heading text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all">
                        <Lock className="w-4 h-4" />
                        <span>🔓 REVEAL & DISPATCH 3D ROLL ➜</span>
                      </button>
                    ) : round.state === 3 ? (
                      <button className="w-full py-3 rounded-xl font-heading text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-violet-500 shadow-[0_0_20px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 transition-all">
                        <Eye className="w-4 h-4" />
                        <span>SPECTATE 3D VRF ROLL ➜</span>
                      </button>
                    ) : round.state === 4 ? (
                      <button className="w-full py-3 rounded-xl font-heading text-xs font-black uppercase tracking-wider text-black bg-gradient-to-r from-yellow-400 via-amber-400 to-gold hover:from-yellow-300 hover:to-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all font-bold">
                        <Trophy className="w-4 h-4" />
                        <span>VIEW WINNER & CLAIM BOUNTY ➜</span>
                      </button>
                    ) : (
                      <button className="w-full py-3 rounded-xl font-heading text-xs font-bold uppercase tracking-wider text-gray-300 bg-arena-surface hover:bg-arena-hover border border-arena-border flex items-center justify-center gap-2 transition-all">
                        <span>VIEW ARENA ➜</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
