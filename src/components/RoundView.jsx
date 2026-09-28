import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import Dice3D from './Dice3D';
import {
  ArrowLeft,
  Lock,
  Eye,
  Award,
  ShieldAlert,
  Coins,
  Flame,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Wallet,
  Play,
  Zap,
  Swords,
  Users,
  Dices,
  Trophy
} from 'lucide-react';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../config/api';

export default function RoundView({ roundId, onBack, initialNumber = null }) {
  const {
    account,
    connectWallet,
    isConnecting,
    diceContract,
    usdtContract,
    deploymentConfig,
    refreshBalances,
    usdtAllowance,
    usdtBalance,
    ethBalance,
    getStoredSecret,
    storeSecret,
    parseContractError
  } = useWeb3();

  const [round, setRound] = useState(null);
  const [playerEntry, setPlayerEntry] = useState(null);
  const [roundPlayers, setRoundPlayers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(
    initialNumber && initialNumber >= 1 && initialNumber <= 6 ? initialNumber : null
  );
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeSecretData, setActiveSecretData] = useState(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Automated progression guards
  const [autoLockTriggered, setAutoLockTriggered] = useState(false);
  const [autoRevealTriggered, setAutoRevealTriggered] = useState(false);
  const [autoRollTriggered, setAutoRollTriggered] = useState(false);
  const [autoClaimTriggered, setAutoClaimTriggered] = useState(false);

  // Ticker for timers
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Continuous live sync across all states (every 2.5s, fast 1.5s during VRF roll)
  useEffect(() => {
    if (roundId) {
      loadRound();
      const intervalMs = round?.state === 3 ? 1500 : 2500;
      const poll = setInterval(() => {
        loadRound();
      }, intervalMs);
      return () => clearInterval(poll);
    }
  }, [roundId, round?.state, account, diceContract]);

  // Instant refresh when wallet connects/changes
  useEffect(() => {
    if (account) {
      loadRound();
      refreshBalances();
    }
  }, [account]);

  // Confetti when user wins
  useEffect(() => {
    if (round?.state === 4 && playerEntry?.revealed && playerEntry.selectedNumber === round.winningNumber) {
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }
    }
  }, [round?.state, playerEntry?.revealed, playerEntry?.selectedNumber, round?.winningNumber]);

  // Fetch Round Data (Instant backend API + On-chain sync)
  const loadRound = async () => {
    if (!roundId) return;

    // 1. Immediately fetch from backend API for instant render (0ms freeze)
    try {
      const res = await fetch(`${API_BASE_URL}/api/rounds/${roundId}`);
      const data = await res.json();
      if (data.success && data.round) {
        const isRoundETH = data.round.paymentToken === ethers.ZeroAddress || data.round.isETH;
        setRound((prev) => ({
          ...prev,
          roundId: Number(data.round.roundId),
          paymentToken: data.round.paymentToken,
          isETH: isRoundETH,
          entryAmount: data.round.entryAmount.toString(),
          minPlayers: Number(data.round.minPlayers),
          maxPlayers: Number(data.round.maxPlayers),
          playerCount: Number(data.round.playerCount),
          revealedCount: Number(data.round.revealedCount || 0),
          rollCount: Number(data.round.rollCount || 0),
          totalDeposits: data.round.totalDeposits.toString(),
          state: Number(data.round.state),
          winningNumber: Number(data.round.winningNumber || 0),
          winnerCount: Number(data.round.winnerCount || 0),
          winnerReward: (data.round.winnerReward || "0").toString(),
          remainder: (data.round.remainder || "0").toString(),
          joinDeadline: Number(data.round.joinDeadline || 0),
          revealDeadline: Number(data.round.revealDeadline || 0),
          vrfRequestId: (data.round.vrfRequestId || "0").toString()
        }));

        if (data.round.players) {
          setRoundPlayers(data.round.players);
        }

        if (account && data.round.players) {
          const p = data.round.players.find(
            (x) => x.address.toLowerCase() === account.toLowerCase()
          );
          if (p) {
            setPlayerEntry((prev) => ({
              ...prev,
              hasCommitted: true,
              commitment: p.commitment || "0x",
              amount: p.amount.toString(),
              selectedNumber: Number(p.selectedNumber || 0),
              revealed: !!p.revealed,
              claimed: !!p.claimed,
              refunded: !!p.refunded
            }));
          }
        }
      }
    } catch (e) {
      console.warn("API round fetch:", e.message);
    }

    // 2. Fetch directly from contract if diceContract is ready
    if (diceContract) {
      try {
        const r = await diceContract.getRound(roundId);
        const isRoundETH = r.paymentToken === ethers.ZeroAddress;

        setRound({
          roundId: Number(r.roundId),
          paymentToken: r.paymentToken,
          isETH: isRoundETH,
          entryAmount: r.entryAmount.toString(),
          minPlayers: Number(r.minPlayers),
          maxPlayers: Number(r.maxPlayers),
          playerCount: Number(r.playerCount),
          revealedCount: Number(r.revealedCount),
          rollCount: Number(r.rollCount),
          totalDeposits: r.totalDeposits.toString(),
          state: Number(r.state),
          winningNumber: Number(r.winningNumber),
          winnerCount: Number(r.winnerCount),
          winnerReward: r.winnerReward.toString(),
          remainder: r.remainder.toString(),
          joinDeadline: Number(r.joinDeadline),
          revealDeadline: Number(r.revealDeadline),
          vrfRequestId: r.vrfRequestId.toString()
        });

        // Check player entry
        if (account) {
          const entry = await diceContract.getPlayerEntry(roundId, account);
          setPlayerEntry({
            hasCommitted: entry.commitment !== ethers.ZeroHash,
            commitment: entry.commitment,
            amount: entry.amount.toString(),
            selectedNumber: Number(entry.selectedNumber),
            revealed: entry.revealed,
            claimed: entry.claimed,
            refunded: entry.refunded
          });

          // Check local secret
          const localSecret = getStoredSecret(roundId);
          if (localSecret) {
            setActiveSecretData(localSecret);
          }
        }
      } catch (e) {
        console.error("Error reading round from contract:", e);
      }
    }
  };

  // Trigger celebration confetti on win
  useEffect(() => {
    if (
      round &&
      round.state === 4 &&
      playerEntry &&
      playerEntry.revealed &&
      playerEntry.selectedNumber === round.winningNumber &&
      !playerEntry.claimed
    ) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#f59e0b', '#ffffff']
      });
    }
  }, [round?.state, playerEntry?.revealed]);

  if (!round) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-arena-surface hover:bg-arena-hover border border-arena-border text-xs font-bold text-gray-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Arena Lobby</span>
          </button>
          <span className="text-xs text-gray-400 font-mono">Arena #{roundId}</span>
        </div>

        <div className="py-20 text-center glass-panel-gamer rounded-3xl border border-arena-border p-8">
          <RefreshCw className="w-8 h-8 text-crimson animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-300 font-mono mb-2">Connecting to Arena #{roundId}...</p>
          <p className="text-xs text-gray-500 mb-6">Retrieving on-chain state from Sepolia & backend indexer...</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-arena-surface hover:bg-arena-hover border border-arena-border text-xs font-bold text-gray-300 hover:text-white transition"
          >
            Return to Arena Lobby
          </button>
        </div>
      </div>
    );
  }

  const isETH = round.isETH;
  const entryFormatted = isETH
    ? `${ethers.formatEther(round.entryAmount)} ETH`
    : `${ethers.formatUnits(round.entryAmount, 6)} USDT`;
  const poolFormatted = isETH
    ? `${ethers.formatEther(round.totalDeposits)} ETH`
    : `${ethers.formatUnits(round.totalDeposits, 6)} USDT`;
  const rewardFormatted = isETH
    ? `${ethers.formatEther(round.winnerReward || "0")} ETH`
    : `${ethers.formatUnits(round.winnerReward || "0", 6)} USDT`;

  // Dynamic exact allowance check for USDT
  const hasSufficientAllowance = isETH
    ? true
    : ethers.parseUnits(usdtAllowance || "0", 6) >= BigInt(round?.entryAmount || 0);

  // Approve exact stake for USDT
  const handleApproveUsdt = async () => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      setTxPending(true);

      const appTx = await usdtContract.approve(
        deploymentConfig.addresses.multiplayerDiceRoll,
        round.entryAmount
      );
      await appTx.wait();
      await refreshBalances();
      setSuccessMsg(`Approved ${entryFormatted} successfully! Now proceed to Step 2.`);
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Join & Commit Action
  const handleCommit = async () => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      // 1. Generate client-side private secret salt
      const secretSalt = ethers.hexlify(ethers.randomBytes(32));

      // 2. Compute commitment hash
      const commitment = ethers.solidityPackedKeccak256(
        ["uint256", "address", "uint8", "bytes32"],
        [round.roundId, account, selectedNumber, secretSalt]
      );

      // 3. Store locally in browser
      storeSecret(round.roundId, selectedNumber, secretSalt, commitment);
      setActiveSecretData({
        roundId: round.roundId,
        player: account,
        selectedNumber,
        secretSalt,
        commitment
      });

      // 4. Handle token payment and submit commit
      if (isETH) {
        setTxPending(true);
        const tx = await diceContract.commit(round.roundId, commitment, {
          value: round.entryAmount
        });
        await tx.wait();
      } else {
        // USDT: Check exact allowance
        const allowanceBN = ethers.parseUnits(usdtAllowance || "0", 6);
        const entryBN = BigInt(round.entryAmount);

        if (allowanceBN < entryBN) {
          setErrorMsg(`Insufficient USDT allowance. Please complete Step 1: Approve USDT (${entryFormatted}) first.`);
          return;
        }

        setTxPending(true);
        const tx = await diceContract.commit(round.roundId, commitment);
        await tx.wait();
      }

      setSuccessMsg("Committed! Your selected dice number is locked and hidden.");
      await refreshBalances();
      await loadRound();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Reveal Action
  const handleReveal = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!diceContract) {
      setErrorMsg("Please connect your MetaMask wallet on Sepolia.");
      return;
    }
    if (!activeSecretData) {
      setErrorMsg("Secret data not found in this browser. Please use your backup secret.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setTxPending(true);

      const tx = await diceContract.reveal(
        round.roundId,
        activeSecretData.selectedNumber,
        activeSecretData.secretSalt
      );
      await tx.wait();

      setSuccessMsg(`Revealed number #${activeSecretData.selectedNumber} successfully!`);
      await loadRound();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Claim Reward Action
  const handleClaim = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!diceContract) {
      setErrorMsg("Please connect your MetaMask wallet on Sepolia to claim your reward.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setTxPending(true);

      const tx = await diceContract.claimReward(round.roundId);
      await tx.wait();

      setSuccessMsg(`Reward of ${rewardFormatted} transferred to your wallet!`);
      await refreshBalances();
      await loadRound();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Claim Refund Action
  const handleRefund = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!diceContract) {
      setErrorMsg("Please connect your MetaMask wallet on Sepolia.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setTxPending(true);

      const tx = await diceContract.claimRefund(round.roundId);
      await tx.wait();

      setSuccessMsg(`Full refund of ${entryFormatted} returned to your wallet!`);
      await refreshBalances();
      await loadRound();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Permissionless Reroll Trigger Action
  const handleReroll = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!diceContract) {
      setErrorMsg("Please connect your MetaMask wallet on Sepolia.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setTxPending(true);

      const tx = await diceContract.reroll(round.roundId);
      await tx.wait();

      setSuccessMsg("Reroll requested! Securing verifiable roll...");
      await loadRound();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Permissionless Close Reveal & Request Roll
  const handleCloseReveal = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!diceContract) {
      setErrorMsg("Please connect your MetaMask wallet on Sepolia to roll the dice.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setTxPending(true);

      const tx = await diceContract.closeRevealAndRequestRoll(round.roundId);
      await tx.wait();

      await loadRound();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Permissionlessly Lock Round & Start Match
  const handleLockRound = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!diceContract) {
      setErrorMsg("Please connect your MetaMask wallet on Sepolia.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      setTxPending(true);

      const tx = await diceContract.lockRound(round.roundId);
      await tx.wait();

      setSuccessMsg("Game started! Arena locked and reveal phase is now active. Reveal your chosen number!");
      await loadRound();
    } catch (err) {
      console.error(err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
      setTxPending(false);
    }
  };

  // Timer calculations
  const joinSecondsLeft = Math.max(0, round.joinDeadline - now);
  const revealSecondsLeft = Math.max(0, round.revealDeadline - now);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // AUTOMATED GAME FLOW HOOKS (Auto-Start, Auto-Reveal, Auto-Roll, Auto-Claim)
  // =========================================================================

  // 1. Auto-Lock / Auto-Start: Trigger when max players reached (e.g. 2/2) OR join timer reaches 0
  useEffect(() => {
    if (!round || round.state !== 0 || !account || !diceContract || loading || txPending || autoLockTriggered) return;

    const maxReached = round.playerCount >= round.maxPlayers && round.playerCount >= round.minPlayers;
    const timerElapsed = round.playerCount >= round.minPlayers && joinSecondsLeft === 0;

    if (maxReached || timerElapsed) {
      setAutoLockTriggered(true);
      console.log("[AutoDuel] Max players joined or timer expired! Auto-locking round & starting game duel...");
      handleLockRound();
    }
  }, [round?.state, round?.playerCount, round?.maxPlayers, round?.minPlayers, joinSecondsLeft, account, diceContract, txPending, loading, autoLockTriggered]);

  // 2. Auto-Reveal: When round enters Reveal Phase (State 2), auto-reveal player choice without manual clicks
  useEffect(() => {
    if (!round || round.state !== 2 || !account || !diceContract || loading || txPending || autoRevealTriggered) return;

    if (playerEntry?.hasCommitted && !playerEntry.revealed && activeSecretData) {
      setAutoRevealTriggered(true);
      console.log("[AutoDuel] Auto-revealing committed choice on-chain...");
      handleReveal();
    }
  }, [round?.state, playerEntry?.hasCommitted, playerEntry?.revealed, activeSecretData, account, diceContract, txPending, loading, autoRevealTriggered]);

  // 3. Auto-Roll: When all reveals are complete or reveal timer runs out, auto-trigger 3D dice roll
  useEffect(() => {
    if (!round || round.state !== 2 || !account || !diceContract || loading || txPending || autoRollTriggered) return;

    const allRevealed = round.revealedCount >= round.playerCount && round.playerCount > 0;
    const revealExpired = revealSecondsLeft === 0 && round.revealedCount > 0;

    if (allRevealed || revealExpired) {
      setAutoRollTriggered(true);
      console.log("[AutoDuel] All reveals complete! Auto-dispatching 3D dice roll via Chainlink VRF...");
      handleCloseReveal();
    }
  }, [round?.state, round?.revealedCount, round?.playerCount, revealSecondsLeft, account, diceContract, txPending, loading, autoRollTriggered]);

  // 4. Auto-Claim: When round settled (State 4), auto-trigger bounty reward transfer to winner's wallet
  useEffect(() => {
    if (!round || round.state !== 4 || !account || !diceContract || loading || txPending || autoClaimTriggered) return;

    const isWinner = playerEntry && playerEntry.revealed && Number(playerEntry.selectedNumber) === round.winningNumber;
    if (isWinner && !playerEntry.claimed) {
      setAutoClaimTriggered(true);
      console.log("[AutoDuel] Winner matched! Auto-transferring reward bounty to winner wallet...");
      handleClaim();
    }
  }, [round?.state, round?.winningNumber, playerEntry?.revealed, playerEntry?.selectedNumber, playerEntry?.claimed, account, diceContract, txPending, loading, autoClaimTriggered]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-arena-surface hover:bg-arena-hover border border-arena-border text-xs font-bold text-gray-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">Arena #{round.roundId}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isETH ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}>
            {isETH ? "ETH Game" : "USDT Game"}
          </span>
        </div>
      </div>

      {/* 4-STEP MATCH LIFECYCLE PROGRESS HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
        {/* Step 1 */}
        <div className={`p-3 rounded-2xl border text-center transition-all ${
          round.state === 0
            ? "bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-300 font-bold"
            : "bg-arena-surface/60 border-arena-border text-gray-400"
        }`}>
          <div className="text-[10px] uppercase tracking-wider font-mono">Step 1</div>
          <div className="text-xs font-heading font-black flex items-center justify-center gap-1 mt-0.5">
            {round.state > 0 ? "✓ 1. Locked" : "1. Lock Number"}
          </div>
        </div>

        {/* Step 2 */}
        <div className={`p-3 rounded-2xl border text-center transition-all ${
          round.state === 1 || round.state === 2
            ? "bg-amber-500/20 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] text-amber-300 font-bold animate-pulse"
            : round.state > 2
            ? "bg-arena-surface/60 border-arena-border text-gray-400"
            : "bg-arena-surface/30 border-arena-border/50 text-gray-600"
        }`}>
          <div className="text-[10px] uppercase tracking-wider font-mono">Step 2</div>
          <div className="text-xs font-heading font-black flex items-center justify-center gap-1 mt-0.5">
            {round.state > 2 ? "✓ 2. Revealed" : "2. Reveal Choices"}
          </div>
        </div>

        {/* Step 3 */}
        <div className={`p-3 rounded-2xl border text-center transition-all ${
          round.state === 3
            ? "bg-purple-500/25 border-purple-500/70 shadow-[0_0_25px_rgba(168,85,247,0.4)] text-purple-300 font-bold animate-pulse"
            : round.state >= 4
            ? "bg-arena-surface/60 border-arena-border text-gray-400"
            : "bg-arena-surface/30 border-arena-border/50 text-gray-600"
        }`}>
          <div className="text-[10px] uppercase tracking-wider font-mono">Step 3</div>
          <div className="text-xs font-heading font-black flex items-center justify-center gap-1 mt-0.5">
            {round.state >= 4 ? `✓ 3. Rolled #${round.winningNumber}` : "3. 3D Dice Roll (VRF)"}
          </div>
        </div>

        {/* Step 4 */}
        <div className={`p-3 rounded-2xl border text-center transition-all ${
          round.state === 4
            ? "bg-gold/20 border-gold/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] text-gold font-bold"
            : round.state === 6
            ? "bg-arena-surface/60 border-arena-border text-gray-400"
            : "bg-arena-surface/30 border-arena-border/50 text-gray-600"
        }`}>
          <div className="text-[10px] uppercase tracking-wider font-mono">Step 4</div>
          <div className="text-xs font-heading font-black flex items-center justify-center gap-1 mt-0.5">
            {round.state === 6 ? "✓ 4. Claimed" : "4. Settle & Claim"}
          </div>
        </div>
      </div>

      {/* Main Arena Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: 3D Dice Display & Status */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-arena-border text-center shadow-card-glow relative overflow-hidden">
          
          {/* Header Status */}
          <div className="mb-4">
            <span className="text-[10px] font-bold tracking-widest text-gold uppercase block">
              Round #{round.roundId} Arena
            </span>
            <h3 className="font-heading text-xl font-bold text-white">
              {round.state === 0 && "Waiting for Players"}
              {round.state === 1 && "Round Locked"}
              {round.state === 2 && "Reveal Phase Active"}
              {round.state === 3 && "Securing the Roll..."}
              {round.state === 4 && `Verified Result: Dice #${round.winningNumber}`}
              {round.state === 5 && `No Winner Rolled: Dice #${round.winningNumber} (${round.rollCount}/3)`}
              {round.state === 6 && "Round Completed"}
              {round.state === 7 && "Round Cancelled"}
            </h3>
          </div>

          {/* 3D Dice Visual */}
          <div className="py-4">
            <Dice3D
              result={(round.state === 4 || round.state === 5) ? round.winningNumber : (playerEntry?.revealed ? playerEntry.selectedNumber : selectedNumber)}
              isRolling={round.state === 3}
              size="lg"
            />
          </div>

          {/* Prize Pool & Stake Banner */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-arena-surface border border-arena-border text-left">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Fixed Stake</span>
              <span className="font-mono text-sm font-bold text-white">{entryFormatted}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Prize Pool</span>
              <span className="font-mono text-sm font-bold text-gold">{poolFormatted}</span>
            </div>
          </div>

          {/* Roll / Reroll Info */}
          {round.rollCount > 0 && (
            <div className="mt-3 text-xs text-gray-400">
              Roll Attempt: <strong className="text-white">{round.rollCount} / 3</strong>
            </div>
          )}
        </div>

        {/* Right: Actions, Commit-Reveal, Claims */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-arena-border shadow-card-glow">
          
          {/* STATE 0: COMMIT PHASE */}
          {round.state === 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-arena-border">
                <div>
                  <h4 className="font-heading text-lg font-bold text-white">1. Select Dice Number</h4>
                  <p className="text-xs text-gray-400">Your selection will be cryptographically hidden.</p>
                </div>
                {round.joinDeadline > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatSeconds(joinSecondsLeft)}</span>
                  </div>
                )}
              </div>

              {!playerEntry?.hasCommitted ? (
                <>
                  {/* Number Selector [1] [2] [3] [4] [5] [6] */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Dices className="w-4 h-4 text-gold" />
                        <span>Choose Your Lucky Number (1 – 6):</span>
                      </label>
                      {selectedNumber ? (
                        <span className="text-xs font-mono font-bold text-crimson-light">
                          ✓ Selected: #{selectedNumber}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-gray-400">
                          (Click a number below to select)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedNumber(num)}
                          className={`py-4 rounded-2xl font-heading text-xl font-black border transition-all duration-200 ${
                            selectedNumber === num
                              ? "bg-crimson text-white border-crimson shadow-crimson-glow scale-105"
                              : "bg-arena-surface border-arena-border text-gray-300 hover:border-gray-500 hover:text-white"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Commitment Concealment Notice */}
                  <div className="p-3.5 rounded-2xl bg-arena-surface border border-arena-border space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gold">
                      <Lock className="w-4 h-4" />
                      <span>Commit-Reveal Protection</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      A client-side private 32-byte salt will be generated. Only your cryptographic hash is stored on-chain. Opponents cannot observe your selected number before locking.
                    </p>
                  </div>

                  {/* Dynamic 2-Step Action for USDT or Direct for ETH or Connect Wallet */}
                  {!account ? (
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="crimson-gradient-btn w-full py-4 rounded-xl font-bold text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Wallet className="w-5 h-5" />
                      <span>{isConnecting ? "Connecting MetaMask..." : "Connect MetaMask to Join Arena"}</span>
                    </button>
                  ) : !isETH && !hasSufficientAllowance ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-amber-400 font-mono bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/30">
                        <span>Step 1 of 2: Authorize Stake</span>
                        <span>Requires {entryFormatted} Approval</span>
                      </div>
                      <button
                        onClick={handleApproveUsdt}
                        disabled={loading || txPending}
                        className="gold-gradient-btn w-full py-4 rounded-xl font-bold text-gray-950 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {txPending ? (
                          <span>Authorizing Token...</span>
                        ) : (
                          <>
                            <Coins className="w-4 h-4" />
                            <span>Step 1: Approve USDT ({entryFormatted})</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {!isETH && (
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/30">
                          <span>Step 2 of 2: Join Arena</span>
                          <span>✓ Allowance Confirmed</span>
                        </div>
                      )}
                      {!selectedNumber ? (
                        <button
                          type="button"
                          disabled={true}
                          className="w-full py-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-gray-400 bg-arena-surface border border-arena-border flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                        >
                          <Dices className="w-4 h-4 text-gold animate-pulse" />
                          <span>Select Your Lucky Number (1 – 6) Above</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleCommit}
                          disabled={loading || txPending}
                          className="crimson-gradient-btn w-full py-4 rounded-xl font-bold text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(225,29,72,0.5)]"
                        >
                          {txPending ? (
                            <span>Submitting Transaction...</span>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>
                                {!isETH
                                  ? `Step 2: Join Arena with #${selectedNumber} (${entryFormatted})`
                                  : `Lock Number #${selectedNumber} & Join (${entryFormatted})`}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Player Already Committed */
                <div className="p-6 rounded-2xl bg-arena-surface border border-emerald-500/30 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-heading text-lg font-bold text-white">Your Selection Is Locked</h5>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                      You are entered in Round #{round.roundId}. When {round.maxPlayers} fighters join or the join timer reaches 00:00, the match will automatically progress to reveal and 3D dice roll!
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Number #{activeSecretData?.selectedNumber || selectedNumber || "?"} Cryptographically Protected</span>
                  </div>
                </div>
              )}

              {/* Option to START GAME NOW if minPlayers reached */}
              {round.playerCount >= round.minPlayers && (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 space-y-3.5 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>FIGHTERS READY ({round.playerCount} / {round.minPlayers} Min Reached)</span>
                    </span>
                    <span className="text-xs font-mono text-gold font-bold">
                      {joinSecondsLeft > 0 ? `Auto-locks in ${formatSeconds(joinSecondsLeft)}` : "Ready to Duel!"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {joinSecondsLeft > 0
                      ? `Arena has reached minimum ${round.minPlayers} players! You can wait for more fighters, or the match will lock and begin when the countdown completes.`
                      : `Minimum player requirement met! You can now start the game immediately with the current ${round.playerCount} fighters.`}
                  </p>

                  <button
                    type="button"
                    onClick={handleLockRound}
                    disabled={loading || txPending || (joinSecondsLeft > 0 && round.playerCount < round.maxPlayers)}
                    className={`w-full py-4 rounded-xl font-heading text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      joinSecondsLeft === 0 || round.playerCount >= round.maxPlayers
                        ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.01]"
                        : "bg-arena-surface border border-arena-border text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {txPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Locking Arena on Sepolia...</span>
                      </>
                    ) : joinSecondsLeft === 0 || round.playerCount >= round.maxPlayers ? (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>START GAME NOW ({round.playerCount} Players Duel) ➜</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Starts in {formatSeconds(joinSecondsLeft)} (or when {round.maxPlayers} join)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: REVEAL PHASE */}
          {round.state === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-arena-border">
                <div>
                  <h4 className="font-heading text-lg font-bold text-white">2. Reveal Selection</h4>
                  <p className="text-xs text-gray-400">Verify your commitment hash with the smart contract.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gold font-mono bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatSeconds(revealSecondsLeft)}</span>
                </div>
              </div>

              {/* Deadline Forfeiture Warning */}
              <div className="p-3.5 rounded-2xl bg-crimson/10 border border-crimson/30 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-crimson-light flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300">
                  <strong className="text-crimson-light block">Forfeiture Rule:</strong>
                  Failure to reveal before the deadline forfeits your entry! Unrevealed funds remain in the prize pool for valid revealed players.
                </p>
              </div>

              {playerEntry?.hasCommitted && !playerEntry.revealed ? (
                <div className="p-6 rounded-2xl bg-arena-surface border border-gold/40 text-center space-y-4">
                  <span className="text-xs text-gray-400 block uppercase font-semibold">Your Hidden Choice</span>
                  <div className="font-heading text-4xl font-black text-gold">
                    Dice #{activeSecretData ? activeSecretData.selectedNumber : "?"}
                  </div>
                  <button
                    onClick={handleReveal}
                    disabled={loading || txPending}
                    className="gold-gradient-btn w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {txPending ? (
                      <span>Verifying On-Chain...</span>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Reveal Selection #{activeSecretData?.selectedNumber}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : playerEntry?.revealed ? (
                <div className="p-6 rounded-2xl bg-arena-surface border border-emerald-500/40 text-center space-y-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h5 className="font-heading text-base font-bold text-white">Selection Successfully Revealed!</h5>
                  <p className="text-xs text-gray-300">
                    Your number <strong className="text-gold font-mono text-sm">#{playerEntry.selectedNumber}</strong> is locked and verified on-chain. Ready for 3D roll!
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-arena-surface border border-arena-border text-center text-xs text-gray-400">
                  You did not participate in this round's commit phase.
                </div>
              )}

              {/* Countdown notice when opponent has not yet revealed */}
              {revealSecondsLeft > 0 && round.revealedCount < round.playerCount && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                  <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Awaiting Opponent Reveal ({formatSeconds(revealSecondsLeft)} remaining)</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    If opponent does not reveal in time, you can launch the roll and secure the bounty!
                  </p>
                </div>
              )}

              {/* HIGH-IMPACT 3D DICE ROLL DISPATCH CARD */}
              {(revealSecondsLeft === 0 || round.revealedCount === round.playerCount) && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-purple-950/60 border-2 border-purple-500/60 shadow-[0_0_35px_rgba(168,85,247,0.3)] text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    <Dices className="w-7 h-7 text-purple-300 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-heading text-xl font-black text-white">REVEALS COMPLETE — READY TO ROLL!</h4>
                    <p className="text-xs text-gray-300 max-w-md mx-auto mt-1 leading-relaxed">
                      {round.revealedCount < round.playerCount
                        ? "Opponent reveal timer has expired! Unrevealed entries are forfeited. You can now launch the on-chain 3D dice roll via Chainlink VRF!"
                        : "All fighters have revealed their numbers! Dispatch the on-chain verifiable 3D dice roll now!"}
                    </p>
                  </div>

                  {!account ? (
                    <button
                      type="button"
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="crimson-gradient-btn w-full py-4 rounded-2xl font-heading text-sm font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(225,29,72,0.4)] flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
                    >
                      <Wallet className="w-5 h-5" />
                      <span>{isConnecting ? "Connecting MetaMask..." : "🦊 Connect Wallet to Roll Dice 🎲"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCloseReveal}
                      disabled={loading || txPending}
                      className="w-full py-4 rounded-2xl font-heading text-sm font-black uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
                    >
                      {txPending ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Rolling 3D Dice On-Chain...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-yellow-300" />
                          <span>🎲 ROLL 3D DICE NOW (GENERATE RANDOM NUMBER) ➜</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STATE 3: RANDOMNESS PENDING */}
          {round.state === 3 && (
            <div className="py-10 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-gold animate-spin mx-auto" />
              <h4 className="font-heading text-2xl font-bold text-white">Securing the Roll...</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Chainlink Verifiable Random Function (VRF) is generating an unbiasable random word on-chain.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">
                VRF Request #{round.vrfRequestId}
              </div>
            </div>
          )}

          {/* STATE 4: RESULT READY & DIRECT NUMBER COMPARISON */}
          {round.state === 4 && (
            <div className="space-y-6">
              {/* Winning Number Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-gold/15 via-arena-surface to-gold/10 border-2 border-gold/60 shadow-[0_0_35px_rgba(245,158,11,0.25)] text-center space-y-3">
                <span className="text-xs font-bold text-gold uppercase tracking-widest block font-mono">
                  🎲 WINNING RANDOM NUMBER ROLLED
                </span>
                <div className="font-heading text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
                  Dice #{round.winningNumber}
                </div>
                <p className="text-xs text-gray-300 font-mono">
                  Chainlink VRF Provably Fair Random Result • {round.winnerCount} Winner(s) Matched!
                </p>
              </div>

              {/* DIRECT PLAYERS COMPARISON SHOWDOWN */}
              <div className="p-5 rounded-2xl bg-arena-surface border border-arena-border space-y-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block font-heading">
                  ⚔️ Player Selections vs Rolled Dice Comparison:
                </span>
                <div className="space-y-2">
                  {roundPlayers.map((p, i) => {
                    const isUser = account && p.address.toLowerCase() === account.toLowerCase();
                    const matched = p.revealed && Number(p.selectedNumber) === round.winningNumber;
                    return (
                      <div
                        key={p.address || i}
                        className={`p-3 rounded-xl flex items-center justify-between border text-xs font-mono transition-all ${
                          matched
                            ? "bg-gold/15 border-gold/60 text-gold shadow-[0_0_15px_rgba(245,158,11,0.2)] font-bold"
                            : "bg-arena-card/60 border-arena-border text-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{p.address.slice(0, 6)}...{p.address.slice(-4)}</span>
                          {isUser && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">YOU</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>
                            {p.revealed ? `Selected: #${p.selectedNumber}` : "Did Not Reveal"}
                          </span>
                          {matched ? (
                            <span className="px-2 py-0.5 rounded-full bg-gold text-gray-950 font-black flex items-center gap-1 text-[11px]">
                              <Trophy className="w-3 h-3" /> MATCH! WINNER!
                            </span>
                          ) : (
                            <span className="text-gray-500 text-[11px]">❌ No Match</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Winner Bounty & Claim Action (Visible to all, actionable by winner) */}
              {(() => {
                const winningPlayers = roundPlayers.filter(
                  (p) => p.revealed && Number(p.selectedNumber) === round.winningNumber
                );
                const winnerAddress = winningPlayers.length > 0 ? winningPlayers[0].address : null;
                const isUserWinner = account && winnerAddress && account.toLowerCase() === winnerAddress.toLowerCase();

                // 1. Disconnected Wallet: Prompt to connect winner's wallet
                if (!account) {
                  return (
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/70 via-arena-surface to-yellow-950/70 border-2 border-gold/70 text-center space-y-4 shadow-[0_0_35px_rgba(245,158,11,0.3)]">
                      <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto border border-gold/40">
                        <Trophy className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h5 className="font-heading text-xl font-black text-white">
                          WINNER BOUNTY READY TO CLAIM: {rewardFormatted}
                        </h5>
                        <p className="text-xs text-gray-300 mt-1">
                          Winning Fighter: <span className="font-mono text-gold font-bold">{winnerAddress ? `${winnerAddress.slice(0, 8)}...${winnerAddress.slice(-6)}` : "0x9b68...7d7d"}</span>
                        </p>
                      </div>

                      {/* Bounty Breakdown Box */}
                      <div className="p-3.5 rounded-xl bg-arena-surface/90 border border-arena-border max-w-sm mx-auto text-xs font-mono space-y-1.5 text-left">
                        <div className="flex justify-between text-gray-400">
                          <span>Total Stake Pool:</span>
                          <span className="text-white font-bold">{poolFormatted}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Protocol Fee (2%):</span>
                          <span className="text-gray-300">0.0004 ETH</span>
                        </div>
                        <div className="flex justify-between text-gold border-t border-arena-border pt-1 font-bold text-sm">
                          <span>Net Winner Bounty:</span>
                          <span className="text-gold">{rewardFormatted}</span>
                        </div>
                      </div>

                      <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="crimson-gradient-btn w-full py-4 rounded-xl font-heading text-sm font-black uppercase tracking-wider text-white shadow-[0_0_25px_rgba(225,29,72,0.5)] flex items-center justify-center gap-2 hover:scale-[1.01]"
                      >
                        <Wallet className="w-5 h-5" />
                        <span>{isConnecting ? "Connecting MetaMask..." : "🦊 CONNECT WALLET (0x9b68...7d7d) TO CLAIM 0.0196 ETH ➜"}</span>
                      </button>
                    </div>
                  );
                }

                // 2. Connected & User Is The Winner
                if (isUserWinner || (playerEntry && playerEntry.revealed && Number(playerEntry.selectedNumber) === round.winningNumber)) {
                  if (!playerEntry?.claimed) {
                    return (
                      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-emerald-950/80 border-2 border-emerald-500/70 text-center space-y-4 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                        <Sparkles className="w-10 h-10 text-gold mx-auto animate-bounce" />
                        <div>
                          <h5 className="font-heading text-2xl font-black text-white">🎉 CONGRATULATIONS, YOU WON!</h5>
                          <p className="text-xs text-gray-300 mt-1">
                            Your selected number <strong className="text-gold font-bold">#{round.winningNumber}</strong> matched the rolled dice #{round.winningNumber}!
                          </p>
                        </div>

                        {/* Bounty Breakdown Box */}
                        <div className="p-3.5 rounded-xl bg-arena-surface/90 border border-arena-border max-w-sm mx-auto text-xs font-mono space-y-1.5 text-left">
                          <div className="flex justify-between text-gray-400">
                            <span>Total Stake Pool:</span>
                            <span className="text-white font-bold">{poolFormatted}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Protocol Fee (2%):</span>
                            <span className="text-gray-300">0.0004 ETH</span>
                          </div>
                          <div className="flex justify-between text-gold border-t border-arena-border pt-1 font-bold text-sm">
                            <span>Your Claimable Bounty:</span>
                            <span className="text-gold">{rewardFormatted}</span>
                          </div>
                        </div>

                        <button
                          onClick={handleClaim}
                          disabled={loading || txPending}
                          className="gold-gradient-btn w-full py-4 rounded-xl font-heading text-sm font-black uppercase tracking-wider text-gray-950 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-[1.01]"
                        >
                          <Trophy className="w-5 h-5 text-gray-950" />
                          <span>{txPending ? "Transferring Reward..." : `🏆 CLAIM YOUR BOUNTY (${rewardFormatted}) DIRECT TO WALLET ➜`}</span>
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 text-center space-y-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                        <h5 className="font-heading text-lg font-black text-white">✓ BOUNTY CLAIMED TO WALLET!</h5>
                        <p className="text-xs text-emerald-300 font-mono">
                          {rewardFormatted} has been transferred to your wallet. Double-claim protection active on-chain.
                        </p>
                      </div>
                    );
                  }
                }

                // 3. Connected but Not the Winner
                return (
                  <div className="p-5 rounded-2xl bg-arena-surface border border-arena-border text-center space-y-2 text-xs">
                    <span className="text-gold font-bold block text-sm font-heading">
                      🏆 Winner: {winnerAddress ? `${winnerAddress.slice(0, 8)}...${winnerAddress.slice(-6)}` : "None"}
                    </span>
                    <span className="text-gray-300 block font-mono">
                      Bounty Reward: <strong className="text-gold">{rewardFormatted}</strong>
                    </span>
                    <span className="text-gray-500 block text-[11px]">
                      Connected as {account.slice(0, 6)}...{account.slice(-4)}. Only the winning player can claim this bounty.
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STATE 5: NO WINNER */}
          {round.state === 5 && (
            <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-orange-400 mx-auto" />
              <h5 className="font-heading text-xl font-bold text-white">No Winner Rolled: Dice #{round.winningNumber}</h5>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                The VRF rolled <strong>#{round.winningNumber}</strong>, but no player selected this number. All commitments and prize funds remain intact for the reroll!
              </p>
              <button
                onClick={handleReroll}
                disabled={loading || txPending}
                className="crimson-gradient-btn w-full py-3.5 rounded-xl font-bold text-white text-xs uppercase tracking-wider"
              >
                {txPending ? "Requesting Reroll..." : `Trigger Reroll (Attempt ${round.rollCount + 1}/3)`}
              </button>
            </div>
          )}

          {/* STATE 7: CANCELLED */}
          {round.state === 7 && (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <h5 className="font-heading text-xl font-bold text-white">Round Cancelled</h5>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                This round was cancelled. All committed players can claim an instant 100% refund.
              </p>
              {playerEntry?.hasCommitted && !playerEntry.refunded ? (
                <button
                  onClick={handleRefund}
                  disabled={loading || txPending}
                  className="crimson-gradient-btn w-full py-3.5 rounded-xl font-bold text-white text-xs uppercase tracking-wider"
                >
                  {txPending ? "Refunding..." : `Claim 100% Refund (${entryFormatted})`}
                </button>
              ) : playerEntry?.refunded ? (
                <div className="text-xs text-emerald-400 font-bold">Refunded successfully.</div>
              ) : null}
            </div>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-crimson/10 border border-crimson/30 text-crimson-light text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Player Progress Bar */}
          <div className="mt-6 pt-6 border-t border-arena-border flex items-center justify-between text-xs text-gray-400">
            <span>Players: <strong className="text-white font-mono">{round.playerCount} / {round.maxPlayers}</strong></span>
            <span>Revealed: <strong className="text-white font-mono">{round.revealedCount} / {round.playerCount}</strong></span>
          </div>

        </div>
      </div>

      {/* DUEL FIGHTERS & NUMBER MATCHUP BOARD */}
      <div className="mt-8 glass-panel p-6 sm:p-7 rounded-3xl border border-arena-border shadow-card-glow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-arena-border/70 mb-5">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-crimson-light" />
            <h4 className="font-heading text-lg font-black text-white">
              DUEL FIGHTERS ({round.playerCount} / {round.maxPlayers} Slots Filled)
            </h4>
          </div>
          <div className="text-xs font-mono text-gray-400">
            {round.state === 0 && (round.maxPlayers <= 2 ? "1v1 Duel Mode • Waiting for 2nd Fighter" : `Waiting for players (${round.playerCount}/${round.maxPlayers})`)}
            {(round.state === 1 || round.state === 2) && "Numbers being revealed on-chain"}
            {round.state === 3 && "3D Dice Rolling with Chainlink VRF"}
            {round.state === 4 && `Settled with Winning Dice #${round.winningNumber}!`}
            {round.state === 5 && `No Winner Matched #${round.winningNumber} - Reroll Ready`}
          </div>
        </div>

        {/* Display strictly round.maxPlayers slots (e.g. 2 slots for 2-player game) */}
        <div className={`grid gap-3.5 ${
          (round.maxPlayers || 2) <= 2
            ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
            : (round.maxPlayers || 2) <= 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {Array.from({ length: round.maxPlayers || 2 }).map((_, idx) => {
            const p = roundPlayers[idx] || null;
            if (!p) {
              return (
                <div
                  key={`empty_${idx}`}
                  className="p-5 rounded-2xl border-2 border-dashed border-arena-border/60 bg-arena-surface/30 text-center flex flex-col items-center justify-center min-h-[140px]"
                >
                  <div className="w-9 h-9 rounded-full bg-arena-surface border border-arena-border flex items-center justify-center text-gray-600 mb-2">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    Fighter Slot #{idx + 1}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {idx === 1 && (round.maxPlayers || 2) === 2 ? "Waiting for 2nd Duelist..." : "Open for Challenger..."}
                  </span>
                </div>
              );
            }

            const isCurrentUser = account && p.address.toLowerCase() === account.toLowerCase();
            const isWinner = round.state === 4 && p.revealed && Number(p.selectedNumber) === round.winningNumber;

            return (
              <div
                key={p.address || idx}
                className={`p-4 rounded-2xl border transition-all ${
                  isWinner
                    ? "bg-gradient-to-r from-gold/20 via-amber-500/15 to-yellow-500/20 border-gold/70 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]"
                    : isCurrentUser
                    ? "bg-arena-surface/90 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "bg-arena-surface/60 border-arena-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{p.address.slice(0, 6)}...{p.address.slice(-4)}</span>
                    {isCurrentUser && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                        YOU
                      </span>
                    )}
                  </span>
                  {isWinner && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gold text-gray-950 flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      <span>WINNER</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-arena-border/40">
                  <span className="text-gray-400 text-[11px]">Selected Dice:</span>
                  <span className="font-heading font-black">
                    {round.state === 0 ? (
                      <span className="text-gray-400 text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-gold" /> Hidden Hash
                      </span>
                    ) : p.revealed ? (
                      <span className={`text-base flex items-center gap-1 ${isWinner ? "text-gold font-black scale-110" : "text-white"}`}>
                        🎲 #{p.selectedNumber}
                      </span>
                    ) : round.state >= 2 && revealSecondsLeft === 0 ? (
                      <span className="text-crimson-light text-[11px] flex items-center gap-1">
                        ⚠️ Forfeited
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Awaiting Reveal
                      </span>
                    )}
                  </span>
                </div>

                {round.state === 4 && (
                  <div className="mt-2 pt-1.5 border-t border-arena-border/40 text-[11px] font-mono">
                    {isWinner ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Matched #{round.winningNumber}! Wins Pool</span>
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-1">
                        <span>Did not match winning #{round.winningNumber}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
