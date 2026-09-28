import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Trophy, History, Medal, User, ExternalLink, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';
import { API_BASE_URL } from '../config/api';

export default function Leaderboard() {
  const { account } = useWeb3();
  const [activeTab, setActiveTab] = useState("leaderboard"); // "leaderboard" or "history"
  const [leaderboard, setLeaderboard] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load Leaderboard
        try {
          const lRes = await fetch(`${API_BASE_URL}/api/leaderboard`);
          const lData = await lRes.json();
          if (lData.success) {
            setLeaderboard(lData.leaderboard);
          }
        } catch {}

        // Load User Stats & History if account connected
        if (account) {
          try {
            const [hRes, sRes] = await Promise.all([
              fetch(`${API_BASE_URL}/api/player/${account}/history`),
              fetch(`${API_BASE_URL}/api/player/${account}/stats`)
            ]);
            const [hData, sData] = await Promise.all([hRes.json(), sRes.json()]);
            if (hData.success) setUserHistory(hData.history);
            if (sData.success) setUserStats(sData.stats);
          } catch {}
        }
      } catch (e) {
        console.error("Error loading stats:", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [account]);

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-arena-border">
        
        {/* Tab Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-arena-border mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <h3 className="font-heading text-xl font-bold text-white">Arena Hall of Fame</h3>
          </div>

          <div className="flex rounded-xl bg-arena-surface p-1 border border-arena-border text-xs font-bold">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "leaderboard"
                  ? "bg-gold text-arena-bg shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Top Champions
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "history"
                  ? "bg-crimson text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              My Roll History
            </button>
          </div>
        </div>

        {/* Tab 1: Leaderboard */}
        {activeTab === "leaderboard" && (
          <div>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                No indexed winner records yet. Play the first duel to claim the top spot!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-arena-surface text-gray-400 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">Rank</th>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4 text-center">Rounds Won</th>
                      <th className="py-3 px-4 text-right">Total ETH Won</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Total USDT Won</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arena-border/40 font-mono">
                    {leaderboard.map((item, idx) => (
                      <tr key={item.address} className="hover:bg-arena-hover/50 transition">
                        <td className="py-3 px-4 font-sans">
                          {idx === 0 && <span className="text-gold font-bold">#1 🥇</span>}
                          {idx === 1 && <span className="text-gray-300 font-bold">#2 🥈</span>}
                          {idx === 2 && <span className="text-amber-600 font-bold">#3 🥉</span>}
                          {idx > 2 && <span className="text-gray-400">#{idx + 1}</span>}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {item.address.slice(0, 6)}...{item.address.slice(-4)}
                        </td>
                        <td className="py-3 px-4 text-center text-gold font-bold">{item.roundsWon}</td>
                        <td className="py-3 px-4 text-right text-cyan-300">
                          {parseFloat(ethers.formatEther(item.totalWonETH || "0")).toFixed(3)} ETH
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400">
                          {parseFloat(ethers.formatUnits(item.totalWonUSDT || "0", 6)).toFixed(1)} USDT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: User History */}
        {activeTab === "history" && (
          <div>
            {!account ? (
              <div className="text-center py-12 text-xs text-gray-400">
                Please connect your wallet to view your personal game history.
              </div>
            ) : userHistory.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                No active rounds played on this wallet yet. Join an arena to start rolling!
              </div>
            ) : (
              <div className="space-y-3">
                {userHistory.map((item) => (
                  <div
                    key={item.round.roundId}
                    className="p-4 rounded-2xl bg-arena-surface border border-arena-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-sm font-bold text-white">
                        Round #{item.round.roundId}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-arena-card border border-arena-border text-gray-300">
                        {item.round.isETH ? "ETH Arena" : "USDT Arena"}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-gray-300">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-sans">Choice</span>
                        <span className="font-bold text-white">
                          {item.entry.revealed ? `Dice #${item.entry.selectedNumber}` : "Hidden"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-sans">Winning Roll</span>
                        <span className="font-bold text-gold">
                          {item.round.winningNumber ? `Dice #${item.round.winningNumber}` : "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-sans">Status</span>
                        <span className={`font-bold ${
                          item.entry.claimed
                            ? "text-emerald-400"
                            : item.entry.selectedNumber === item.round.winningNumber && item.round.winningNumber > 0
                            ? "text-gold animate-pulse"
                            : "text-gray-400"
                        }`}>
                          {item.entry.claimed
                            ? "Claimed"
                            : item.entry.selectedNumber === item.round.winningNumber && item.round.winningNumber > 0
                            ? "Won! Unclaimed"
                            : "Finished"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
