// safu-dapp/src/pages/Trade.tsx
import {
  useEffect,
  useState,
  useCallback,
  type FormEvent,
  useMemo,
  useRef,
} from "react";
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
  pureAmountOut,
} from "../web3/readContracts";
import LightweightChart from "../web3/lightWeightChart";
import TimeframeSelector from "../web3/timeframeSelector";
import Footer from "../components/generalcomponents/Footer";
import Navbar from "../components/launchintro/Navbar";
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
  createdAt?: number;
  expiresAt?: number;
}

interface TxLog {
  type: "buy" | "sell";
  wallet: string;
  ethAmount: string;
  tokenAmount: string;
  txnHash: string;
  timestamp: string;
}

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

type TransactionType =
  | "approval"
  | "sell"
  | "buy"
  | "startTrading"
  | "addToWhitelist"
  | "disableWhitelist";

interface TimeframeOption {
  label: string;
  value: string;
  resolution: string;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  // Seconds
  { label: "1s", value: "1s", resolution: "1s", seconds: 1 },

  // Minutes
  { label: "1m", value: "1m", resolution: "1m", minutes: 1 },
  { label: "5m", value: "5m", resolution: "5m", minutes: 5 },
  { label: "15m", value: "15m", resolution: "15m", minutes: 15 },

  // Hours
  { label: "1h", value: "1h", resolution: "1h", hours: 1 },
  { label: "2h", value: "2h", resolution: "2h", hours: 2 },
  { label: "4h", value: "4h", resolution: "4h", hours: 4 },
  { label: "8h", value: "8h", resolution: "8h", hours: 8 },
  { label: "12h", value: "12h", resolution: "12h", hours: 12 },

  // Days
  { label: "1D", value: "1D", resolution: "1D", days: 1 },
  { label: "3D", value: "3D", resolution: "3D", days: 3 },

  // Weeks
  { label: "1W", value: "1W", resolution: "1W", days: 7 },

  // Months
  { label: "1M", value: "1M", resolution: "1M", days: 30 },
];

// Utility functions
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

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function formatTokenAmount(
  amount: string | number,
  decimals: number = 4
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export default function Trade() {
  const { address, isConnected } = useAccount();
  const { tokenAddress } = useParams<{ tokenAddress: `0x${string}` }>();

  const [fallbackAmountOut, setFallbackAmountOut] = useState<bigint | null>(
    null
  );
  const [isLoadingFallbackAmountOut, setIsLoadingFallbackAmountOut] =
    useState(false);

  // Core state
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [txLogs, setTxLogs] = useState<TxLog[]>([]);
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<string>("");
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessingTxn, setIsProcessingTxn] = useState(false);
  // Tabs for recent transactiona and community chat
  const [activeTab, setActiveTab] = useState<"transactions" | "chat">(
    "transactions"
  );

  // Fallback data for non-connected users
  const [fallbackInfoData, setFallbackInfoData] = useState<any[] | null>(null);
  const [fallbackETHPrice, setFallbackETHPrice] = useState<any | null>(null);

  // UI state
  const [curveProgressMap, setCurveProgressMap] = useState<
    Record<string, number>
  >({});
  const [oneTokenPriceETH, setOneTokenPriceETH] = useState<number | null>(null);
  const [isLoadingOneTokenPrice, setIsLoadingOneTokenPrice] = useState(false);
  const [ohlc, setOhlc] = useState<CandlestickData[]>([]);

  // Admin state
  const [whitelistAddresses, setWhitelistAddresses] = useState<string>("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [lastTxnType, setLastTxnType] = useState<TransactionType | null>(null);

  // New timeframe state
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(
    TIMEFRAME_OPTIONS.find((tf) => tf.value === "15m") || TIMEFRAME_OPTIONS[0]
  );
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingChartRef = useRef(false);

  // Memoized values
  const API = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);
  const isTokenCreator = useMemo(
    () =>
      address &&
      token &&
      address.toLowerCase() === token.tokenCreator.toLowerCase(),
    [address, token]
  );

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

  // Computed values with error handling
  const ethValue = useMemo(() => {
    try {
      return ethers.parseEther(mode === "buy" ? amount || "0" : "0");
    } catch {
      return BigInt(0);
    }
  }, [mode, amount]);

  const tokenValue = useMemo(() => {
    try {
      return ethers.parseEther(mode === "sell" ? amount || "0" : "0");
    } catch {
      return BigInt(0);
    }
  }, [mode, amount]);

  // Contract read hooks
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

  // Add this useEffect to handle the async call
  useEffect(() => {
    if (!isConnected && tokenAddress && (ethValue > 0n || tokenValue > 0n)) {
      setIsLoadingFallbackAmountOut(true);
      pureAmountOut(
        tokenAddress,
        mode === "buy" ? ethValue : tokenValue,
        mode === "buy"
      )
        .then((result) => {
          setFallbackAmountOut(result || null);
        })
        .catch((error) => {
          console.error("Error fetching fallback amount out:", error);
          setFallbackAmountOut(null);
        })
        .finally(() => {
          setIsLoadingFallbackAmountOut(false);
        });
    } else if (isConnected) {
      setFallbackAmountOut(null);
    }
  }, [isConnected, tokenAddress, ethValue, tokenValue, mode]);

  // Update your amountOutSelect logic
  const amountOutSelect = isConnected ? amountOut : fallbackAmountOut;
  const isLoadingAmountOutSelect = isConnected
    ? isLoadingAmountOut
    : isLoadingFallbackAmountOut;

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

  const {
    data: latestETHPrice,
    isLoading: isLoadingLatestETHPrice,
    refetch: refetchLatestETHPrice,
  } = useReadContract({
    ...PRICE_GETTER_ABI,
    functionName: "getLatestETHPrice",
    args: [ETH_USDT_PRICE_FEED!],
  });

  // Computed contract data
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

  const infoETHCurrentPrice =
    isConnected && !isLoadingLatestETHPrice
      ? Number(latestETHPrice) / 1e8
      : Number(fallbackETHPrice) / 1e8;
  const tokenBalance = getBalance
    ? ethers.formatEther(getBalance.toString())
    : "0";
  const isTransactionPending = isWritePending || isConfirming;

  // Market cap calculations
  const totalSupplyTokens = tokenSupply / 1e18;
  const marketCapETH =
    oneTokenPriceETH !== null ? oneTokenPriceETH * totalSupplyTokens : 0;
  const marketCapUSD = marketCapETH * infoETHCurrentPrice;
  const tokenPriceUSD =
    oneTokenPriceETH !== null ? oneTokenPriceETH * infoETHCurrentPrice : 0;

  // Load fallback data for non-connected users
  useEffect(() => {
    if (!isConnected && tokenAddress) {
      Promise.all([
        pureInfoDataRaw(tokenAddress).catch(() => []),
        ETH_USDT_PRICE_FEED
          ? pureGetLatestETHPrice(ETH_USDT_PRICE_FEED).catch(() => null)
          : Promise.resolve(null),
      ]).then(([infoData, ethPrice]) => {
        setFallbackInfoData(Array.isArray(infoData) ? infoData : []);
        setFallbackETHPrice(ethPrice);
      });
    }
  }, [isConnected, tokenAddress]);

  // Load one token price
  useEffect(() => {
    if (tokenAddress) {
      setIsLoadingOneTokenPrice(true);
      pureAmountOutMarketCap(tokenAddress)
        .then((raw) => {
          if (raw !== undefined && raw !== null) {
            const eth = Number(raw.toString()) / 1e18;
            setOneTokenPriceETH(eth);
          } else {
            setOneTokenPriceETH(0);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch single-token price:", err);
          setOneTokenPriceETH(0);
        })
        .finally(() => setIsLoadingOneTokenPrice(false));

      setCurveProgressMap((prev) => ({
        ...prev,
        [tokenAddress]: curvePercentClamped,
      }));
    }
  }, [tokenAddress, curvePercentClamped, isLoadingOneTokenPrice]);

  const loadChartData = useCallback(
    async (isAutoUpdate = false) => {
      if (!tokenAddress || isLoadingChartRef.current) return;

      // Prevent concurrent chart updates
      isLoadingChartRef.current = true;

      if (!isAutoUpdate) {
        setIsLoadingChart(true);
      }

      try {
        console.log(
          `${
            isAutoUpdate ? "Auto-" : ""
          }Loading OHLC data for token: ${tokenAddress}, timeframe: ${
            selectedTimeframe.value
          }`
        );

        const period = calculatePeriod(selectedTimeframe);
        const timestamp = Date.now();

        const ohlcResponse = await fetch(
          `${API}/api/ohlc/${tokenAddress}?resolution=${selectedTimeframe.resolution}&period=${period}&t=${timestamp}`
        );
        const ohlcData = await ohlcResponse.json();

        if (Array.isArray(ohlcData) && ohlcData.length > 0) {
          const formattedData = ohlcData
            .map((d) => ({
              time:
                typeof d.time === "number"
                  ? d.time
                  : Math.floor(new Date(d.time).getTime() / 1000),
              open: Number(d.open) || 0,
              high: Number(d.high) || 0,
              low: Number(d.low) || 0,
              close: Number(d.close) || 0,
              volume: Number(d.volume) || 0,
            }))
            .filter(
              (d) =>
                d.open > 0 &&
                d.high > 0 &&
                d.low > 0 &&
                d.close > 0 &&
                d.time > 0 &&
                !isNaN(d.time)
            );

          setOhlc(formattedData);
          setLastUpdateTime(Date.now());

          if (isAutoUpdate) {
            console.log("Chart auto-updated with new data");
          }
        } else {
          console.log("No OHLC data available");
          if (!isAutoUpdate) {
            setOhlc([]);
          }
        }
      } catch (error) {
        console.error("Error loading chart data:", error);
        if (!isAutoUpdate) {
          setOhlc([]);
        }
      } finally {
        isLoadingChartRef.current = false;
        if (!isAutoUpdate) {
          setIsLoadingChart(false);
        }
      }
    },
    [tokenAddress, selectedTimeframe, API]
  );

  // Setup auto-update interval
  useEffect(() => {
    if (!isAutoUpdateEnabled || !tokenAddress) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Determine update frequency based on timeframe
    const getUpdateInterval = () => {
      if (selectedTimeframe.seconds) {
        return Math.max(2000, selectedTimeframe.seconds * 1000); // At least 2 seconds
      } else if (selectedTimeframe.minutes) {
        return Math.max(10000, (selectedTimeframe.minutes * 60 * 1000) / 6); // Update 6 times per timeframe period
      } else if (selectedTimeframe.hours) {
        return Math.max(30000, (selectedTimeframe.hours * 60 * 60 * 1000) / 12); // Update 12 times per timeframe period
      } else {
        return 60000; // Default 1 minute for daily/weekly/monthly
      }
    };

    const updateInterval = getUpdateInterval();
    console.log(
      `Setting up auto-update with interval: ${updateInterval}ms for timeframe: ${selectedTimeframe.value}`
    );

    intervalRef.current = setInterval(() => {
      loadChartData(true);
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoUpdateEnabled, tokenAddress, selectedTimeframe, loadChartData]);

  useEffect(() => {
    if (!tokenAddress) return;
    loadChartData(false);
  }, [tokenAddress, selectedTimeframe, loadChartData]);

  // Calculate period based on timeframe for data fetching
  const calculatePeriod = (timeframe: TimeframeOption): string => {
    if (timeframe.seconds) {
      // For seconds, fetch last few minutes of data
      return `${Math.max(300, timeframe.seconds * 100)}s`; // At least 5 minutes
    } else if (timeframe.minutes) {
      // For minutes, fetch proportional hours
      const hours = Math.max(4, timeframe.minutes * 4);
      return `${hours}h`;
    } else if (timeframe.hours) {
      // For hours, fetch proportional days
      const days = Math.max(1, Math.ceil(timeframe.hours * 3));
      return `${days}d`;
    } else if (timeframe.days) {
      // For days, fetch proportional period
      if (timeframe.days <= 3) {
        return `${timeframe.days * 7}d`; // Show more context
      } else if (timeframe.days === 7) {
        return "2M"; // 2 months for weekly
      } else {
        return "6M"; // 6 months for monthly
      }
    }
    return "30d"; // Default fallback
  };

  // Enhanced timeframe change handler
  const handleTimeframeChange = useCallback(
    (timeframe: TimeframeOption) => {
      setSelectedTimeframe(timeframe);
      // Immediately load new data for the selected timeframe
      setTimeout(() => loadChartData(false), 100);
    },
    [loadChartData]
  );

  // Add toggle for auto-update
  const toggleAutoUpdate = useCallback(() => {
    setIsAutoUpdateEnabled((prev) => !prev);
  }, []);

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
  }, [tokenAddress, API]);

  // Check approval needs
  useEffect(() => {
    if (
      mode === "sell" &&
      allowance !== undefined &&
      amount &&
      !isLoadingAllowance
    ) {
      try {
        const parsedAmount = ethers.parseEther(amount);
        setNeedsApproval(allowance < parsedAmount);
      } catch {
        setNeedsApproval(false);
      }
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, amount, isLoadingAllowance, mode]);

  // Handle transaction errors
  useEffect(() => {
    if (error) {
      setIsProcessingTxn(false);
    }
  }, [error]);

  // Reset processing state
  useEffect(() => {
    if (!txHash) {
      setIsProcessingTxn(false);
    }
  }, [txHash]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      refetchInfoData();
      refetchLatestETHPrice();
      refetchAmountOut();
      refetchBalance();
      refetchAllowance();
      setIsProcessingTxn(false);

      // Immediate chart update after successful transaction
      if (lastTxnType === "buy" || lastTxnType === "sell") {
        console.log("Transaction confirmed, updating chart immediately");
        // Small delay to ensure backend has processed the transaction
        setTimeout(() => {
          loadChartData(true);
        }, 2000);
      }

      if (lastTxnType === "addToWhitelist") {
        setWhitelistAddresses("");
      }
    }
  }, [
    isConfirmed,
    txHash,
    lastTxnType,
    loadChartData,
    refetchInfoData,
    refetchAmountOut,
    refetchBalance,
    refetchAllowance,
    refetchLatestETHPrice,
    lastTxnType,
  ]);

  // Log transactions
  useEffect(() => {
    if (
      isConfirmed &&
      result &&
      tokenAddress &&
      (lastTxnType === "buy" || lastTxnType === "sell")
    ) {
      (async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const block = await provider.getBlock(result.blockNumber);

          let timestamp = "";
          if (block?.timestamp) {
            timestamp = new Date(block.timestamp * 1000).toISOString();
          }

          const type = lastTxnType;
          const inputAmountStr =
            type === "buy"
              ? ethers.formatEther(ethValue)
              : ethers.formatEther(tokenValue);

          const outputAmountStr = amountOut
            ? (Number(amountOut.toString()) / 1e18).toString()
            : "0";

          const body = {
            tokenAddress,
            type,
            ethAmount: type === "buy" ? inputAmountStr : outputAmountStr,
            tokenAmount: type === "buy" ? outputAmountStr : inputAmountStr,
            timestamp,
            txnHash: txHash,
            wallet: result.from,
          };

          const response = await fetch(`${API}/api/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!response.ok) {
            if (response.status === 409) {
              console.warn("Transaction already logged; skipping duplicate.");
            } else {
              console.error(
                "Error logging transaction:",
                response.status,
                await response.text()
              );
            }
          }
        } catch (error) {
          console.error("Error logging transaction:", error);
        }
      })();
    }
  }, [
    isConfirmed,
    lastTxnType,
    tokenAddress,
    txHash,
    ethValue,
    tokenValue,
    API,
    amountOut,
    result,
  ]);

  // Enhanced fetchLogs with callback for chart update
  const fetchLogsWithCallback = useCallback(async () => {
    if (!tokenAddress) return;

    try {
      const response = await fetch(`${API}/api/transactions/${tokenAddress}`);
      const all: TxLog[] = await response.json();
      const filtered = all.filter(
        (tx) => tx.type === "buy" || tx.type === "sell"
      );

      // Check if we have new transactions
      const hasNewTransactions = filtered.length > txLogs.length;
      setTxLogs(filtered);

      // If we have new transactions and auto-update is enabled, refresh chart
      if (hasNewTransactions && isAutoUpdateEnabled && filtered.length > 0) {
        console.log("New transactions detected, updating chart");
        setTimeout(() => loadChartData(true), 1000);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  }, [tokenAddress, API, txLogs.length, isAutoUpdateEnabled, loadChartData]);

  // Replace the existing fetchLogs effect
  useEffect(() => {
    fetchLogsWithCallback();

    // Set up periodic log fetching to catch external transactions
    const logInterval = setInterval(fetchLogsWithCallback, 15000); // Check every 15 seconds

    return () => clearInterval(logInterval);
  }, [fetchLogsWithCallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Volume calculations
  const now = Date.now();
  const startOfToday = getStartOfCurrentDay();
  const logs1d = txLogs.filter(
    (tx) => new Date(tx.timestamp).getTime() >= startOfToday
  );
  const logs7d = txLogs.filter(
    (tx) => new Date(tx.timestamp).getTime() >= now - 7 * 24 * 60 * 60 * 1000
  );

  const sumVolume = (logs: TxLog[]) =>
    logs.reduce((sum, tx) => sum + parseFloat(tx.ethAmount), 0);
  const volume1dEth = sumVolume(logs1d);
  const volume7dEth = sumVolume(logs7d);
  const volumeAllEth = sumVolume(txLogs);

  const volume1dUsd = volume1dEth * infoETHCurrentPrice;
  const volume7dUsd = volume7dEth * infoETHCurrentPrice;
  const volumeAllUsd = volumeAllEth * infoETHCurrentPrice;

  // const totals = txLogs.reduce((acc, tx) => {
  //     acc.totalEthSpent += parseFloat(tx.ethAmount);
  //     acc.totalTokensTraded += parseFloat(tx.tokenAmount);
  //     return acc;
  // }, { totalEthSpent: 0, totalTokensTraded: 0 });

  // Event handlers
  const handleMode = useCallback((m: "buy" | "sell") => {
    setMode(m);
    setAmount("");
    setErrorMsg("");
  }, []);

  const handleMaxClick = useCallback(() => {
    if (mode === "sell" && getBalance) {
      const maxAmount = ethers.formatEther(getBalance.toString());
      setAmount(maxAmount);
    }
  }, [mode, getBalance]);

  const validateWhitelistAddresses = useCallback(
    (addresses: string): string[] | null => {
      const addressList = addresses
        .split(",")
        .map((addr) => addr.trim())
        .filter((addr) => addr.length > 0);

      if (addressList.length === 0) return null;

      const invalidAddresses = addressList.filter(
        (addr) => !isValidEthereumAddress(addr)
      );
      if (invalidAddresses.length > 0) {
        setErrorMsg(
          `Invalid Ethereum addresses: ${invalidAddresses.join(", ")}`
        );
        return null;
      }

      return addressList;
    },
    []
  );

  // Contract interaction handlers
  const handleApprove = useCallback(() => {
    if (
      !tokenAddress ||
      isLoadingAllowance ||
      isConfirming ||
      mode !== "sell" ||
      !amount
    ) {
      setErrorMsg("Invalid approval request");
      return;
    }

    setErrorMsg("");
    setLastTxnType("approval");

    writeContract({
      ...TOKEN_ABI,
      functionName: "approve",
      address: tokenAddress,
      args: [SAFU_LAUNCHER_CA as `0x${string}`, tokenValue],
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
  ]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!tokenAddress || isConfirming) return;

      setErrorMsg("");
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
    [isConfirming, writeContract, tokenAddress, mode, tokenValue, ethValue]
  );

  const handleSellProcess = useCallback(() => {
    if (needsApproval) {
      handleApprove();
    } else {
      handleSubmit({ preventDefault: () => {} } as FormEvent);
    }
  }, [needsApproval, handleApprove, handleSubmit]);

  // Admin handlers
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
  }, [writeContract, tokenAddress, isTokenCreator]);

  const handleAddToWhitelist = useCallback(() => {
    if (!tokenAddress || !isTokenCreator || !whitelistAddresses.trim()) {
      setErrorMsg("Please enter valid addresses to whitelist");
      return;
    }

    const addresses = validateWhitelistAddresses(whitelistAddresses);
    if (!addresses) return;

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
    validateWhitelistAddresses,
  ]);

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
  }, [writeContract, tokenAddress, isTokenCreator]);

  const handleButtonClick = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (mode === "buy") {
        handleSubmit(e);
      } else {
        handleSellProcess();
      }
    },
    [mode, handleSubmit, handleSellProcess]
  );

  // UI helper functions
  const getButtonText = () => {
    if (isWritePending) return "Confirming...";
    if (isConfirming) return "Processing...";
    return mode === "buy" ? "Buy" : needsApproval ? "Approve" : "Sell";
  };

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

  // Loading state
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

  return (
    <div className="relative">
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
          {/* Left section */}
          <div>
            <h1 className="text-2xl font-bold dark:text-white text-black font-raleway">
              Trade {token.name}{" "}
              <span className="dark:text-white/60 text-black/80">
                ({token.symbol})
              </span>
            </h1>
            <div className="grid mb-2.5 gap-4 mt-2.5 max-w-[30rem]">
              {/* Token info */}

              <div className="grid lg:grid-cols-2 mb-2.5 gap-4 mt-2.5 max-w-[30rem]">
                <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/4 rounded-xl p-2.5 flex items-center justify-between">
                  <p className="dark:text-white text-black">
                    <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                      Token Supply:
                    </span>{" "}
                    {(tokenSupply / 1e18).toLocaleString()}
                  </p>
                </div>
                <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/4 rounded-xl p-2.5 flex items-center justify-between">
                  <p className="dark:text-white text-black">
                    <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                      Token Price:
                    </span>{" "}
                    {tokenPriceUSD > 0 ? `$${tokenPriceUSD}` : "Calculating..."}
                  </p>
                </div>
                <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/4 rounded-xl p-2.5 flex items-center justify-between">
                  <p className="dark:text-white text-black">
                    <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                      Market Cap:
                    </span>{" "}
                    {marketCapUSD > 0
                      ? `$${formatTokenAmount(marketCapUSD)}`
                      : "Calculating..."}
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
            </div>

            {/* Admin Panel */}
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
                    id="amount-input"
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
                        isTransactionPending || isLoadingBalance || !getBalance
                      }
                      className="text-xs text-blue-400 font-medium"
                    >
                      {isLoadingBalance ? "..." : "Max"}
                    </button>
                  )}

                  {/* Output */}
                  <div className="text-sm dark:text-white text-[#141313]">
                    {isLoadingAmountOutSelect ? (
                      <span className="italic dark:text-white/50 text-black/50">
                        Calculating...
                      </span>
                    ) : (
                      <>
                        You will receive{" "}
                        {amountOutSelect
                          ? formatTokenAmount(
                              Number(amountOutSelect.toString()) / 1e18,
                              mode === "sell" ? 8 : 2
                            )
                          : "0"}{" "}
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
                      isTransactionPending || !amount || parseFloat(amount) <= 0
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

            {/* Progress Bar */}
            <div className="progress-section mt-6">
              <div className="progress-label dark:text-white text-[#141313]/90 font-medium text-lg font-raleway mb-2">
                Bonding Curve Progress:{" "}
                {isLoadingInfoData ? (
                  <span className="loading-text text-gray-400">Loading...</span>
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

          {/* Right section */}

          <div>
            <div className="chart-header">
              <h3 className="text-2xl font-bold dark:text-white text-black font-raleway">
                Price Chart
              </h3>
              <div className="chart-controls">
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={handleTimeframeChange}
                  disabled={isLoadingChart}
                />
                <button
                  className={`auto-update-toggle ${
                    isAutoUpdateEnabled ? "active" : ""
                  }`}
                  onClick={toggleAutoUpdate}
                  title={
                    isAutoUpdateEnabled
                      ? "Disable auto-update"
                      : "Enable auto-update"
                  }
                >
                  {isAutoUpdateEnabled ? "🔄 Auto" : "⏸️ Manual"}
                </button>
                <div className="last-update">
                  Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="chart-container">
              {isLoadingChart ? (
                <div className="chart-loading">
                  <div className="spinner"></div>
                  <p>Loading chart data...</p>
                </div>
              ) : (
                <LightweightChart
                  data={ohlc}
                  timeframe={selectedTimeframe.resolution}
                  height={500}
                  ethToUsdRate={infoETHCurrentPrice}
                  totalSupply={tokenSupply / 1e18}
                  symbol={token.symbol}
                />
              )}

              {/* Auto-update indicator */}
              {isAutoUpdateEnabled && (
                <div className="auto-update-indicator">
                  <span className="pulse-dot"></span>
                  Live
                </div>
              )}
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
                                {tx.txnHash.slice(0, 8)}…{tx.txnHash.slice(-6)}
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
                    {/* <div
                      id="chatBody"
                      className="chat-body max-h-[300px] overflow-y-auto bg-[#0B132B]/30 p-3 rounded-lg border border-white/10"
                    /> */}
                    <div className="chat-input flex items-center gap-2 max-w-[30rem]">
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
  );
}
