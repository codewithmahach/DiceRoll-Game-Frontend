# DiceClash Frontend Web App

Modern, responsive Web3 frontend for the **DiceClash Multiplayer Dice Roll Game** built with React, Vite, Tailwind CSS, Ethers.js, and 3D animated dice simulation.

---

## 🎲 Features
- **Wallet Connection**: MetaMask / Web3 wallet connection with automatic Sepolia network detection and switching.
- **3D Animated Dice**: Dynamic 3D interactive dice rolls with physics, bounce, and sound effects.
- **Fair Play Verification**: Commit-reveal cryptographic scheme with recovery key backup.
- **Arena Modes**: Both ETH and ERC-20 (MockUSDT) multiplayer duels.
- **Live Leaderboard & Match History**: Real-time stats, rewards claim tracking, and personal win records.
- **Vercel Ready**: Preconfigured `vercel.json` SPA rewrite rules and customizable `VITE_API_URL`.

---

## 🚀 Deployment on Vercel

1. **Import Project**: Connect this GitHub repository (`DiceRoll-Game-Frontend`) on [Vercel](https://vercel.com).
2. **Framework Preset**: `Vite` (automatically detected).
3. **Root Directory**: `./` (leave default).
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_URL`: The live URL of your Render backend (e.g. `https://your-backend.onrender.com`).
   *Note: If running in standalone client mode, contract calls will still sync directly on-chain.*

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env

# 3. Start local development server
npm run dev
```
