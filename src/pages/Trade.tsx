// safu-dapp/src/pages/Trade.tsx
import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  TOKEN_ABI,
  LAUNCHER_ABI,
  SAFU_LAUNCHER_CA,
  ETH_USDT_PRICE_FEED,
  PRICE_GETTER_ABI,
} from "../web3/config";
import { ethers } from "ethers";
import "../App.css";
import {
  pureInfoDataRaw,
  pureGetLatestETHPrice,
  pureAmountOutMarketCap,
} from "../web3/readContracts";
import Navbar from "../components/launchintro/Navbar";
import Footer from "../components/generalcomponents/Footer";
import { FiCheckCircle } from "react-icons/fi";
import { MdOutlineCancel } from "react-icons/md";
import { GrSubtractCircle } from "react-icons/gr";
import { MdAddCircleOutline } from "react-icons/md";
import DustParticles from "../components/generalcomponents/DustParticles";

interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  createdAt?: number; // Optional, can be used to store creation timestamp
  expiresAt?: number; // Optional, can be used to store expiration timestamp
}

interface TxLog {
  type: "buy" | "sell";
  wallet: string;
  ethAmount: string; // ETH spent (buy) or received (sell)
  tokenAmount: string; // tokens received (buy) or sold (sell)
  txnHash: string;
  timestamp: string;
}

// 1. Create a formatter function:
function formatUTC(isoString: string): string {
  return new Date(isoString).toLocaleString("en-GB", {
    timeZone: "UTC",
    hour12: true,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getStartOfCurrentDay(): number {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.getTime();
}

function formatVolume(value: number): string {
  return value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(2)}M`
    : value.toLocaleString();
}

export default function Trade() {
  const { address, isConnected } = useAccount();
  const { tokenAddress } = useParams<{ tokenAddress: `0x${string}` }>();
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [txLogs, setTxLogs] = useState<TxLog[]>([]);
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<string>("");
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessingTxn, setIsProcessingTxn] = useState(false);
  const [fallbackInfoData, setFallbackInfoData] = useState<any[] | null>(null);
  const [fallbackETHPrice, setFallbackETHPrice] = useState<any | null>(null);
  const [curveProgressMap, setCurveProgressMap] = useState<
    Record<string, number>
  >({});
  const [oneTokenPriceETH, setOneTokenPriceETH] = useState<number | null>(null);
  const [isLoadingOneTokenPrice, setIsLoadingOneTokenPrice] = useState(false);

  // Admin function states
  const [whitelistAddresses, setWhitelistAddresses] = useState<string>("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Tabs for recent transactiona and community chat
  const [activeTab, setActiveTab] = useState<"transactions" | "chat">(
    "transactions"
  );

  // Track the type of the last transaction: 'approval', 'sell', or admin functions
  const [lastTxnType, setLastTxnType] = useState<
    | "approval"
    | "sell"
    | "buy"
    | "startTrading"
    | "addToWhitelist"
    | "disableWhitelist"
    | null
  >(null);

  // Check if current user is the token creator
  const isTokenCreator =
    address &&
    token &&
    address.toLowerCase() === token.tokenCreator.toLowerCase();

  // Wagmi hooks
  const {
    data: txHash,
    writeContract,
    isPending: isWritePending,
    error,
  } = useWriteContract();
  const {
    data: result,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Compute parsed values
  const ethValue = ethers.parseEther(mode === "buy" ? amount || "0" : "0");
  const tokenValue = ethers.parseEther(mode === "sell" ? amount || "0" : "0");

  const {
    data: getBalance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract(
    tokenAddress && address
      ? {
          ...TOKEN_ABI,
          address: tokenAddress as `0x${string}`,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        }
      : undefined
  );

  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    refetch: refetchAllowance,
  } = useReadContract(
    tokenAddress && address
      ? {
          ...TOKEN_ABI,
          address: tokenAddress,
          functionName: "allowance",
          args: [address as `0x${string}`, SAFU_LAUNCHER_CA],
        }
      : undefined
  );

  // Admin function to start trading
  const handleStartTrading = useCallback(() => {
    if (!tokenAddress || !isTokenCreator) return;
    setErrorMsg("");
    setLastTxnType("startTrading");

    writeContract({
      ...LAUNCHER_ABI,
      address: SAFU_LAUNCHER_CA,
      functionName: "startTrading",
      args: [tokenAddress as `0x${string}`],
    });
    setIsProcessingTxn(true);
  }, [
    writeContract,
    tokenAddress,
    isTokenCreator,
    LAUNCHER_ABI,
    SAFU_LAUNCHER_CA,
  ]);

  // Admin function to add addresses to whitelist
  const handleAddToWhitelist = useCallback(() => {
    if (!tokenAddress || !isTokenCreator || !whitelistAddresses.trim()) {
      setErrorMsg("Please enter valid addresses to whitelist");
      return;
    }

    // Parse comma-separated addresses
    const addresses = whitelistAddresses
      .split(",")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);

    if (addresses.length === 0) {
      setErrorMsg("Please enter valid addresses");
      return;
    }

    setErrorMsg("");
    setLastTxnType("addToWhitelist");

    writeContract({
      ...LAUNCHER_ABI,
      address: SAFU_LAUNCHER_CA,
      functionName: "addToWhitelist",
      args: [tokenAddress as `0x${string}`, addresses as `0x${string}`[]],
    });
    setIsProcessingTxn(true);
  }, [
    writeContract,
    tokenAddress,
    isTokenCreator,
    whitelistAddresses,
    LAUNCHER_ABI,
    SAFU_LAUNCHER_CA,
  ]);

  // Admin function to disable whitelist
  const handleDisableWhitelist = useCallback(() => {
    if (!tokenAddress || !isTokenCreator) return;
    setErrorMsg("");
    setLastTxnType("disableWhitelist");

    writeContract({
      ...LAUNCHER_ABI,
      address: SAFU_LAUNCHER_CA,
      functionName: "disableWhitelist",
      args: [tokenAddress as `0x${string}`],
    });
    setIsProcessingTxn(true);
  }, [
    writeContract,
    tokenAddress,
    isTokenCreator,
    LAUNCHER_ABI,
    SAFU_LAUNCHER_CA,
  ]);

  // Function to handle approval.
  const handleApprove = useCallback(() => {
    setErrorMsg("");
    if (isLoadingAllowance || isConfirming) return;
    if (mode === "sell" && !amount) {
      setErrorMsg("Please enter an amount to sell");
      return;
    }

    // Mark this txn as an approval txn.
    setLastTxnType("approval");
    writeContract({
      ...TOKEN_ABI,
      functionName: "approve",
      address: tokenAddress!,
      args: [SAFU_LAUNCHER_CA as `0x${string}`, tokenValue], // Use tokenValue (parsed amount)
    });
    setIsProcessingTxn(true);
  }, [
    isLoadingAllowance,
    isConfirming,
    amount,
    tokenValue,
    writeContract,
    tokenAddress,
    mode,
    SAFU_LAUNCHER_CA,
  ]);

  const {
    data: amountOut,
    isLoading: isLoadingAmountOut,
    refetch: refetchAmountOut,
  } = useReadContract(
    tokenAddress
      ? {
          ...LAUNCHER_ABI,
          address: SAFU_LAUNCHER_CA,
          functionName: "getAmountOut",
          args: [
            tokenAddress,
            mode === "buy" ? ethValue : tokenValue,
            mode === "buy" ? true : false,
          ],
        }
      : undefined
  );

  const {
    data: infoDataRaw,
    isLoading: isLoadingInfoData,
    refetch: refetchInfoData,
  } = useReadContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: "data",
    args: [tokenAddress!],
  });

  useEffect(() => {
    if (!isConnected && tokenAddress) {
      pureInfoDataRaw(tokenAddress).then((data) => {
        if (Array.isArray(data)) {
          console.log("Fetched fallback info data:", data);
          setFallbackInfoData(data);
        } else {
          console.error("Expected array, got:", data);
          setFallbackInfoData([]);
        }
      });
    }
  }, [isConnected, tokenAddress]);

  const infoData = isConnected ? infoDataRaw : fallbackInfoData;

  const tokenSupply = infoData ? Number(infoData[7]) : 0;
  const tokenSold = infoData ? Number(infoData[10]) : 0;
  const isStartTrading = infoData ? Number(infoData[1]) : 0;
  const isListed = infoData ? Number(infoData[2]) : 0;
  const isWhiteListOngoing = infoData ? Number(infoData[3]) : 0;

  const curvePercent = infoData
    ? (Number(tokenSold) / (0.75 * Number(tokenSupply))) * 100
    : 0;

  const curvePercentClamped = Math.min(Math.max(curvePercent, 0), 100);

  // Update curve progress map in effect
  useEffect(() => {
    if (tokenAddress) {
      setIsLoadingOneTokenPrice(true);

      pureAmountOutMarketCap(tokenAddress)
        .then((raw) => {
          // raw is BigInt or a bigint‐style object
          if (raw !== undefined && raw !== null) {
            const eth = Number(raw.toString()) / 1e18;
            setOneTokenPriceETH(eth);
          } else {
            setOneTokenPriceETH(0);
          }
        })
        .catch((err) => {
          console.error("failed to fetch single‑token price:", err);
          setOneTokenPriceETH(0);
        })
        .finally(() => setIsLoadingOneTokenPrice(false));
      setCurveProgressMap((prev) => ({
        ...prev,
        [tokenAddress]: curvePercentClamped,
      }));
    }
  }, [tokenAddress, curvePercentClamped]);
  // Check if transaction is in progress
  const isTransactionPending = isWritePending || isConfirming;

  // Convert balance to readable format
  const tokenBalance = getBalance
    ? ethers.formatEther(getBalance.toString())
    : "0";

  const {
    data: latestETHPrice,
    isLoading: isLoadingLatestETHPrice,
    refetch: refetchLatestETHPrice,
  } = useReadContract({
    ...PRICE_GETTER_ABI,
    functionName: "getLatestETHPrice",
    args: [ETH_USDT_PRICE_FEED!],
  });

  useEffect(() => {
    if (!isConnected && ETH_USDT_PRICE_FEED) {
      pureGetLatestETHPrice(ETH_USDT_PRICE_FEED).then((data) => {
        if (data) {
          console.log("Fetched fallback info data:", data);
          setFallbackETHPrice(data);
        } else {
          console.error("Expected array, got:", data);
          setFallbackETHPrice([]);
        }
      });
    }
  }, [isConnected, ETH_USDT_PRICE_FEED]);

  const infoETHCurrentPrice = isConnected
    ? Number(latestETHPrice) / 1e8
    : Number(fallbackETHPrice) / 1e8;

  const totalSupplyTokens = tokenSupply / 1e18;
  const marketCapETH =
    oneTokenPriceETH !== null ? oneTokenPriceETH * totalSupplyTokens : 0;
  const marketCapUSD = marketCapETH * infoETHCurrentPrice;

  // console.log("Market Cap USD:", marketCapUSD, "ETH Price:", infoETHCurrentPrice, "One Token Price ETH:", oneTokenPriceETH, "Total Supply Tokens:", totalSupplyTokens);

  // Handlers
  const handleMode = (m: "buy" | "sell") => {
    setMode(m);
    setAmount("");
    setErrorMsg("");
  };

  const handleMaxClick = useCallback(() => {
    if (mode === "sell" && getBalance) {
      const maxAmount = ethers.formatEther(getBalance.toString());
      setAmount(maxAmount);
    }
  }, [mode, getBalance]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!tokenAddress) return;
      setErrorMsg("");
      if (isConfirming) return;

      // Mark this txn as the actual mode (buy/sell) transaction.
      setLastTxnType(mode);
      writeContract({
        ...LAUNCHER_ABI,
        address: SAFU_LAUNCHER_CA,
        functionName: mode,
        args: mode === "sell" ? [tokenAddress, tokenValue] : [tokenAddress],
        value: mode === "buy" ? ethValue : undefined,
      });
      setIsProcessingTxn(true);
    },
    [
      isConfirming,
      writeContract,
      tokenAddress,
      mode,
      tokenValue,
      ethValue,
      LAUNCHER_ABI,
      SAFU_LAUNCHER_CA,
    ]
  );

  // Check if approval is needed whenever allowance or amount changes.
  useEffect(() => {
    if (
      mode === "sell" &&
      allowance !== undefined &&
      amount &&
      !isLoadingAllowance
    ) {
      const parsedAmount = ethers.parseEther(amount);
      setNeedsApproval(allowance < parsedAmount);
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, amount, isLoadingAllowance, mode]);

  // If a transaction error occurs (e.g. cancellation), reset the processing flag.
  useEffect(() => {
    if (error) {
      setIsProcessingTxn(false);
    }
  }, [error]);

  // Reset processing state when there's no active transaction.
  useEffect(() => {
    if (!txHash) {
      setIsProcessingTxn(false);
    }
  }, [txHash]);

  // Handle the sell process (approval first if needed, then sell)
  const handleSellProcess = useCallback(() => {
    if (needsApproval) {
      handleApprove();
    } else {
      handleSubmit({ preventDefault: () => {} } as FormEvent);
    }
  }, [needsApproval, handleApprove, handleSubmit]);

  // Refetch data after transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      refetchInfoData();
      refetchLatestETHPrice();
      refetchAmountOut();
      refetchBalance();
      refetchAllowance(); // Also refetch allowance after approval

      // Reset processing state after successful transaction
      setIsProcessingTxn(false);

      // Clear whitelist input after successful addition
      if (lastTxnType === "addToWhitelist") {
        setWhitelistAddresses("");
      }
    }
  }, [
    isConfirmed,
    txHash,
    refetchInfoData,
    refetchAmountOut,
    refetchBalance,
    refetchAllowance,
    refetchLatestETHPrice,
    lastTxnType,
  ]);

  // const API = `https://safulauncher-production.up.railway.app`;

  const API = import.meta.env.VITE_API_BASE_URL;

  // Load token metadata
  useEffect(() => {
    setIsLoadingToken(true);
    fetch(`${API}/api/tokens`)
      .then((res) => res.json())
      .then((all: TokenMetadata[]) => {
        const match = all.find(
          (t) => t.tokenAddress.toLowerCase() === tokenAddress?.toLowerCase()
        );
        setToken(match ?? null);
      })
      .catch(() => setToken(null))
      .finally(() => setIsLoadingToken(false));
  }, [tokenAddress]);

  useEffect(() => {
    // Only log transactions that are NOT approval transactions
    if (
      isConfirmed &&
      result &&
      tokenAddress &&
      (lastTxnType === "buy" || lastTxnType === "sell")
    ) {
      (async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const block = await provider.getBlock(result.blockNumber);
        // 2. convert UNIX timestamp to ISO string
        let timestamp = "";
        if (block && block.timestamp) {
          // timestamp is in seconds, so multiply by 1 000 to get ms
          const createdAtMs = block.timestamp * 1_000;
          timestamp = new Date(createdAtMs).toISOString();
          console.log("Created at: %s", timestamp);
        }
        const type = lastTxnType; // Use lastTxnType instead of mode
        const inputAmountStr =
          type === "buy"
            ? ethers.formatEther(ethValue)
            : ethers.formatEther(tokenValue);

        // 2. What came out of the swap
        const outputAmountStr = amountOut
          ? (Number(amountOut.toString()) / 1e18).toString()
          : "0";

        // 3. Build separate ethAmount & tokenAmount
        const body = {
          tokenAddress,
          type,
          ethAmount: type === "buy" ? inputAmountStr : outputAmountStr,
          tokenAmount: type === "buy" ? outputAmountStr : inputAmountStr,
          timestamp,
          txnHash: txHash,
          wallet: result.from,
        };

        await fetch(`${API}/api/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        // fetch updated logs
        fetchLogs();
      })().catch(console.error);
    }
  }, [isConfirmed, lastTxnType, tokenAddress, txHash, ethValue, tokenValue]);

  const fetchLogs = useCallback(() => {
    if (!tokenAddress) return;
    fetch(`${API}/api/transactions/${tokenAddress}`)
      .then((r) => r.json())
      .then((all: TxLog[]) => {
        // exclude non-buy/sell entries
        const filtered = all.filter(
          (tx) => tx.type === "buy" || tx.type === "sell"
        );
        setTxLogs(filtered);
      })
      .catch(console.error);
  }, [tokenAddress]);

  // initial load & after token change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Compute totals
  const totals = txLogs.reduce(
    (acc, tx) => {
      acc.totalEthSpent += parseFloat(tx.ethAmount);
      acc.totalTokensTraded += parseFloat(tx.tokenAmount);
      return acc;
    },
    { totalEthSpent: 0, totalTokensTraded: 0 }
  );

  const now = Date.now();
  const startOfToday = getStartOfCurrentDay();
  const logs1d = txLogs.filter(
    (tx) => new Date(tx.timestamp).getTime() >= startOfToday
  );
  const logs7d = txLogs.filter(
    (tx) => new Date(tx.timestamp).getTime() >= now - 7 * 24 * 60 * 60 * 1000
  );
  const logsAll = txLogs;

  const sumVolume = (logs: TxLog[]) =>
    logs.reduce((sum, tx) => sum + parseFloat(tx.ethAmount), 0);

  const volume1dEth = sumVolume(logs1d);
  const volume7dEth = sumVolume(logs7d);
  const volumeAllEth = sumVolume(logsAll);

  const volume1dUsd = volume1dEth * infoETHCurrentPrice;
  const volume7dUsd = volume7dEth * infoETHCurrentPrice;
  const volumeAllUsd = volumeAllEth * infoETHCurrentPrice;

  // Load token metadata
  useEffect(() => {
    if (!tokenAddress) return;
    setIsLoadingToken(true);
    fetch(`${API}/api/tokens`)
      .then((res) => res.json())
      .then((all: TokenMetadata[]) => {
        const match = all.find(
          (t) => t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
        );
        setToken(match ?? null);
      })
      .catch(() => setToken(null))
      .finally(() => setIsLoadingToken(false));
  }, [tokenAddress]);

  // TradingView widget
  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.onload = () => {
      // @ts-ignore
      new window.TradingView.widget({
        width: "100%",
        height: 350,
        symbol: token?.symbol || "ETH",
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0C0C2E",
        enable_publishing: false,
        hide_side_toolbar: true,
        allow_symbol_change: false,
        container_id: "tv_chart_container",
      });
    };

    document.body.appendChild(script);
  }, [token]);

  // Loading state for initial token load
  if (isLoadingToken) {
    return (
      <div className="min-h-screen flex flex-col ">
        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center text-center relative px-4">
          {/* Background glow effect */}
          <div className="absolute lg:size-[30rem] lg:w-[55rem] rounded-full bg-[#3BC3DB]/10 blur-3xl top-1/3 left-1/2 -translate-x-1/2 -z-10" />

          {/* Loading Spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#0C8CE0] border-opacity-70 mb-6" />

          {/* Text */}
          <p className="text-white text-lg lg:text-xl font-medium font-raleway drop-shadow-md">
            Loading token data...
          </p>
        </div>

        <Footer />
      </div>
    );
  }

  // Token not found
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col ">
        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center text-center relative px-4">
          {/* Glowing background effect */}
          <div className="absolute lg:size-[30rem] lg:w-[55rem] rounded-full bg-[#3BC3DB]/10 blur-3xl top-1/3 left-1/2 -translate-x-1/2 -z-10" />

          {/* Message */}
          <h2 className="font-raleway text-white text-3xl lg:text-5xl font-bold mb-4 drop-shadow-md mt-10">
            Token Not Found!
          </h2>
          <p className="text-red-400 text-lg lg:text-xl mb-6">
            The requested token could not be loaded or doesn't exist.
          </p>

          <a
            href="/tokens"
            className="mt-4 inline-block bg-[#0C8CE0] hover:bg-[#117ac2] transition px-6 py-3 text-white rounded-full shadow-lg font-medium"
          >
            Return to Tokens
          </a>
        </div>

        <Footer />
      </div>
    );
  }

  // Get button text based on mode and approval status
  const getButtonText = () => {
    if (isWritePending) return "Confirming...";
    if (isConfirming) return "Processing...";

    if (mode === "buy") {
      return "Buy";
    } else {
      return needsApproval ? "Approve" : "Sell";
    }
  };

  // Handle button click based on mode and approval status
  const handleButtonClick = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "buy") {
      handleSubmit(e);
    } else {
      handleSellProcess();
    }
  };

  // Get admin transaction status message
  const getAdminTxnMessage = () => {
    switch (lastTxnType) {
      case "startTrading":
        return "Trading started successfully!";
      case "addToWhitelist":
        return "Addresses added to whitelist successfully!";
      case "disableWhitelist":
        return "Whitelist disabled successfully!";
      default:
        return "Transaction confirmed successfully!";
    }
  };

  return (
    <>
      <div className="">
        <Navbar />
        <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <DustParticles key={i} />
          ))}
        </div>
        <div className="lg:size-[30rem] lg:w-[55rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
        <div className="lg:size-[30rem] lg:w-[40rem] rounded-full bg-[#3BC3DB]/10 absolute top-[800px] -left-40 blur-3xl hidden dark:block"></div>
        <div className="mx-auto pt-40 mb-20 px-4 lg:px-0 relative text-white max-w-[85rem]">
          <div className="grid lg:grid-cols-[.4fr_.6fr] gap-10">
            <div>
              <h1 className="text-2xl font-bold dark:text-white text-black font-raleway">
                Trade {token.name}{" "}
                <span className="dark:text-white/60 text-black/80">
                  ({token.symbol})
                </span>
              </h1>
              <div className="grid md:grid-cols-2 mb-2.5 gap-4 mt-2.5 max-w-[30rem]">
                <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/4 rounded-xl p-2.5 flex items-center justify-between">
                  <p className="dark:text-white text-black">
                    <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                      Token Supply:
                    </span>{" "}
                    {(tokenSupply / 1e18).toLocaleString()}
                  </p>
                </div>
                <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/4 rounded-xl p-2.5 flex items-center justify-between">
                  <p className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                    Trading Started:
                  </p>{" "}
                  {isStartTrading ? (
                    <div className="bg-[#27AE60] rounded-full p-3 flex items-center justify-center">
                      <FiCheckCircle className="text-white" />
                    </div>
                  ) : (
                    <div className="bg-white flex rounded-full p-3 items-center justify-center">
                      <MdOutlineCancel className="text-black" />
                    </div>
                  )}
                </div>
                <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/4 rounded-xl p-2.5 flex items-center justify-between">
                  <p className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                    Whitelist Ongoing:
                  </p>{" "}
                  {isWhiteListOngoing ? (
                    <div className="bg-[#27AE60] rounded-full p-3 flex items-center justify-center">
                      <FiCheckCircle className="text-black" />
                    </div>
                  ) : (
                    <div className="bg-white flex rounded-full p-3 items-center justify-center">
                      <MdOutlineCancel className="text-black" />
                    </div>
                  )}
                </div>
                <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/4 rounded-xl p-2.5 flex items-center justify-between">
                  <p className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                    Listed on Uniswap:
                  </p>{" "}
                  {isListed ? (
                    <div className="bg-[#27AE60] rounded-full p-3 flex items-center justify-center">
                      <FiCheckCircle className="text-black" />
                    </div>
                  ) : (
                    <div className="bg-white flex rounded-full p-3 items-center justify-center">
                      <MdOutlineCancel className="text-black" />
                    </div>
                  )}
                </div>
              </div>
              <div className="max-w-[30rem] rounded-xl p-5 mt-6 dark:bg-white/5 bg-[#141313]/4 border border-white/10 backdrop-blur-md space-y-3">
                <h2 className="text-xl font-semibold dark:text-white text-black flex items-center font-raleway">
                  Volume Summary
                </h2>
                <div className="space-y-1 ">
                  <p className="flex justify-between">
                    <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                      Today
                    </span>
                    <span className="dark:text-white text-black">
                      {volume1dEth.toFixed(4)} ETH ($
                      {volume1dUsd.toLocaleString()})
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                      7 Days
                    </span>
                    <span className="dark:text-white text-black">
                      {volume7dEth.toFixed(4)} ETH ($
                      {volume7dUsd.toLocaleString()})
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                      All Time
                    </span>
                    <span className="dark:text-white text-black">
                      {volumeAllEth.toFixed(4)} ETH ($
                      {volumeAllUsd.toLocaleString()})
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4 max-w-[30rem] dark:bg-white/5 bg-[#141313]/4 border border-white/10 backdrop-blur-md rounded-xl p-4 text-white/90 space-y-2">
                <p className="flex justify-between">
                  <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                    Total ETH Traded
                  </span>
                  <span className="dark:text-white text-black">
                    {totals.totalEthSpent.toFixed(4)} ETH
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                    Total {token.symbol} Traded
                  </span>
                  <span className="dark:text-white text-black">
                    {formatVolume(totals.totalTokensTraded)} {token.symbol}
                  </span>
                </p>
              </div>
              {!isTokenCreator && (
                <div className="rounded-xl max-w-[30rem] p-5 mt-6 space-y-4 dark:bg-white/5 bg-[#141313]/4 border border-white/10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold dark:text-white text-black font-raleway">
                      Admin Controls
                    </h3>
                    <button
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      disabled={isTransactionPending}
                      className="text-sm px-4 py-2 bg-[#0C8CE0] hover:bg-[#1b95e0] text-white rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      {showAdminPanel ? "Hide" : "Show"} Controls
                    </button>
                  </div>
                  {showAdminPanel && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="dark:text-white text-black font-medium mb-2">
                          Trading Control
                        </h4>
                        <button
                          onClick={handleStartTrading}
                          disabled={
                            isTransactionPending ||
                            isStartTrading === 1 ||
                            isProcessingTxn
                          }
                          className="w-full px-4 py-2 bg-[#27AE60] hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                        >
                          {isStartTrading === 1
                            ? "Trading Started"
                            : "Start Trading"}
                        </button>
                      </div>
                      <div>
                        <h4 className="dark:text-white text-black font-medium mb-2">
                          Whitelist Management
                        </h4>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={whitelistAddresses}
                            onChange={(e) =>
                              setWhitelistAddresses(e.target.value)
                            }
                            placeholder="Enter addresses separated by commas"
                            disabled={isTransactionPending || isProcessingTxn}
                            className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                          />
                          <button
                            onClick={handleAddToWhitelist}
                            disabled={
                              isTransactionPending ||
                              !whitelistAddresses.trim() ||
                              isProcessingTxn
                            }
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                        <button
                          onClick={handleDisableWhitelist}
                          disabled={isTransactionPending || isProcessingTxn}
                          className="w-full px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                        >
                          Disable Whitelist
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* top-section */}
              <div className="top-section mt-4">
                <div className="trade-widget dark:bg-white/5 bg-[#141313]/4 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-[30rem] text-white space-y-4">
                  {/* Tabs */}
                  <div className="flex space-x-6 text-lg font-medium border-b border-white/10 pb-2">
                    <button
                      className={`${
                        mode === "buy"
                          ? "dark:text-white text-[#0C8CE0]"
                          : "dark:text-white/50 text-[#141313]/75 font-normal"
                      } transition cursor-pointer`}
                      onClick={() => handleMode("buy")}
                      disabled={isTransactionPending}
                    >
                      Buy
                    </button>
                    <button
                      className={`${
                        mode === "sell"
                          ? "dark:text-white text-[#0C8CE0]"
                          : "dark:text-white/50 text-[#141313]/75 font-normal"
                      } transition cursor-pointer`}
                      onClick={() => handleMode("sell")}
                      disabled={isTransactionPending}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Balance */}
                  {mode === "sell" && (
                    <div className="text-sm dark:text-white/70 text-black">
                      Balance:{" "}
                      {isLoadingBalance ? (
                        <span className="italic text-white/50">Loading...</span>
                      ) : (
                        `${parseFloat(tokenBalance).toLocaleString()} ${
                          token.symbol
                        }`
                      )}
                    </div>
                  )}

                  {/* Form */}
                  <form className="space-y-4" onSubmit={handleButtonClick}>
                    <label className="block text-sm dark:text-white/70 text-black font-medium">
                      Amount ({mode === "buy" ? "ETH" : token.symbol})
                    </label>

                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      min="0"
                      step="any"
                      autoComplete="off"
                      disabled={isTransactionPending}
                      className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                    />
                    {mode === "sell" && (
                      <button
                        type="button"
                        onClick={handleMaxClick}
                        disabled={
                          isTransactionPending ||
                          isLoadingBalance ||
                          !getBalance
                        }
                        className="text-xs text-blue-400 font-medium"
                      >
                        {isLoadingBalance ? "..." : "Max"}
                      </button>
                    )}

                    {/* Output */}
                    <div className="text-sm dark:text-white text-[#141313]">
                      {isLoadingAmountOut ? (
                        <span className="italic dark:text-white/50 text-black/50">
                          Calculating...
                        </span>
                      ) : (
                        <>
                          You will receive{" "}
                          <span className=" font-semibold">
                            {amountOut && mode === "buy"
                              ? (
                                  Number(amountOut.toString()) / 1e18
                                ).toLocaleString()
                              : amountOut && mode === "sell"
                              ? (Number(amountOut.toString()) / 1e18).toFixed(
                                  18
                                )
                              : 0}
                          </span>{" "}
                          {mode === "buy" ? token.symbol : "ETH"}
                        </>
                      )}
                    </div>

                    {/* Approval warning */}
                    {mode === "sell" && needsApproval && (
                      <div className="text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-md">
                        ⚠️ Approval required to sell tokens
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className={`w-full rounded-xl py-3 text-white font-semibold text-center bg-blue-500 hover:bg-blue-600 transition ${
                        isTransactionPending
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={
                        isTransactionPending ||
                        !amount ||
                        parseFloat(amount) <= 0
                      }
                    >
                      {getButtonText()}
                      {isTransactionPending && (
                        <span className="ml-2 animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      )}
                    </button>
                  </form>

                  {/* Messages */}
                  {isWritePending && (
                    <div className="text-sm text-yellow-400 bg-yellow-500/10 p-2 rounded-md">
                      Please confirm the transaction in your wallet
                    </div>
                  )}
                  {isConfirming && (
                    <div className="text-sm text-blue-400 bg-blue-500/10 p-2 rounded-md">
                      Transaction submitted. Waiting for confirmation...
                    </div>
                  )}
                  {isConfirmed && txHash && (
                    <div className="status-message success">
                      <p>
                        {lastTxnType === "approval"
                          ? "Approval confirmed! You can now sell tokens."
                          : lastTxnType === "sell"
                          ? "Sell transaction confirmed successfully!"
                          : lastTxnType === "buy"
                          ? "Buy transaction confirmed successfully!"
                          : [
                              "startTrading",
                              "addToWhitelist",
                              "disableWhitelist",
                            ].includes(lastTxnType!)
                          ? getAdminTxnMessage()
                          : "Transaction confirmed successfully!"}
                      </p>
                      <p className="text-sm text-gray-300">
                        Transaction: {txHash}
                      </p>
                    </div>
                  )}
                  {errorMsg && (
                    <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md">
                      {errorMsg}
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md">
                      Error:{" "}
                      {"shortMessage" in (error as any)
                        ? (error as any).shortMessage
                        : (error as Error).message}
                    </div>
                  )}
                </div>
              </div>

              {/* <div className="progress-section">
                <div className="progress-label">
                  Bonding Progress:{" "}
                  {isLoadingInfoData ? (
                    <span className="loading-text">Loading...</span>
                  ) : (
                    `${curvePercentClamped.toFixed(0)}%`
                  )}
                </div>
                <div
                  style={{
                    background: "#eee",
                    borderRadius: 4,
                    overflow: "hidden",
                    height: 10,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${curveProgressMap[token.tokenAddress] || 0}%`,
                      background: "#4caf50",
                      height: "100%",
                    }}
                  />
                </div>
              </div> */}
              <div className="progress-section mt-6">
                <div className="progress-label dark:text-white text-[#141313]/90 font-medium text-lg font-raleway mb-2">
                  Bonding Curve Progress:{" "}
                  {isLoadingInfoData ? (
                    <span className="loading-text text-gray-400">
                      Loading...
                    </span>
                  ) : (
                    `${curvePercentClamped.toFixed(0)}%`
                  )}
                </div>

                {/* Styled progress bar with dynamic gradient */}
                <div className="bg-[#031E51] h-10 rounded-full w-full max-w-[40rem] p-1.5 relative overflow-hidden">
                  {(() => {
                    const progress = curveProgressMap[token.tokenAddress] || 0;

                    // Choose gradient style based on progress
                    let gradientClass = "bg-orange-700";

                    if (progress >= 70) {
                      gradientClass =
                        "bg-gradient-to-r from-green-500 to-green-300";
                    } else if (progress >= 40) {
                      gradientClass =
                        "bg-gradient-to-r from-orange-700 via-yellow-400 to-green-500";
                    }

                    return (
                      <div
                        className={`h-full ${
                          progress < 100 ? "rounded-l-full" : "rounded-full"
                        } relative transition-all duration-500 ease-in-out ${gradientClass}`}
                        style={{ width: `${progress}%` }}
                      >
                        {/* Decorative vertical bars */}
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-[#031E51] h-full w-[5px] -skew-x-[24deg] absolute top-0"
                            style={{ left: `${31 * (i + 1)}px` }}
                          ></div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* right-section */}
            <div id="flex flex-col">
              <div className="font-raleway font-semibold mb-4 text dark:text-white text-black">
                Market Cap:{" "}
                {isLoadingOneTokenPrice || isLoadingLatestETHPrice ? (
                  <span className="loading-text">Loading...</span>
                ) : (
                  `$${marketCapUSD.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`
                )}
              </div>
              <div className="rounded-xl overflow-hidden bg-[#0C0C2E]/10 border border-white/10 shadow-2xl">
                <div id="tv_chart_container" className="h-full w-full" />
              </div>

              <div className="mt-[34px]">
                {/* Tabs Header */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className={`px-4 py-2 rounded-lg text-[20px] font-raleway font-medium ${
                      activeTab === "transactions"
                        ? " dark:text-white text-[#141314]"
                        : "dark:text-white/60 text-[#141314]/40"
                    } transition cursor-pointer`}
                  >
                    Recent Transactions
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`px-4 py-2 rounded-lg text-[20px] font-raleway font-medium ${
                      activeTab === "chat"
                        ? "dark:text-white text-[#141314]"
                        : "dark:text-white/60 text-[#141314]/40"
                    } transition cursor-pointer`}
                  >
                    Community Chat
                  </button>
                </div>

                {/* Tabs Content */}
                <div className=" backdrop-blur-md p-4">
                  {activeTab === "transactions" ? (
                    <div className="tx-table overflow-x-auto">
                      <table className="min-w-full text-sm dark:text-white/80">
                        <thead className="text-left dark:text-white/60 text-[#141313]/75 mb-4 border-white/10">
                          <tr>
                            <th>Type</th>
                            <th>Wallet</th>
                            <th>ETH</th>
                            <th>{token.symbol}</th>
                            <th>Txn</th>
                            <th>Date / Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txLogs.map((tx, i) => (
                            <tr key={i} className="mb-4">
                              <td
                                className={`font-medium py-3 flex items-center gap-2 ${
                                  tx.type === "buy"
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {tx.type === "buy" ? (
                                  <MdAddCircleOutline className="text-[22px]" />
                                ) : (
                                  <GrSubtractCircle className="text-xl" />
                                )}
                                {tx.type.charAt(0).toUpperCase() +
                                  tx.type.slice(1)}
                              </td>

                              <td className="dark:text-white/80 text-[#141313] font-semibold">
                                {tx.wallet.slice(0, 6)}…{tx.wallet.slice(-4)}
                              </td>
                              <td className="dark:text-white/80 text-[#141313] font-semibold">
                                {Number(tx.ethAmount).toFixed(4)}
                              </td>
                              <td className="dark:text-white/80 text-[#141313] font-semibold">
                                {Number(tx.tokenAmount).toLocaleString()}
                              </td>
                              <td>
                                <a
                                  href={`https://etherscan.io/tx/${tx.txnHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 hover:underline"
                                >
                                  {tx.txnHash.slice(0, 8)}…
                                  {tx.txnHash.slice(-6)}
                                </a>
                              </td>
                              <td className="dark:text-white/80 text-[#141313] font-semibold">
                                {formatUTC(tx.timestamp)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="chat space-y-4">
                      <h2 className="text-lg font-semibold text-white">
                        Community Chat
                      </h2>
                      <div
                        id="chatBody"
                        className="chat-body max-h-[300px] overflow-y-auto bg-[#0B132B]/30 p-3 rounded-lg border border-white/10"
                      />
                      <div className="chat-input flex items-center gap-2">
                        <input
                          id="chatInput"
                          placeholder="Type a message…"
                          className="flex-1 bg-[#0B132B] text-white placeholder-white/40 px-4 py-2 rounded-lg border border-white/10"
                        />
                        <button
                          id="sendBtn"
                          className="bg-[#0C8CE0] hover:bg-[#0C8CE0]/80 text-white px-4 py-2 rounded-lg"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
