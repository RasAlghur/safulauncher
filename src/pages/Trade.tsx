// safu-dapp/src/pages/Trade.tsx
import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  type FormEvent,
  useMemo,
} from "react";
import * as XLSX from "xlsx";
import { useParams } from "react-router-dom";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import {
  TOKEN_ABI,
  LAUNCHER_ABI,
  SAFU_LAUNCHER_CA,
  ETH_USDT_PRICE_FEED,
  PRICE_GETTER_ABI,
  SAFU_TOKEN_CA,
} from "../web3/config";
import { MaxUint256, ethers } from "ethers";
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
import { Upload } from "lucide-react";
import { base } from "../lib/api";
import { socket } from "../lib/socket";
import Chat from "./chat";
import {
  FaArrowDown,
  FaChevronLeft,
  FaChevronRight,
  FaEthereum,
} from "react-icons/fa";
import { RiArrowUpDownFill } from "react-icons/ri";
import { useUser } from "../context/user.context";

/**
 * Description placeholder
 *
 * @interface ValidationError
 * @typedef {ValidationError}
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Description placeholder
 *
 * @interface TokenMetadata
 * @typedef {TokenMetadata}
 */
interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  percentBundled?: string;
  createdAt?: number;
  expiresAt?: number;
}

/**
 * Description placeholder
 *
 * @interface TxLog
 * @typedef {TxLog}
 */
interface TxLog {
  type: "buy" | "sell";
  wallet: string;
  ethAmount: string;
  tokenAmount: string;
  txnHash: string;
  timestamp: string;
}

/**
 * Description placeholder
 *
 * @interface CandlestickData
 * @typedef {CandlestickData}
 */
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
  | "disableWhitelist"
  | "disableMaxWalletLimit";

/**
 * Description placeholder
 *
 * @interface TimeframeOption
 * @typedef {TimeframeOption}
 */
interface TimeframeOption {
  label: string;
  value: string;
  resolution: string;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/**
 * Description placeholder
 *
 * @type {TimeframeOption[]}
 */
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
/**
 * Description placeholder
 *
 * @param {string} isoString
 * @returns {string}
 */
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

/**
 * Description placeholder
 *
 * @returns {number}
 */
function getStartOfCurrentDay(): number {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.getTime();
}

/**
 * Description placeholder
 *
 * @param {string} address
 * @returns {boolean}
 */
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

/**
 * Description placeholder
 *
 * @export
 * @returns {*}
 */
export default function Trade() {
  const { address, isConnected } = useAccount();
  const { saveOrFetchUser } = useUser();

  const {
    data: userETHBalance,
    isLoading: isLoadingUserETHBal,
    refetch: refetchETHBalance,
  } = useBalance({
    address,
  });
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
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 25;

  const indexOfLastTx = currentPage * transactionsPerPage;
  const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
  const currentTxLogs = txLogs.slice(indexOfFirstTx, indexOfLastTx);

  const totalPages = Math.ceil(txLogs.length / transactionsPerPage);

  const [wlCsvText, setWlCsvText] = useState("");

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isFormValid, setIsFormValid] = useState(false);

  const [whitelistUpload, setWhitelistUpload] = useState<
    { address: string; cap: number }[]
  >([]);

  // Fallback data for non-connected users
  const [fallbackInfoData, setFallbackInfoData] = useState<unknown[] | null>(
    null
  );
  const [fallbackETHPrice, setFallbackETHPrice] = useState<
    bigint | null | undefined
  >(null);

  // UI state
  const [curveProgressMap, setCurveProgressMap] = useState<
    Record<string, number>
  >({});
  const [oneTokenPriceETH, setOneTokenPriceETH] = useState<number | null>(null);
  const [isLoadingOneTokenPrice, setIsLoadingOneTokenPrice] = useState(false);
  const [ohlc, setOhlc] = useState<CandlestickData[]>([]);

  // Admin state
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

  // Initialize when wallet connects and set up real-time fetches
  useEffect(() => {
    let isMounted = true;
    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, address, saveOrFetchUser]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [txLogs]);

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

  const {
    data: whitelistBalance,
    isLoading: isLoadingWhitelistBalance,
    refetch: refetchWhitelistBalance,
  } = useReadContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: "getRemainingWhitelistBalance",
    args: [tokenAddress as `0x${string}`, address as `0x${string}`],
  });

  const {
    data: is_SafuHolder,
    isLoading: isLoadingSafuHolder,
    refetch: refetchSafuHolder,
  } = useReadContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: "isSafuTokenAutoWL",
    args: [address as `0x${string}`],
  });

  const {
    data: _safuHolderBalance,
    isLoading: isLoadingSafuHolderBalance,
    refetch: refetchSafuHolderBalance,
  } = useReadContract({
    ...TOKEN_ABI,
    address: SAFU_TOKEN_CA,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const {
    data: _safuSupply,
    isLoading: isLoadingSafuSupply,
    refetch: refetchSafuSupply,
  } = useReadContract({
    ...TOKEN_ABI,
    address: SAFU_TOKEN_CA,
    functionName: "totalSupply",
  });

  // Computed contract data
  const infoData = isConnected ? infoDataRaw : fallbackInfoData;
  const tokenSupply = Array.isArray(infoData) ? Number(infoData[6]) : 0;
  const tokenSold = Array.isArray(infoData) ? Number(infoData[8]) : 0;
  const isStartTrading = Array.isArray(infoData) ? Number(infoData[1]) : 0;
  const isBundled = Array.isArray(infoData) ? Number(infoData[14]) : 0;
  const isTaxedOnDex = Array.isArray(infoData) ? Number(infoData[15]) : 0;
  const IsTaxedOnSafu = Array.isArray(infoData) ? Number(infoData[16]) : 0;
  const isListed = Array.isArray(infoData) ? Number(infoData[2]) : 0;
  const isWhiteListOngoing = Array.isArray(infoData) ? Number(infoData[3]) : 0;
  const taxOnSafuBps = Array.isArray(infoData)
    ? Number(((infoData as unknown[])[13] as number) / 100)
    : 0;
  const isMaxWalletOnSafu = Array.isArray(infoData) ? Number(infoData[17]) : 0;
  const rawMaxWalletBps = Array.isArray(infoData)
    ? ((infoData as unknown[])[18] as bigint)
    : BigInt(0);
  const maxWalletAmountOnSafu = Number(rawMaxWalletBps) / 100;
  const mwAmountOnSafu = Number((maxWalletAmountOnSafu / 100) * tokenSupply);
  const ywhitelistBalance = isLoadingWhitelistBalance
    ? 0
    : whitelistBalance !== undefined
    ? Number(whitelistBalance) / 1e18
    : 0;

  const curvePercent = infoData
    ? (Number(tokenSold) / (0.75 * Number(tokenSupply))) * 100
    : 0;
  const curvePercentClamped = Math.min(Math.max(curvePercent, 0), 100);

  const isSafuHolder = isLoadingSafuHolder ? "" : is_SafuHolder;
  const safuHolderBalance = isLoadingSafuHolderBalance
    ? ""
    : Number(Number(_safuHolderBalance) / 1e18).toFixed(2);
  const tier1Holder =
    isLoadingSafuSupply || isLoadingSafuHolderBalance
      ? ""
      : Number(_safuHolderBalance) >= Number(_safuSupply) / 100;
  const tier2Holder =
    isLoadingSafuSupply || isLoadingSafuHolderBalance
      ? ""
      : Number(_safuHolderBalance) >= (Number(_safuSupply) * 3) / 1000;

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
  // const tokenPriceUSD =
  //   oneTokenPriceETH !== null ? oneTokenPriceETH * infoETHCurrentPrice : 0;

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

        const ohlcResponse = await base.get("ohlc", {
          params: {
            tokenAddress,
            resolution: selectedTimeframe.resolution,
            period,
            t: timestamp,
          },
        });

        console.log("ohlcResponse", ohlcResponse.data.data);
        const ohlcData = await ohlcResponse.data.data;

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
    [tokenAddress, selectedTimeframe]
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
    (async () => {
      try {
        const res = await base.get("token", { params: { tokenAddress } });
        const all: TokenMetadata = res.data.data.data;
        console.log({ all });

        if (!all) {
          setToken(null);
          setIsLoadingToken(false);
          return;
        }
        setToken(all);
      } catch (error) {
        console.error("Error loading token metadata:", error);
        setToken(null);
      } finally {
        setIsLoadingToken(false);
      }
    })();
  }, [tokenAddress]);

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
      refetchSafuHolder();
      refetchSafuSupply();
      refetchSafuHolderBalance();
      refetchWhitelistBalance();
      refetchAmountOut();
      refetchETHBalance();
      refetchBalance();
      refetchAllowance();
      setIsProcessingTxn(false);

      // Immediate chart update after successful transaction
      if (lastTxnType === "buy" || lastTxnType === "sell") {
        // console.log("Transaction confirmed, updating chart immediately");
        // Small delay to ensure backend has processed the transaction
        setTimeout(() => {
          loadChartData(true);
        }, 2000);
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
    refetchETHBalance,
    refetchWhitelistBalance,
    refetchSafuHolderBalance,
    refetchSafuSupply,
    refetchSafuHolder,
  ]);

  const loggedTxns = useRef<Set<string>>(new Set());

  // Log transactions
  useEffect(() => {
    if (
      isConfirmed &&
      result &&
      tokenAddress &&
      (lastTxnType === "buy" || lastTxnType === "sell") &&
      txHash &&
      !loggedTxns.current.has(txHash)
    ) {
      loggedTxns.current.add(txHash);
      const postToSocket = async () => {
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
            oldMarketCap: marketCapUSD,
          };

          socket.emit("newTransaction", body);
        } catch (error) {
          console.error("Error logging transaction:", error);
        }
      };

      postToSocket();
    }
  }, [
    isConfirmed,
    lastTxnType,
    tokenAddress,
    txHash,
    ethValue,
    tokenValue,
    amountOut,
    result,
    marketCapUSD,
  ]);

  // Enhanced fetchLogs with callback for chart update
  const fetchLogsWithCallback = useCallback(async () => {
    if (!tokenAddress) return;

    try {
      const response = await base.get(
        `transactions?tokenAddress=${tokenAddress}`
      );

      console.log(response);
      const all: TxLog[] = await response.data.data.data;
      const filtered = all.filter(
        (tx) => tx.type === "buy" || tx.type === "sell"
      );
      setTxLogs(filtered);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  }, [tokenAddress]);

  // Replace the existing fetchLogs effect
  useEffect(() => {
    fetchLogsWithCallback();

    if (!socket.connected) {
      console.log("socket connected");
      socket.connect();
    }

    const handleReceiveTransaction = (tx: TxLog) => {
      // console.log("called");
      if (tx.type === "buy" || tx.type === "sell") {
        setTxLogs((prevLogs) => {
          const updated = [tx, ...prevLogs];
          if (isAutoUpdateEnabled) {
            setTimeout(() => loadChartData(true), 100);
          }
          return updated;
        });
      }
    };
    socket.on("recTransaction", handleReceiveTransaction);

    return () => {
      socket.off("recTransaction", handleReceiveTransaction);
      socket.disconnect();
    };
  }, [fetchLogsWithCallback, isAutoUpdateEnabled, loadChartData]);

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

  const performance1dPrice = (logs: TxLog[]) => {
    if (logs.length === 0) return 0;

    // Sort logs by timestamp to get chronological order
    const sortedLogs = [...logs].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstTx = sortedLogs[0];
    const lastTx = sortedLogs[sortedLogs.length - 1];

    // Calculate implied price (ETH per token) for each transaction
    const firstPrice =
      parseFloat(firstTx.ethAmount) / parseFloat(firstTx.tokenAmount);
    const lastPrice =
      parseFloat(lastTx.ethAmount) / parseFloat(lastTx.tokenAmount);

    // Calculate percentage change
    if (firstPrice === 0) return 0;

    const percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    return percentageChange;
  };

  const perf1dPrice = performance1dPrice(logs1d);
  const pricePerf = perf1dPrice;

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
      args: [SAFU_LAUNCHER_CA as `0x${string}`, MaxUint256 as bigint],
    });
    setIsProcessingTxn(true);
  }, [
    isLoadingAllowance,
    isConfirming,
    amount,
    writeContract,
    tokenAddress,
    mode,
  ]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) e.preventDefault();
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

  const wlArray = React.useMemo(
    () =>
      isWhiteListOngoing
        ? (whitelistUpload.map((e) => e.address) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [isWhiteListOngoing, whitelistUpload]
  );

  const initialCapsBps = React.useMemo(
    () =>
      isWhiteListOngoing
        ? (whitelistUpload.map((e) =>
            Math.round(e.cap * 100)
          ) as readonly number[])
        : // Default to 100% for each whitelist entry
          ([] as readonly number[]),
    [isWhiteListOngoing, whitelistUpload]
  );

  // console.log("wlArray", wlArray);
  // console.log("initialCapsBps", initialCapsBps);

  const parseWlCsv = (text: string) => {
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l);

    // strip header if present
    if (rawLines.length > 0) {
      const hdr = rawLines[0].split(",").map((s) => s.trim().toLowerCase());
      if (
        (hdr[0] === "address" || hdr[0] === "addr") &&
        hdr[1]?.startsWith("cap")
      ) {
        rawLines.shift();
      }
    }

    const parsed: { address: string; cap: number }[] = [];
    const errs: ValidationError[] = [];

    rawLines.forEach((line, idx) => {
      const [addr, capStr] = line.split(",").map((s) => s.trim());
      if (!ethers.isAddress(addr)) {
        errs.push({
          field: "whitelist",
          message: `Line ${idx + 1}: bad address`,
        });
        return;
      }
      const pct = parseFloat(capStr);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        errs.push({
          field: "whitelist",
          message: `Line ${idx + 1}: cap must be (0,100]`,
        });
        return;
      }
      parsed.push({ address: addr, cap: pct });
    });

    if (errs.length > 0) {
      setValidationErrors(errs);
    } else {
      // Replace existing entries instead of appending
      setWhitelistUpload(parsed);
      setValidationErrors((prev) =>
        prev.filter((e) => e.field !== "whitelist")
      );
    }
  };
  // Updated file upload handler with Excel support
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      // Handle CSV files
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setWlCsvText(text);
        parseWlCsv(text);
      };
      reader.readAsText(file);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert to CSV format
          const csvData = XLSX.utils.sheet_to_csv(worksheet);

          setWlCsvText(csvData);
          parseWlCsv(csvData);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          setValidationErrors([
            {
              field: "whitelist",
              message:
                "Error parsing Excel file. Please check the file format.",
            },
          ]);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setValidationErrors([
        {
          field: "whitelist",
          message: "Unsupported file format. Please upload CSV or Excel files.",
        },
      ]);
    }

    // Reset the input so the same file can be uploaded again
    e.target.value = "";
  };

  // Address validation helper
  const isValidAddress = (addr: string): boolean => {
    try {
      return ethers.isAddress(addr) && addr !== ethers.ZeroAddress;
    } catch {
      return false;
    }
  };

  const findDuplicateAddresses = (
    addresses: string[]
  ): { duplicates: string[]; positions: number[][] } => {
    const addressCount = new Map<string, number[]>();
    const duplicates: string[] = [];
    const positions: number[][] = [];

    // Count occurrences and track positions
    addresses.forEach((addr, index) => {
      if (!addr || !addr.trim()) return; // Skip empty addresses

      const normalizedAddr = addr.toLowerCase().trim();
      if (!addressCount.has(normalizedAddr)) {
        addressCount.set(normalizedAddr, []);
      }
      addressCount.get(normalizedAddr)!.push(index);
    });

    // Find duplicates
    addressCount.forEach((indices, addr) => {
      if (indices.length > 1) {
        duplicates.push(addr);
        positions.push(indices);
      }
    });

    return { duplicates, positions };
  };

  // Comprehensive validation function
  const validateForm = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!isConnected) {
      errors.push({
        field: "connection",
        message: "Please connect your wallet to launch a token.",
      });
    }

    // Whitelist validation
    if (isWhiteListOngoing) {
      if (whitelistUpload.length > 200) {
        errors.push({
          field: "whitelist",
          message: "Maximum 200 whitelist addresses allowed",
        });
      }

      // Validate whitelist addresses
      whitelistUpload.forEach((addr, index) => {
        if (addr && !isValidAddress(addr.address)) {
          errors.push({
            field: "whitelist",
            message: `Whitelist address ${index + 1}: Invalid address`,
          });
        }

        if (isMaxWalletOnSafu) {
          if (addr.cap > maxWalletAmountOnSafu) {
            errors.push({
              field: "whitelist",
              message: `Entry ${
                index + 1
              }: max cap for whitelisted addrs must not be greater than maxWalletAmountOnSafu.`,
            });
          }
        }

        if (addr.cap <= 0 || addr.cap > 2) {
          errors.push({
            field: "whitelist",
            message: `Entry ${index + 1}: max cap for whitelisted addrs is 2%.`,
          });
        }
      });

      // Check for empty whitelist entries
      const emptyWhitelistEntries = whitelistUpload.some(
        (addr) => !addr.address.trim()
      );
      if (emptyWhitelistEntries) {
        errors.push({
          field: "whitelist",
          message: "All whitelist entries must have valid addresses",
        });
      }

      // Check for duplicate whitelist addresses
      const validWhitelistAddresses = whitelistUpload
        .filter((addr) => addr && addr.address.trim())
        .map((addr) => addr.address);
      if (validWhitelistAddresses.length > 0) {
        const { duplicates, positions } = findDuplicateAddresses(
          validWhitelistAddresses
        );
        duplicates.forEach((duplicateAddr, index) => {
          const duplicatePositions = positions[index]
            .map((pos) => pos + 1)
            .join(", ");
          errors.push({
            field: "whitelist",
            message: `Duplicate whitelist address found at positions: ${duplicatePositions} (${duplicateAddr.slice(
              0,
              6
            )}...${duplicateAddr.slice(-4)})`,
          });
        });
      }
    }

    return errors;
  }, [
    isConnected,
    whitelistUpload,
    isWhiteListOngoing,
    isMaxWalletOnSafu,
    maxWalletAmountOnSafu,
  ]);

  // Run validation whenever form data changes
  useEffect(() => {
    const errors = validateForm();
    setValidationErrors(errors);
    setIsFormValid(errors.length === 0);
  }, [validateForm]);

  const handleSellProcess = useCallback(() => {
    if (needsApproval) {
      handleApprove();
    } else {
      handleSubmit();
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
    if (!tokenAddress || !isTokenCreator) {
      setErrorMsg("Please enter valid addresses to whitelist");
      return;
    }

    setErrorMsg("");
    setLastTxnType("addToWhitelist");

    // console.log("calling addToWhitelist with", {
    //   tok: tokenAddress,
    //   list: wlArray,
    //   caps: initialCapsBps,
    // });

    writeContract({
      ...LAUNCHER_ABI,
      address: SAFU_LAUNCHER_CA,
      functionName: "addToWhitelist",
      args: [
        tokenAddress as `0x${string}`,
        wlArray as `0x${string}`[],
        initialCapsBps as number[],
      ],
    });
    setIsProcessingTxn(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    writeContract,
    tokenAddress,
    wlArray,
    initialCapsBps,
    isTokenCreator,
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

  const handleDisableMaxWalletLimit = useCallback(() => {
    if (!tokenAddress || !isTokenCreator) return;

    setErrorMsg("");
    setLastTxnType("disableMaxWalletLimit");

    writeContract({
      ...LAUNCHER_ABI,
      address: SAFU_LAUNCHER_CA,
      functionName: "disableMaxWalletLimit",
      args: [tokenAddress as `0x${string}`],
    });
    setIsProcessingTxn(true);
  }, [writeContract, tokenAddress, isTokenCreator]);

  const handleButtonClick = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (mode === "buy") {
        handleSubmit();
      } else {
        handleSellProcess();
      }
    },
    [mode, handleSubmit, handleSellProcess]
  );

  // UI helper functions
  const getButtonText = useCallback(() => {
    if (isWritePending) return "Confirming...";
    if (isConfirming) return "Processing...";
    return mode === "buy" ? "Buy" : needsApproval ? "Approve" : "Sell";
  }, [isWritePending, isConfirming, mode, needsApproval]);

  const userETHBalanceNumber = parseFloat(userETHBalance?.formatted ?? "0");
  const userTokenBalanceNumber = parseFloat(tokenBalance);
  const amountNumber = parseFloat(amount);
  const amountOutNumber = amountOutSelect
    ? Number(amountOutSelect.toString()) / 1e18
    : 0;
  const whitelistBalanceNumber = Number(whitelistBalance) / 1e18;
  const maxWalletTokens = mwAmountOnSafu / 1e18;

  // Calculate tier limits based on total supply
  const tier2Limit = ((tokenSupply / 1e18) * 5) / 1000; // 0.5% of total supply
  const tier1Limit = ((tokenSupply / 1e18) * 1) / 100; // 1% of total supply

  // Validation logic
  const validationState = useMemo(() => {
    // Basic validations
    if (!amount || amountNumber <= 0) {
      return { isDisabled: true, message: "Enter amount" };
    }

    if (!isConnected) {
      return { isDisabled: true, message: "Connect your wallet to trade" };
    }

    if (isTransactionPending) {
      return { isDisabled: true, message: getButtonText() };
    }

    // Mode-specific validations
    if (mode === "buy") {
      // ETH balance check
      if (amountNumber > userETHBalanceNumber) {
        return { isDisabled: true, message: "Insufficient ETH balance" };
      }

      // Whitelist checks (only if whitelist is active)
      if (isWhiteListOngoing === 1) {
        // Check if user is whitelisted (unless they're a tier holder)
        if (!tier1Holder && !tier2Holder && whitelistBalanceNumber === 0) {
          return { isDisabled: true, message: "Not whitelisted" };
        }

        // Check whitelist buy limit
        if (
          !tier1Holder &&
          !tier2Holder &&
          amountOutNumber > whitelistBalanceNumber
        ) {
          return { isDisabled: true, message: "Exceeds whitelist buy limit" };
        }

        // Tier holder purchase limits
        if (tier2Holder && !tier1Holder) {
          // Tier 2 holder: can only buy up to 0.2% of total supply
          const totalAfterBuy = amountOutNumber + userTokenBalanceNumber;
          if (totalAfterBuy > tier2Limit) {
            return {
              isDisabled: true,
              message: `Tier 2 limit: ${tier2Limit.toLocaleString()} tokens max`,
            };
          }
        } else if (tier1Holder) {
          // Tier 1 holder: can only buy up to 0.5% of total supply
          const totalAfterBuy = amountOutNumber + userTokenBalanceNumber;
          if (totalAfterBuy > tier1Limit) {
            return {
              isDisabled: true,
              message: `Tier 1 limit: ${tier1Limit.toLocaleString()} tokens max`,
            };
          }
        }
      }

      // Max wallet checks (only if max wallet is active)
      if (isMaxWalletOnSafu === 1) {
        // Check if buying this amount would exceed max wallet
        if (amountOutNumber > maxWalletTokens) {
          return { isDisabled: true, message: "Exceeds max wallet limit" };
        }

        // Check if user's total balance would exceed max wallet after buy
        const totalAfterBuy = amountOutNumber + userTokenBalanceNumber;
        if (totalAfterBuy > maxWalletTokens) {
          return { isDisabled: true, message: "Would exceed max wallet limit" };
        }
      }
    } else if (mode === "sell") {
      // Token balance check
      if (amountNumber > userTokenBalanceNumber) {
        return {
          isDisabled: true,
          message: `Insufficient ${token?.symbol} balance`,
        };
      }
    }

    // All validations passed
    return { isDisabled: false, message: getButtonText() };
  }, [
    amount,
    amountNumber,
    isTransactionPending,
    mode,
    userETHBalanceNumber,
    userTokenBalanceNumber,
    isWhiteListOngoing,
    tier1Holder,
    tier2Holder,
    whitelistBalanceNumber,
    amountOutNumber,
    isMaxWalletOnSafu,
    maxWalletTokens,
    token?.symbol,
    getButtonText,
    tier1Limit,
    tier2Limit,
    isConnected,
  ]);

  const getAdminTxnMessage = () => {
    switch (lastTxnType) {
      case "startTrading":
        return "Trading started successfully!";
      case "addToWhitelist":
        return "Addresses added to whitelist successfully!";
      case "disableWhitelist":
        return "Whitelist disabled successfully!";
      case "disableMaxWalletLimit":
        return "Max wallet limits disabled successfully!";
      default:
        return "Transaction confirmed successfully!";
    }
  };

  console.log(txLogs);

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
          <p className="dark:text-white text-black text-lg lg:text-xl font-medium font-raleway drop-shadow-md">
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
          <h2 className="font-raleway text-white text-3xl lg:text-5xl font-bold mb-4  mt-10">
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
    <div className="relative mountain">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="lg:size-[30rem] lg:w-[55rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="lg:size-[30rem] lg:w-[40rem] rounded-full bg-[#3BC3DB]/10 absolute top-[800px] -left-40 blur-3xl hidden dark:block"></div>

      <div className="mx-auto pt-24 mb-20 px-4 lg:px-0 relative text-white max-w-[85rem]">
        <div className="lg:flex gap-10">
          {/* Left section */}
          <div className="w-full lg:w-[45%]">
            {/* Heading and Admin Panel */}
            <div>
              {/* Always Visible Heading */}
              <div className="flex flex-col lg:flex-row gap-y-2">
                <h1 className="text-2xl font-bold dark:text-white text-black font-raleway">
                  Trade {token.name}{" "}
                  <span className="dark:text-white/60 text-black/80">
                    ({token.symbol})
                  </span>
                </h1>

                {/* Conditional Admin Buttons */}
                {isTokenCreator && (
                  <div className="flex gap-4 h-fit">
                    {/* Add Whitelist Button */}
                    <button
                      type="button"
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      disabled={
                        isTransactionPending || isWhiteListOngoing === 0
                      }
                      className="px-1 py-2 h-fit rounded-[10px] text-[10px] font-raleway border dark:border-[#EA971C] dark:text-[#EA971C] dark:hover:bg-[#FFA726] border-[#FF0199] text-[#FF0199] hover:bg-[#FF0199] hover:text-white font-semibold transition-all disabled:opacity-50"
                    >
                      Add Whitelist
                    </button>

                    {/* Start Trading Button */}
                    <button
                      type="button"
                      onClick={handleStartTrading}
                      disabled={
                        isTransactionPending ||
                        isStartTrading === 1 ||
                        isProcessingTxn
                      }
                      className="px-1 py-2 h-fit rounded-[10px] text-[10px] font-raleway border border-[#27AE60] text-[#27AE60] hover:bg-[#00C853] hover:text-white transition-all disabled:opacity-50 font-semibold"
                    >
                      {isStartTrading === 1
                        ? "Trading Started"
                        : "Start Trading"}
                    </button>

                    {/* disable max wallet limit Button */}
                    <button
                      type="button"
                      onClick={handleDisableWhitelist}
                      disabled={
                        isTransactionPending ||
                        isWhiteListOngoing === 0 ||
                        isProcessingTxn
                      }
                      className="px-1 py-2 h-fit rounded-[10px] text-[10px] font-raleway border border-[#27AE60] text-[#27AE60] hover:bg-[#00C853] hover:text-white transition-all disabled:opacity-50 font-semibold"
                    >
                      {isWhiteListOngoing === 0
                        ? "Whitelist Disabled"
                        : "Disable Whitelist"}
                    </button>

                    {/* disable max wallet limit Button */}
                    <button
                      type="button"
                      onClick={handleDisableMaxWalletLimit}
                      disabled={
                        isTransactionPending ||
                        isMaxWalletOnSafu === 0 ||
                        isProcessingTxn
                      }
                      className="px-1 py-2 h-fit rounded-[10px] text-[10px] font-raleway border border-[#27AE60] text-[#27AE60] hover:bg-[#00C853] hover:text-white transition-all disabled:opacity-50 font-semibold"
                    >
                      {isMaxWalletOnSafu === 0
                        ? "MaxWallet Limit Disabled"
                        : "Disable Max Wallet Limit"}
                    </button>
                  </div>
                )}
              </div>

              {/* Whitelist Pop-up Panel */}
              {isTokenCreator && showAdminPanel && (
                <div className="relative">
                  <div className="absolute z-20 mt-4 p-5 w-full md:w-[450px] bg-white dark:bg-black border border-gray-500 rounded-xl shadow-xl space-y-4">
                    {/* Close Icon */}
                    <button
                      onClick={() => setShowAdminPanel(false)}
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
                      aria-label="Close"
                    >
                      &times;
                    </button>

                    {isWhiteListOngoing && (
                      <div className="space-y-4 bg-slate-900/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 shadow-md">
                        <div className="text-white font-medium mb-4">
                          Whitelisted Addresses:{" "}
                          <span className="text-green-400">
                            {whitelistUpload.length} / 200
                          </span>
                        </div>

                        {/* CSV Text Input */}
                        <div className="space-y-2">
                          <textarea
                            rows={6}
                            value={wlCsvText}
                            onChange={(e) => setWlCsvText(e.target.value)}
                            placeholder="0xAbc123…,0.5&#10;0xDef456…,0.3"
                            className="w-full p-3 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Upload Button */}
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => parseWlCsv(wlCsvText)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200"
                          >
                            Add Whitelist
                          </button>

                          <div className="relative">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={handleCSVUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button
                              type="button"
                              className="bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Upload CSV/Excel</span>
                            </button>
                          </div>
                        </div>

                        {/* Whitelist Entries Table */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-600 overflow-hidden">
                          {whitelistUpload.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                              No whitelist entries yet. Add some using the
                              buttons above.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddToWhitelist}
                      disabled={!isFormValid || isWhiteListOngoing === 0}
                      className={`w-full rounded-xl px-6 py-4 text-white font-semibold mt-10 ${
                        isFormValid
                          ? "bg-gradient-to-r from-[#3BC3DB] to-[#0C8CE0]"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      Add to whitelist
                    </button>

                    {validationErrors.length > 0 && (
                      <div className=" dark:bg-[#2c0b0e] border border-red-300 dark:border-red-600 text-red-800 dark:text-red-300 rounded-md px-4 py-3 mb-5 mt-4">
                        <h3 className="font-semibold mb-2 text-sm md:text-base font-raleway">
                          Please fix the following issues:
                        </h3>
                        <ul className="space-y-1 text-sm md:text-base">
                          {validationErrors.map((error, index) => (
                            <li key={index}>
                              <span className="font-semibold">
                                {error.field}:
                              </span>{" "}
                              {error.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden">
              <span
                className={pricePerf >= 0 ? "text-green-500" : "text-red-500"}
              >
                <span className="dark:text-white text-black">{token.name}</span>{" "}
                <span className="dark:text-white/50 text-black/50">
                  is {pricePerf >= 0 ? "up" : "down"} by
                </span>{" "}
                {pricePerf >= 0 ? "+" : ""}
                {pricePerf.toFixed(2)}%
              </span>
            </div>

            <div className="grid mb-2.5 gap-4 mt-1">
              {/* Token info */}

              <div className="grid sm:grid-cols-2 gap-3 mt-2 text-sm">
                {[
                  { label: "Trading Started", value: isStartTrading },
                  {
                    label: "Dev Bundled",
                    value: isBundled,
                    extra: `${token?.percentBundled ?? 0}%`,
                  },
                  { label: "Tax on Dex", value: isTaxedOnDex },
                  {
                    label: "Tax on SafuLauncher",
                    value: IsTaxedOnSafu,
                    extra: `${taxOnSafuBps ?? 0}%`,
                  },
                  { label: "Whitelist Ongoing", value: isWhiteListOngoing },
                  {
                    label: "Max wallet size on SafuLauncher",
                    value: isMaxWalletOnSafu,
                    extra: `${maxWalletAmountOnSafu ?? 0}%`,
                  },
                  // {
                  //   label: "Tier 1",
                  //   value: `tier1Holder`,
                  //   extra: `${tier1Holder}`,
                  // },
                  // {
                  //   label: "Tier 2",
                  //   value: `tier2Holder`,
                  //   extra: `${tier2Holder}`,
                  // },
                  ...(isWhiteListOngoing && ywhitelistBalance > 0
                    ? [
                        {
                          label: "Whitelisted Amount",
                          value: { isWhiteListOngoing },
                          extra: `${ywhitelistBalance.toFixed(2) ?? 0} ${
                            token?.symbol
                          }`,
                        },
                      ]
                    : []),
                  ...(isWhiteListOngoing && isSafuHolder
                    ? [
                        {
                          label: "Auto Whitelisted",
                          value: `${isSafuHolder}`,
                        },
                      ]
                    : []),
                  ...(isWhiteListOngoing && isSafuHolder
                    ? [
                        {
                          label: "Your Safu",
                          value: `${isSafuHolder}`,
                          extra: `${safuHolderBalance} SAFU`,
                        },
                      ]
                    : []),
                ].map(({ label, value, extra }, i) => (
                  <div
                    key={i}
                    className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex items-center justify-between relative group"
                  >
                    <p className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway text-xs">
                      {label}
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      {extra && (
                        <span className="text-[#27AE60] text-xs font-semibold">
                          {extra}
                        </span>
                      )}
                      {value ? (
                        <div className="bg-[#27AE60] rounded-full p-1.5 flex items-center justify-center relative">
                          <FiCheckCircle className="text-white text-sm" />
                          {/* {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#3BC3DB] text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold z-20"
                            >
                              View
                            </a>
                          )} */}
                        </div>
                      ) : (
                        <div className="bg-white rounded-full p-1.5 flex items-center justify-center">
                          <MdOutlineCancel className="text-black text-sm" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-5 mt-6 dark:bg-white/5 bg-[#141313]/4 border border-white/10 backdrop-blur-md space-y-3 hidden">
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

            {/* right section */}
            <div className="top-section mt-1">
              <div className=" dark:bg-white/5 bg-[#141313]/4 backdrop-blur-md rounded-xl p-3 border border-white/10 text-sm max-w-[20rem] mx-auto">
                <div className="space-y-2 ">
                  {/* SELL INPUT */}
                  <div className="flex flex-col space-y-1 ">
                    <label className="text-xs md:text-sm dark:text-white text-black font-medium">
                      Sell
                    </label>
                    <div className="flex items-center justify-between bg-black/10 dark:bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        min="0"
                        step="any"
                        autoComplete="off"
                        disabled={isTransactionPending}
                        className="bg-transparent w-full text-sm focus:outline-none dark:text-white text-black placeholder-gray-400"
                      />
                      <span className="ml-1 dark:text-white text-black font-raleway font-medium text-xs flex items-center gap-1">
                        {mode === "buy" && <FaEthereum className="text-base" />}
                        {mode === "buy" ? "ETH" : token.symbol}
                      </span>
                    </div>

                    {mode === "buy" && (
                      <div className="text-xs dark:text-white/60 text-black">
                        Balance:{" "}
                        {isLoadingUserETHBal ? (
                          <span className="inline-block w-10 h-3 bg-black/10 dark:bg-white/20 animate-pulse rounded" />
                        ) : (
                          `${parseFloat(
                            userETHBalance?.formatted ?? "0"
                          ).toFixed(2)} ETH`
                        )}
                      </div>
                    )}

                    {mode === "sell" && (
                      <div className="flex justify-between items-center text-xs dark:text-white/60 text-black">
                        <span>
                          Balance:{" "}
                          {isLoadingBalance ? (
                            <span className="inline-block w-10 h-3 bg-black/10 dark:bg-white/20 animate-pulse rounded" />
                          ) : (
                            `${parseFloat(tokenBalance).toLocaleString()} ${
                              token.symbol
                            }`
                          )}
                        </span>

                        <button
                          onClick={handleMaxClick}
                          disabled={
                            isTransactionPending ||
                            isLoadingBalance ||
                            !getBalance
                          }
                          className="bg-Primary text-white px-2 py-0.5 rounded-full text-xs"
                        >
                          {isLoadingBalance ? "..." : "Max"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mode Switch */}
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        handleMode(mode === "buy" ? "sell" : "buy")
                      }
                      className="group relative flex items-center justify-center size-6 rounded-full bg-black/40 dark:bg-white/10 border border-white/10 hover:bg-[#0C8CE0]"
                    >
                      <FaArrowDown className="text-white text-sm absolute group-hover:opacity-0 transition-opacity" />
                      <RiArrowUpDownFill className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>

                  {/* BUY OUTPUT */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs md:text-sm dark:text-white text-black font-medium">
                      Buy
                    </label>
                    <div className="flex items-center justify-between dark:text-white text-black bg-black/10 dark:bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                      <span className="text-sm">
                        {isLoadingAmountOutSelect ? (
                          <span className="inline-block w-16 h-4 bg-white/20 animate-pulse rounded" />
                        ) : amountOutSelect ? (
                          formatTokenAmount(
                            Number(amountOutSelect.toString()) / 1e18,
                            mode === "sell" ? 8 : 2
                          )
                        ) : (
                          "0"
                        )}
                      </span>
                      <span className="ml-1 font-raleway font-medium text-xs flex items-center gap-1">
                        {mode === "sell" && (
                          <FaEthereum className="text-base" />
                        )}
                        {mode === "buy" ? token.symbol : "ETH"}
                      </span>
                    </div>
                  </div>

                  {/* Approval warning */}
                  {mode === "sell" && needsApproval && (
                    <div className="text-[11px] text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-md">
                      ⚠️ Approval required to sell tokens
                    </div>
                  )}

                  {/* Swap Button */}
                  {isListed === 1 ? (
                    <a
                      href={`https://app.uniswap.org/#/tokens/ethereum/${token.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full rounded-lg py-2 text-white text-center text-xs bg-[#27AE60] hover:bg-green-600 transition"
                      style={{ pointerEvents: "auto" }}
                    >
                      View token on Uniswap
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleButtonClick}
                      className={`w-full rounded-lg py-2 text-white text-xs bg-[#0C8CE0] hover:bg-blue-600 transition ${
                        validationState.isDisabled
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={validationState.isDisabled}
                    >
                      {validationState.message}
                      {isTransactionPending && (
                        <span className="ml-1 animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full inline-block"></span>
                      )}
                    </button>
                  )}

                  {/* Status messages */}
                  {isWritePending && (
                    <div className="text-[11px] text-yellow-400 bg-yellow-500/10 p-2 rounded-md">
                      Please confirm the transaction in your wallet
                    </div>
                  )}
                  {isConfirming && (
                    <div className="text-[11px] text-blue-400 bg-blue-500/10 p-2 rounded-md">
                      Transaction submitted. Waiting for confirmation...
                    </div>
                  )}
                  {isConfirmed && txHash && (
                    <div className="text-[11px] text-green-500 bg-black/10 dark:bg-white/5 p-2 rounded-md flex flex-col gap-1 items-center">
                      <p>
                        {lastTxnType === "approval"
                          ? "Approval confirmed!"
                          : lastTxnType === "sell"
                          ? "Sell confirmed!"
                          : lastTxnType === "buy"
                          ? "Buy confirmed!"
                          : getAdminTxnMessage()}
                      </p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] dark:text-white text-black truncate max-w-[250px] cursor-pointer"
                      >
                        Tx: {txHash}
                      </a>
                    </div>
                  )}
                  {errorMsg && (
                    <div className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded-md">
                      {errorMsg}
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md">
                      Error:{" "}
                      {"shortMessage" in (error as { shortMessage?: string })
                        ? (error as { shortMessage?: string }).shortMessage
                        : (error as Error).message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* )} */}

            {/* Progress Bar */}
            <div className="progress-section mt-1 ">
              <div className="progress-label dark:text-white text-[#141313]/90 font-medium font-raleway mb-1">
                Bonding Curve Progress:{" "}
                {isLoadingInfoData ? (
                  <span className="inline-block w-16 h-4 bg-black/10 dark:bg-white/20 animate-pulse rounded" />
                ) : (
                  `${curvePercentClamped.toFixed(0)}%`
                )}
              </div>

              {/* Styled progress bar with dynamic gradient */}
              <div className="bg-[#031E51] h-[30px] rounded-full w-full max-w-[40rem] p-1.5 relative overflow-hidden mb-4">
                <p className="absolute right-4 top-2 text-white text-[13px] font-semibold z-10 flex items-center justify-end">
                  {isLoadingInfoData ? (
                    <span className="inline-block w-16 h-4 bg-black/10 dark:bg-white/20 animate-pulse rounded" />
                  ) : (
                    `${curvePercentClamped.toFixed(0)}%`
                  )}
                </p>
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

          <div className="w-full lg:w-[55%]">
            <div className="">
              {/* Tab Buttons */}

              <h1 className="text-[20px] font-raleway font-medium dark:text-white text-black mb-4">
                Chart
              </h1>

              {/* Chart Tab Content */}

              <div className="">
                {/* Chart Header */}
                <div className="chart-header bg-[#0B132B] border border-white/10 rounded-t-xl px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between text-white text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TimeframeSelector
                      selectedTimeframe={selectedTimeframe}
                      onTimeframeChange={handleTimeframeChange}
                      disabled={isLoadingChart}
                    />

                    <button
                      type="button"
                      onClick={toggleAutoUpdate}
                      title={
                        isAutoUpdateEnabled
                          ? "Disable auto-update"
                          : "Enable auto-update"
                      }
                      className={`px-3 py-[3px] rounded text-xs font-medium ${
                        isAutoUpdateEnabled
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } transition duration-150`}
                    >
                      {isAutoUpdateEnabled ? "Auto" : "Manual"}
                    </button>

                    <div className="text-xs text-white/50 ml-1">
                      Last updated:{" "}
                      <span className="text-white">
                        {new Date(lastUpdateTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chart Container */}
                <div className="chart-container">
                  {isLoadingChart ? (
                    <div className="chart-loading h-[350px] flex flex-col items-center gap-2">
                      <div className="spinner animate-spin rounded-full h-6 w-6 border-t-2 border-white border-opacity-25"></div>
                      <p className="text-sm text-white/60">
                        Loading chart data...
                      </p>
                    </div>
                  ) : (
                    <LightweightChart
                      data={ohlc}
                      timeframe={selectedTimeframe.resolution}
                      height={390}
                      ethToUsdRate={infoETHCurrentPrice}
                      totalSupply={tokenSupply / 1e18}
                      symbol={token.symbol}
                    />
                  )}

                  {/* Auto-update Live Indicator */}
                  {isAutoUpdateEnabled && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 text-green-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                      Live
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-[34px]">
              {/* Tabs Header */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("transactions")}
                  className={`px-4 py-2 rounded-lg lg:text-[20px] font-raleway font-medium text-left ${
                    activeTab === "transactions"
                      ? " dark:text-white text-[#141314]"
                      : "dark:text-white/60 text-[#141314]/40"
                  } transition cursor-pointer`}
                >
                  Recent Transactions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-2 rounded-lg lg:text-[20px] font-raleway font-medium text-left ${
                    activeTab === "chat"
                      ? "dark:text-white text-[#141314]"
                      : "dark:text-white/60 text-[#141314]/40"
                  } transition cursor-pointer`}
                >
                  Community Chat
                </button>
              </div>

              {/* Tabs Content */}
              <div className=" backdrop-blur-md py-4">
                {activeTab === "transactions" ? (
                  <>
                    <div className="tx-table overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="min-w-[600px] md:min-w-full text-sm dark:text-white/80">
                        <thead className="text-left dark:text-white/60 text-[#141313]/75 mb-4 border-black/10 border-b-2 dark:border-b-white/20 ">
                          <tr>
                            <th className="py-3 pl-1">Type</th>
                            <th className="py-3">Wallet</th>
                            <th className="py-3">ETH</th>
                            <th className="py-3">{token.symbol}</th>
                            <th className="py-3">Txn</th>
                            <th className="py-3">Date / Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTxLogs.map((tx, i) => (
                            <tr
                              key={i}
                              className="mb-4 border-b-2 dark:border-b-white/20 border-black/10 last-of-type:border-none"
                            >
                              <td
                                className={`font-medium py-3 pl-1 flex items-center gap-1 ${
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

                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 bg-[#0C8CE0] text-white rounded-full disabled:opacity-50"
                      >
                        <FaChevronLeft />
                      </button>

                      <span className="px-2 text-sm text-gray-600 dark:text-white/70">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 bg-[#0C8CE0] text-white rounded-full disabled:opacity-50"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="">
                    <Chat address={address} tokenAddress={tokenAddress} />
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
