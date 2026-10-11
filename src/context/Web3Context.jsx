import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext(null);

export const SUPPORTED_NETWORKS = {
  31337: {
    chainId: "0x7a69",
    chainName: "Hardhat Localhost",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: null,
  },
  11155111: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    rpcUrls: ["https://rpc.sepolia.org"],
    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  }
};

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [usdtAllowance, setUsdtAllowance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [deploymentConfig, setDeploymentConfig] = useState(null);
  const [diceContract, setDiceContract] = useState(null);
  const [usdtContract, setUsdtContract] = useState(null);

  // Load deployed addresses and ABIs
  useEffect(() => {
    async function loadArtifacts() {
      try {
        const [addrRes, diceRes, usdtRes] = await Promise.all([
          import('../contracts/deployedAddresses.json'),
          import('../contracts/MultiplayerDiceRoll.json'),
          import('../contracts/MockUSDT.json')
        ]);
        setDeploymentConfig({
          addresses: addrRes.default || addrRes,
          diceAbi: diceRes.default ? diceRes.default.abi : diceRes.abi,
          usdtAbi: usdtRes.default ? usdtRes.default.abi : usdtRes.abi,
        });
      } catch (err) {
        console.warn("Artifacts not yet built or deployed locally:", err.message);
      }
    }
    loadArtifacts();
  }, []);

  // Resolve active network contract addresses (defaults to Sepolia 11155111 on live testnet)
  const activeAddresses = React.useMemo(() => {
    if (!deploymentConfig?.addresses) return null;
    const all = deploymentConfig.addresses;
    if (chainId && all.networks && all.networks[chainId]) {
      return all.networks[chainId];
    }
    return (all.networks && all.networks["11155111"]) ? all.networks["11155111"] : all;
  }, [deploymentConfig, chainId]);

  // Update Contract Instances
  useEffect(() => {
    if (!deploymentConfig || !activeAddresses) return;
    const { diceAbi, usdtAbi } = deploymentConfig;
    const diceAddr = activeAddresses.multiplayerDiceRoll;
    const usdtAddr = activeAddresses.mockUSDT || activeAddresses.usdtAddress;
    if (!diceAddr) return;

    if (signer) {
      setDiceContract(new ethers.Contract(diceAddr, diceAbi, signer));
      if (usdtAddr) {
        setUsdtContract(new ethers.Contract(usdtAddr, usdtAbi, signer));
      } else {
        setUsdtContract(null);
      }
    } else if (provider) {
      setDiceContract(new ethers.Contract(diceAddr, diceAbi, provider));
      if (usdtAddr) {
        setUsdtContract(new ethers.Contract(usdtAddr, usdtAbi, provider));
      } else {
        setUsdtContract(null);
      }
    } else {
      // Public Read-Only Fallback for instantaneous round viewing even before connecting MetaMask
      try {
        const publicProvider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        setDiceContract(new ethers.Contract(diceAddr, diceAbi, publicProvider));
        if (usdtAddr) {
          setUsdtContract(new ethers.Contract(usdtAddr, usdtAbi, publicProvider));
        } else {
          setUsdtContract(null);
        }
      } catch (err) {
        console.warn("Public provider fallback error:", err.message);
      }
    }
  }, [signer, provider, deploymentConfig, activeAddresses]);

  // Refresh Balances
  const refreshBalances = useCallback(async () => {
    if (!account || !provider) return;
    try {
      const b = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(b));

      const diceAddr = activeAddresses?.multiplayerDiceRoll;
      if (usdtContract && diceAddr) {
        try {
          const [uBal, uAllow] = await Promise.all([
            usdtContract.balanceOf(account),
            usdtContract.allowance(account, diceAddr)
          ]);
          setUsdtBalance(ethers.formatUnits(uBal, 6));
          setUsdtAllowance(ethers.formatUnits(uAllow, 6));
        } catch (uErr) {
          // Non-blocking warning if USDT contract not yet deployed or querying unsupported address
          console.warn("[Web3Context] USDT balance/allowance query:", uErr.message);
        }
      }
    } catch (e) {
      console.error("Error refreshing balances:", e.message);
    }
  }, [account, provider, usdtContract, activeAddresses]);

  useEffect(() => {
    refreshBalances();
    const interval = setInterval(refreshBalances, 6000);
    return () => clearInterval(interval);
  }, [refreshBalances]);

  // Connect Wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or a Web3 compatible wallet!");
      return;
    }
    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const s = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(s);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
  };

  // Switch / Add Network
  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return;
    const hexChainId = "0x" + Number(targetChainId).toString(16);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError) {
      // 4902: Chain not yet added
      if (switchError.code === 4902 && SUPPORTED_NETWORKS[targetChainId]) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [SUPPORTED_NETWORKS[targetChainId]],
        });
      }
    }
  };

  // Handle Account / Chain changes from MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accs) => {
      if (!accs || accs.length === 0) {
        disconnectWallet();
      } else {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const s = await browserProvider.getSigner();
          setProvider(browserProvider);
          setSigner(s);
          setAccount(accs[0]);
        } catch (err) {
          console.warn("[Web3Context] Failed to re-instantiate signer on accountsChanged:", err);
          setAccount(accs[0]);
        }
      }
    };

    const handleChainChanged = (cId) => {
      setChainId(Number(cId));
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Silent auto-reconnect on page refresh / load
    window.ethereum.request({ method: "eth_accounts" })
      .then(async (accs) => {
        if (accs && accs.length > 0) {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const network = await browserProvider.getNetwork();
          const s = await browserProvider.getSigner();
          setProvider(browserProvider);
          setSigner(s);
          setAccount(accs[0]);
          setChainId(Number(network.chainId));
        }
      })
      .catch((err) => console.warn("Auto-reconnect warning:", err.message));

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // -------------------------------------------------------------
  // COMMIT-REVEAL LOCAL STORAGE MANAGEMENT
  // -------------------------------------------------------------
  const getStoredSecret = (roundId) => {
    if (!account) return null;
    const key = `diceclash_${roundId}_${account.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const storeSecret = (roundId, selectedNumber, secretSalt, commitment) => {
    if (!account) return;
    const key = `diceclash_${roundId}_${account.toLowerCase()}`;
    const data = {
      roundId,
      player: account.toLowerCase(),
      selectedNumber,
      secretSalt,
      commitment,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Helper to map blockchain error codes to friendly messages
  const parseContractError = (err) => {
    const rawMsg = err?.reason || err?.shortMessage || err?.data?.message || err?.message || "";
    const errString = typeof err === "object" ? JSON.stringify(err) : String(err);

    // 1. Check for custom error hex selectors (4-byte signatures)
    const extractHexData = (e) => {
      if (!e) return null;
      if (typeof e.data === "string" && e.data.startsWith("0x")) return e.data;
      if (typeof e.info?.error?.data === "string" && e.info.error.data.startsWith("0x")) return e.info.error.data;
      if (typeof e.error?.data === "string" && e.error.data.startsWith("0x")) return e.error.data;
      if (typeof e.data?.data === "string" && e.data.data.startsWith("0x")) return e.data.data;
      const match = (e.message || "").match(/data="(0x[0-9a-fA-F]+)"/);
      if (match) return match[1];
      const match2 = (e.message || "").match(/(0x[0-9a-fA-F]{8})/);
      if (match2) return match2[1];
      return null;
    };

    const hex = extractHexData(err);
    if (hex) {
      const sel = hex.slice(0, 10).toLowerCase();
      const CUSTOM_ERRORS = {
        "0xbfec5558": "You have already joined this round with this wallet address. Please switch to your 2nd wallet account in MetaMask to join as Player 2.",
        "0x32e1428f": "This arena is full. All player slots have been taken.",
        "0x402bc007": "This arena is no longer open for joining.",
        "0xa9229d46": "The joining timer for this arena has expired (00:00). Please create or join a new match.",
        "0x2c5211c6": "Exact entry amount required for this arena.",
        "0x666710f4": "Arena not found.",
        "0x8269aaa1": "Invalid player count limits.",
        "0xfe6ce5ac": "Dice number must be between 1 and 6.",
        "0x4e7e4c0b": "Round has not locked yet.",
        "0x7357176d": "Reveal window has expired.",
        "0xa89ac151": "You have already revealed your dice choice for this round.",
        "0xc06789fa": "Invalid commitment: selected number or secret salt does not match.",
        "0x81791cb4": "You have not committed to this round.",
        "0x646cf558": "You have already claimed this prize reward.",
        "0xf13f3409": "Your revealed number did not match the winning roll.",
        "0x8a654c07": "Results are not ready yet.",
        "0x779df1a9": "This round has been cancelled.",
        "0xa85e6f1a": "You have already claimed your refund.",
        "0xa0f3feea": "Wrong payment token specified.",
        "0x948a9f34": "Randomness request is already pending.",
        "0xc523cf4c": "Maximum rerolls reached.",
        "0x228650c3": "Not eligible for reroll."
      };
      if (CUSTOM_ERRORS[sel]) {
        return CUSTOM_ERRORS[sel];
      }
    }

    if (rawMsg.includes("-32002") || errString.includes("-32002")) {
      return "MetaMask popup is already pending or RPC is busy. Please open your MetaMask extension to confirm.";
    }
    if (rawMsg.includes("4001") || rawMsg.includes("rejected") || rawMsg.includes("User denied") || errString.includes("ACTION_REJECTED")) {
      return "Transaction was cancelled in your wallet.";
    }
    if (rawMsg.includes("too many errors") || rawMsg.includes("RPC endpoint") || rawMsg.includes("rate limit")) {
      return "Sepolia RPC network is busy. Please wait a few seconds and retry.";
    }
    if (rawMsg.includes("JoinDeadlinePassed") || errString.includes("0xa9229d46") || rawMsg.includes("0xa9229d46")) {
      return "The joining timer for this arena has expired (00:00). Please create or join a new match.";
    }
    if (rawMsg.includes("InvalidAmount")) return "Exact entry amount required for this round.";
    if (rawMsg.includes("AlreadyCommitted") || rawMsg.includes("0xbfec5558") || errString.includes("0xbfec5558")) {
      return "You have already joined this round with this wallet address. Please switch to your 2nd wallet account in MetaMask to join as Player 2.";
    }
    if (rawMsg.includes("RoundFull") || rawMsg.includes("0x32e1428f") || errString.includes("0x32e1428f")) {
      return "This arena is full. All player slots have been taken.";
    }
    if (rawMsg.includes("RoundNotOpen") || rawMsg.includes("0x402bc007") || errString.includes("0x402bc007")) {
      return "This arena is no longer open for joining.";
    }
    if (rawMsg.includes("InvalidCommitment")) return "The selected number or secret salt does not match your initial commitment.";
    if (rawMsg.includes("AlreadyRevealed")) return "You have already revealed your choice for this round.";
    if (rawMsg.includes("RevealPeriodActive")) return "Reveal period is still in progress.";
    if (rawMsg.includes("AlreadyClaimed")) return "You have already claimed this reward.";
    if (rawMsg.includes("NotAWinningPlayer")) return "Your revealed number did not match the winning roll.";
    if (rawMsg.includes("insufficient funds") || errString.includes("insufficient funds")) {
      return "Insufficient wallet funds for stake and network gas fees.";
    }
    if (rawMsg.includes("execution reverted (unknown custom error)")) {
      return "Transaction simulation reverted on-chain. Please ensure you are connected with your second wallet account (Player 2) and have sufficient ETH.";
    }
    if (rawMsg.includes("missing revert data") || rawMsg.includes("CALL_EXCEPTION") || errString.includes("missing revert data")) {
      return "Transaction reverted by smart contract. The match timer may have expired or criteria not met.";
    }

    if (err?.reason) return err.reason;
    if (err?.shortMessage) return err.shortMessage;
    return rawMsg.length > 80 ? rawMsg.slice(0, 80) + "..." : rawMsg || "Transaction failed. Please check wallet connection.";
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        ethBalance,
        usdtBalance,
        usdtAllowance,
        isConnecting,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        refreshBalances,
        deploymentConfig,
        activeAddresses,
        diceContract,
        usdtContract,
        getStoredSecret,
        storeSecret,
        parseContractError,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
