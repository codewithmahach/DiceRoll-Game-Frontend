import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import Logo from './Logo';
import { Wallet, ShieldCheck, ChevronDown, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';

export default function Navbar({ onEnterArena, inArena = false }) {
  const {
    account,
    chainId,
    ethBalance,
    usdtBalance,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalances
  } = useWeb3();

  const isLocalOrSepolia = chainId === 31337 || chainId === 11155111;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-arena-border/50 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-4">
          <div onClick={() => onEnterArena(false)} className="cursor-pointer">
            <Logo size="md" />
          </div>

          <nav className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-arena-surface/80 border border-arena-border">
            <button
              onClick={() => onEnterArena(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                !inArena
                  ? "bg-gradient-to-r from-crimson to-rose-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onEnterArena(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                inArena
                  ? "bg-gradient-to-r from-gold to-amber-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Battle Arena
            </button>
          </nav>
        </div>

        {/* Center / Stats (If Connected) */}
        {account && (
          <div className="hidden md:flex items-center gap-3">
            {/* ETH Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-arena-surface border border-arena-border text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-gray-400">ETH:</span>
              <span className="font-bold text-white font-mono">
                {parseFloat(ethBalance).toFixed(4)}
              </span>
            </div>

            {/* USDT Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-arena-surface border border-arena-border text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-gray-400">USDT:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {parseFloat(usdtBalance).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Network Selector */}
          <div className="relative">
            <button
              onClick={() => switchNetwork(chainId === 31337 ? 11155111 : 31337)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                chainId === 31337
                  ? "bg-amber-500/10 text-gold border-gold/30 hover:bg-amber-500/20"
                  : chainId === 11155111
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
              }`}
            >
              <span className="w-2 h-2 rounded-full animate-ping bg-current" />
              <span>
                {chainId === 31337
                  ? "Localhost (31337)"
                  : chainId === 11155111
                  ? "Sepolia Testnet"
                  : "Switch Network"}
              </span>
            </button>
          </div>

          {/* Wallet Connect Button */}
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="crimson-gradient-btn flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-sm"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={disconnectWallet}
                title="Click to disconnect"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-arena-surface hover:bg-arena-hover border border-arena-border text-sm font-mono text-gray-200 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
