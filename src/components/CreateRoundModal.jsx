import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { X, Sparkles, AlertCircle, ShieldCheck, Wallet, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

export default function CreateRoundModal({ isOpen, onClose, onRoundCreated, defaultAsset = "ETH" }) {
  const {
    account,
    connectWallet,
    isConnecting,
    chainId,
    switchNetwork,
    diceContract,
    deploymentConfig,
    refreshBalances,
    parseContractError
  } = useWeb3();

  const [asset, setAsset] = useState(defaultAsset);
  const [ethAmount, setEthAmount] = useState("0.05");
  const [usdtAmount, setUsdtAmount] = useState("25");
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(2);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const ethPresets = ["0.01", "0.05", "0.10", "0.25", "0.50"];
  const usdtPresets = ["5", "10", "25", "50", "100"];

  const handleCreate = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    if (chainId !== 11155111 && chainId !== 31337) {
      await switchNetwork(11155111);
      return;
    }

    if (!diceContract) {
      setErrorMsg("Smart contract connection not ready. Please verify your MetaMask wallet is connected.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const isETH = asset === "ETH";
      const paymentToken = isETH ? ethers.ZeroAddress : deploymentConfig.addresses.mockUSDT;
      const entryAmount = isETH ? ethers.parseEther(ethAmount) : ethers.parseUnits(usdtAmount, 6);
      const durationSeconds = durationMinutes * 60;

      const tx = await diceContract.createRound(
        paymentToken,
        entryAmount,
        minPlayers,
        maxPlayers,
        durationSeconds
      );
      await tx.wait();

      await refreshBalances();
      onRoundCreated();
      onClose();
    } catch (err) {
      console.error("Create round error:", err);
      setErrorMsg(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel-gamer max-w-md w-full rounded-3xl p-6 md:p-8 border border-crimson/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading text-2xl font-black text-white mb-1">Create Arena Lobby</h3>
        <p className="text-xs text-gray-400 mb-5">Set a fixed entry stake for all joining players.</p>

        {/* Currency Switcher */}
        <div className="flex rounded-2xl bg-arena-surface p-1 border border-arena-border mb-6">
          <button
            onClick={() => setAsset("ETH")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              asset === "ETH"
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ETH Arena
          </button>
          <button
            onClick={() => setAsset("USDT")}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              asset === "USDT"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            USDT Arena
          </button>
        </div>

        {/* Stake Adjustment */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase font-mono">Fixed Entry Stake</span>
            <span className="font-mono text-base font-black text-gold">
              {asset === "ETH" ? `${ethAmount} ETH` : `${usdtAmount} USDT`}
            </span>
          </div>

          {/* Quick Bet Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {(asset === "ETH" ? ethPresets : usdtPresets).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => (asset === "ETH" ? setEthAmount(val) : setUsdtAmount(val))}
                className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                  (asset === "ETH" ? ethAmount : usdtAmount) === val
                    ? "bg-gradient-to-br from-crimson to-rose-600 text-white border-crimson shadow-[0_0_12px_rgba(225,29,72,0.5)] scale-105"
                    : "bg-arena-surface border-arena-border text-gray-300 hover:border-gray-500"
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={asset === "ETH" ? "0.01" : "5"}
            max={asset === "ETH" ? "1.00" : "500"}
            step={asset === "ETH" ? "0.01" : "5"}
            value={asset === "ETH" ? ethAmount : usdtAmount}
            onChange={(e) => (asset === "ETH" ? setEthAmount(e.target.value) : setUsdtAmount(e.target.value))}
            className="w-full accent-crimson cursor-pointer h-1.5 bg-arena-surface rounded-lg"
          />
        </div>

        {/* Player Capacity & Match Timer */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-semibold uppercase font-mono">Min Players</label>
            <select
              value={minPlayers}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinPlayers(val);
                if (maxPlayers < val) setMaxPlayers(val);
              }}
              className="w-full bg-arena-surface border border-arena-border rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-crimson"
            >
              <option value={2}>2 (Duel)</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-semibold uppercase font-mono">Max Players</label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full bg-arena-surface border border-arena-border rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-crimson"
            >
              <option value={2}>2 Players (1v1 Duel)</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
              <option value={6}>6 Players</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-semibold uppercase font-mono">Join Timer</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-arena-surface border border-arena-border rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-crimson"
            >
              <option value={2}>2 Mins (Fast Duel)</option>
              <option value={1}>1 Min (Speed)</option>
              <option value={5}>5 Mins</option>
              <option value={15}>15 Mins</option>
            </select>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mb-5 font-mono">
          ⚡ If minimum fighters join, the match can start immediately once the Join Timer reaches 00:00.
        </p>

        {/* Feature Checkmarks */}
        <div className="p-3.5 rounded-2xl bg-arena-surface/80 border border-arena-border mb-6 space-y-1.5 text-xs text-gray-300">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Provably Fair Chainlink VRF Roll</span>
          </div>
          <p className="text-[11px] text-gray-400 pl-6 leading-relaxed">
            If zero players hit the roll, the smart contract rerolls provably without charging extra platform fees.
          </p>
        </div>

        {/* Disconnected Notice */}
        {!account && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 mb-5 font-mono">
            <Wallet className="w-4 h-4 flex-shrink-0 text-gold" />
            <span>Wallet not connected. Click below to connect MetaMask.</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-crimson/15 border border-crimson/40 text-rose-300 text-xs flex items-center gap-2.5 mb-5 font-mono">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-crimson-light" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Action Button: Connect Wallet vs Create Game */}
        {!account ? (
          <button
            type="button"
            onClick={connectWallet}
            disabled={isConnecting}
            className="crimson-gradient-btn w-full py-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(225,29,72,0.6)] hover:scale-[1.01] transition-transform"
          >
            <Wallet className="w-5 h-5" />
            <span>{isConnecting ? "Connecting MetaMask..." : "Connect MetaMask to Create"}</span>
          </button>
        ) : chainId !== 11155111 && chainId !== 31337 ? (
          <button
            type="button"
            onClick={() => switchNetwork(11155111)}
            className="gold-gradient-btn w-full py-4 rounded-xl font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-[1.01] transition-transform"
          >
            <AlertCircle className="w-5 h-5 text-gray-950" />
            <span>Switch to Sepolia Network</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="crimson-gradient-btn w-full py-4 rounded-xl font-heading font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(225,29,72,0.5)] hover:scale-[1.01] transition-transform"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Confirming in MetaMask...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create {asset} Game</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
