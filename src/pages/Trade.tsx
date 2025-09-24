/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { TopHoldersTable } from "../web3/topHoldersTable";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useBalance,
  useChainId,
  useSwitchChain
} from "wagmi";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import {
  TOKEN_ABI,
  LAUNCHER_ABI_V2,
  SAFU_LAUNCHER_ADDRESSES_V1,
  LAUNCHER_ABI_V1,
  PRICE_GETTER_ABI,
  SAFU_TOKEN_ADDRESSES,
  ROUTER_ADDRESSES_LIST,
  UNISWAP_ROUTER_ABI,
  ETH_USDT_PRICE_FEED_ADDRESSES,
  SAFU_LAUNCHER_ADDRESSES_V2,
  PRICE_GETTER_ADDRESSES,
  WETH_ADDRESS,
  LAUNCHER_ABI_V3,
  SAFU_LAUNCHER_ADDRESSES_V3,
  LAUNCHER_ABI_V4,
  SAFU_LAUNCHER_ADDRESSES_V4,
} from "../web3/config";
import { MaxUint256, ethers } from "ethers";
import "../App.css";
import {
  getListingMilestone,
  getPureAmountOutMarketCapV1,
  getPureAmountOutMarketCapV2,
  getPureAmountOutMarketCapV3,
  getPureAmountOutMarketCapV4,
  getPureAmountOutV1,
  getPureAmountOutV2,
  getPureAmountOutV3,
  getPureAmountOutV4,
  getPureGetLatestETHPrice,
  getPureInfoV1DataRaw,
  getPureInfoV2DataRaw,
  getPureInfoV3DataRaw,
  getPureInfoV4DataRaw,
  getV3Metrics,
  getV4Metrics,
} from "../web3/readContracts";
import LightweightChart from "../web3/lightWeightChart";
import TimeframeSelector from "../web3/timeframeSelector";
import Footer from "../components/launchintro/Footer";
import Navbar from "../components/launchintro/Navbar";
import { FiSettings } from "react-icons/fi";
import { FiCheckCircle } from "react-icons/fi";
import { MdOutlineCancel } from "react-icons/md";
import { GrSubtractCircle } from "react-icons/gr";
import { MdAddCircleOutline } from "react-icons/md";
import DustParticles from "../components/generalcomponents/DustParticles";
import { Upload } from "lucide-react";
import { useApiClient } from "../lib/api";
import { socket } from "../lib/socket";
import Chat from "./chat";
import {
  FaArrowDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaEthereum,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa6";
import { RiArrowUpDownFill } from "react-icons/ri";
import { useUser } from "../context/user.context";
import { CircleCheckBig } from "lucide-react";
import { X } from "lucide-react";
import CopyButton from "../components/generalcomponents/CopyButton";
import Message from "../components/svgcomponents/Message";
import { useDebouncedChainId } from "../lib/useDebouncedChainId";

// Define this function outside your component
const GRADIENT_STEPS = [
  { threshold: 9, color: "#dc2626" }, // Red
  { threshold: 13, color: "#f87171" }, // Light Red
  { threshold: 20, color: "#f97316" }, // Orange
  { threshold: 28, color: "#fb923c" }, // Another Orange
  { threshold: 38, color: "#60a5fa" }, // Light Blue
  { threshold: 49, color: "#3b82f6" }, // Darker Blue
  { threshold: 65, color: "#eab308" }, // Lemon
  { threshold: 73, color: "#86efac" }, // Light Green
  { threshold: 85, color: "#22c55e" }, // Medium Green
  { threshold: 94, color: "#16a34a" }, // Deeper Green
  { threshold: 100, color: "#14532d" }, // Dark Green
];

function getProgressGradient(progress: number): string {
  const activeStops = GRADIENT_STEPS.filter(
    (step) => progress >= step.threshold
  ).map((step) => step.color);

  if (activeStops.length === 0) {
    activeStops.push(GRADIENT_STEPS[0].color);
  }

  return `linear-gradient(to right, ${activeStops.join(", ")})`;
}

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
  tokenVersion?: string;
  createdAt?: string | Date;
  expiresAt?: number;
  twitter?: string;
  telegram?: string;
  image?: {
    name: string;
    path: string;
  };
  tokenImageId?: string;
  chainId?: number; // Add this line
  chainName?: string;
}

/**
 * Description placeholder
 *
 * @interface TxLog
 * @typedef {TxLog}
 */
interface TxLog {
  oldMarketCap: number;
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
  const date = new Date(isoString);

  const formattedDate = date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${formattedDate}, ${formattedTime}`;
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
  decimals: number = 2
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
  const networkInfo = useNetworkEnvironment();
  const base = useApiClient();
  const { address, isConnected } = useAccount();
  const { saveOrFetchUser } = useUser();

  const { switchChain } = useSwitchChain()
  const connectedChain = useChainId();

  useEffect(() => {
    console.log("Connected chainId:", connectedChain);
  }, [connectedChain]);

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

  const [showSettings, setShowSettings] = useState(false);

  const [isLoadingFallbackAmountOut, setIsLoadingFallbackAmountOut] =
    useState(false);

  // Core state
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [slippage, setSlippage] = useState<number>(5);
  const [deadlineMinutes, setDeadlineMinutes] = useState<number>(30);
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
  const [messageCount, setMessageCount] = useState<number>(0);
  const [showSectionA, setShowSectionA] = useState(false);
  const [autoSlideEnabled, setAutoSlideEnabled] = useState(true); // 💡 New state

  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 25;

  const [listingMilestonePct, setListingMilestonePct] = useState<number | null>(
    null
  );

  const [v3Metrics, setV3Metrics] = useState<bigint[] | null>(null);
  const [v4Metrics, setV4Metrics] = useState<bigint[] | null>(null);

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
  const [tokenChainId, setTokenChainId] = useState<number | null>(null);
  const [tokenChainName, setTokenChainName] = useState<string | null>(null);

  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingChartRef = useRef(false);

  const isV1 = token?.tokenVersion === "token_v1";
  const isV3 = token?.tokenVersion === "token_v3";
  const isV4 = token?.tokenVersion === "token_v4";

  const getChainIdForContract = useMemo(() => {
    try {
      return tokenChainId !== null ? tokenChainId : networkInfo.chainId;
    } catch (error) {
      console.error("Error getting chainId for contract:", error);
      return networkInfo.chainId;
    }
  }, [tokenChainId, networkInfo.chainId]);

  const debouncedChainId = useDebouncedChainId(getChainIdForContract, 5000);
  
  const switchToTokenChain = useCallback(async () => {
    if (!tokenChainId || !switchChain) return

    try {
      await switchChain({ chainId: tokenChainId })
    } catch (error) {
      console.error('Failed to switch network:', error)
      // Fallback: show message asking user to switch manually
    }
  }, [tokenChainId, switchChain])

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

  const {
    data: whitelistBalance,
    isLoading: isLoadingWhitelistBalance,
    refetch: refetchWhitelistBalance,
  } = useReadContract({
    abi: isV1
      ? LAUNCHER_ABI_V1.abi
      : isV3
        ? LAUNCHER_ABI_V3.abi
        : isV4
          ? LAUNCHER_ABI_V4.abi
          : LAUNCHER_ABI_V2.abi,
    address: isV1
      ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
      : isV3
        ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
        : isV4
          ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
          : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],

    functionName: "getRemainingWhitelistBalance",
    args: [tokenAddress as `0x${string}`, address as `0x${string}`],
  });

  const {
    data: infoDataRaw,
    isLoading: isLoadingInfoData,
    refetch: refetchInfoData,
  } = useReadContract({
    abi: isV1
      ? LAUNCHER_ABI_V1.abi
      : isV3
        ? LAUNCHER_ABI_V3.abi
        : isV4
          ? LAUNCHER_ABI_V4.abi
          : LAUNCHER_ABI_V2.abi,
    address: isV1
      ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
      : isV3
        ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
        : isV4
          ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
          : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
    functionName: "data",
    args: [tokenAddress!],
  });

  const infoData = isConnected && debouncedChainId === connectedChain ? infoDataRaw : fallbackInfoData;
  const tokenSupply = Array.isArray(infoData) ? Number(infoData[6]) : 0;
  const ethRaised = Array.isArray(infoData) ? Number(infoData[7]) : 0;
  const tokenSold = Array.isArray(infoData) ? Number(infoData[8]) : 0;
  const isStartTrading = Array.isArray(infoData) ? Number(infoData[1]) : 0;
  const isBundled = Array.isArray(infoData) ? Number(infoData[15]) : 0;
  const isTaxedOnDex = Array.isArray(infoData) ? Number(infoData[16]) : 0;
  const IsTaxedOnSafu = Array.isArray(infoData) ? Number(infoData[17]) : 0;

  const isListed = Array.isArray(infoData) ? Number(infoData[2]) : 0;
  const isWhiteListOngoing = Array.isArray(infoData) ? Number(infoData[3]) : 0;
  const taxOnSafuBps = Array.isArray(infoData)
    ? Number((infoData as any)[13]) / 100
    : 0;
  const taxOnDexBps = Array.isArray(infoData)
    ? Number((infoData as any)[14]) / 100
    : 0;

  const isMaxWalletOnSafu = Array.isArray(infoData) ? Number(infoData[18]) : 0;
  const rawMaxWalletBps = Array.isArray(infoData)
    ? ((infoData as unknown[])[19] as bigint)
    : BigInt(0);

  const dexRouter = useMemo(() => {
    if (!Array.isArray(infoData)) return '';
    const router = ((infoData as unknown[])[20] as string) || '';
    return router;
  }, [infoData]); // Only recalculate when infoData changes

  // Debounced logging
  useEffect(() => {
    if (dexRouter && dexRouter !== '') {
      console.log("dexRouter updated:", dexRouter);
    }
  }, [dexRouter]);

  const maxWalletAmountOnSafu = Number(rawMaxWalletBps) / 100;
  const mwAmountOnSafu = Number((maxWalletAmountOnSafu / 100) * tokenSupply);
  const ywhitelistBalance = isLoadingWhitelistBalance
    ? 0
    : whitelistBalance !== undefined
      ? Number(whitelistBalance) / 1e18
      : 0;

  const uniPath = useMemo(() => {
    return mode === "buy"
      ? [WETH_ADDRESS[debouncedChainId], tokenAddress!]
      : [tokenAddress!, WETH_ADDRESS[debouncedChainId]];
  }, [getChainIdForContract, mode, tokenAddress]);

  const amountInForUni = mode === "buy" ? ethValue : tokenValue;

  // Update the condition to include amountInForUni check
  const shouldCallUni = tokenAddress && isListed && amountInForUni > 0n;

  const routersForChain = ROUTER_ADDRESSES_LIST[debouncedChainId] ?? [];
  const routerAddress = dexRouter || routersForChain[0]?.address;


  const {
    data: uniAmountsRaw,
    isLoading: isLoadingUniAmounts,
    refetch: refetchUniAmounts,
  } = useReadContract(
    shouldCallUni
      ? {
        ...UNISWAP_ROUTER_ABI,
        address: routerAddress as `0x${string}`,
        functionName: "getAmountsOut",
        args: [amountInForUni as bigint, uniPath as any],
      }
      : undefined
  );

  const {
    data: launcherAmountRaw,
    isLoading: isLoadingLauncherAmount,
    refetch: refetchLauncherAmount,
  } = useReadContract(
    tokenAddress
      ? {
        abi: isV1
          ? LAUNCHER_ABI_V1.abi
          : isV3
            ? LAUNCHER_ABI_V3.abi
            : isV4
              ? LAUNCHER_ABI_V4.abi
              : LAUNCHER_ABI_V2.abi,
        address: isV1
          ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
          : isV3
            ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
            : isV4
              ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
              : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
        functionName: "getAmountOut",
        args: [
          tokenAddress,
          mode === "buy" ? ethValue : tokenValue,
          mode === "buy" ? true : false,
        ],
      }
      : undefined
  );

  const isLoadingAmountOut = isListed
    ? isLoadingUniAmounts
    : isLoadingLauncherAmount;
  const refetchAmountOut = isListed ? refetchUniAmounts : refetchLauncherAmount;

  // Update the amountOut calculation to handle zero case
  const amountOut = useMemo(() => {
    if (isListed) {
      // Handle zero input amount case
      console.log("amountInForUni", amountInForUni);
      if (amountInForUni === 0n) return 0n;
      if (!uniAmountsRaw) {
        console.log("uniAmountsRaw", uniAmountsRaw);
        return null;
      }
      const arr = Array.isArray(uniAmountsRaw)
        ? uniAmountsRaw
        : (uniAmountsRaw as any);
      console.log("arr");
      return arr[arr.length - 1] ?? null;
    } else {
      console.log("launcherAmountRaw");
      return launcherAmountRaw ?? null;
    }
  }, [isListed, uniAmountsRaw, launcherAmountRaw, amountInForUni]); // Add amountInForUni as dependency

  // Memoized values
  const isTokenCreator = useMemo(
    () =>
      address &&
      token &&
      address.toLowerCase() === token.tokenCreator.toLowerCase(),
    [address, token]
  );

  const sortedTxLogs = useMemo(() => {
    return [...txLogs].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [txLogs]);

  const indexOfLastTx = currentPage * transactionsPerPage;
  const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
  const currentTxLogs = sortedTxLogs.slice(indexOfFirstTx, indexOfLastTx);
  const totalPages = Math.ceil(sortedTxLogs.length / transactionsPerPage);

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
        args: [
          address as `0x${string}`,
          isListed
            ? routerAddress as `0x${string}`
            : isV1
              ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
              : isV3
                ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
                : isV4
                  ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
                  : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
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

  useEffect(() => {
    if (isListed && taxOnDexBps > 0) {
      setSlippage(taxOnDexBps + 2);
    }
  }, [isListed, taxOnDexBps]);


  // Effect to auto-switch when chain mismatch is detected
  useEffect(() => {
    if (isConnected &&
      tokenChainId &&
      connectedChain &&
      connectedChain !== tokenChainId) {

      console.log(`Switching from chain ${connectedChain} to ${tokenChainId}`)
      switchToTokenChain()
    }
  }, [isConnected, connectedChain, tokenChainId, switchToTokenChain])

  useEffect(() => {
    if (!autoSlideEnabled) return; //  Don't set interval if user toggled manually

    const interval = setInterval(() => {
      setShowSectionA((prev) => !prev);
    }, 15000); // ⏱ 15 seconds now

    return () => clearInterval(interval); // Cleanup on unmount or state change
  }, [autoSlideEnabled]); // Rerun if autoSlideEnabled changes

  // Add this useEffect to handle the async call
  useEffect(() => {
    // Don’t make the effect callback async––instead define an async helper inside.
    const fetchFallback = async () => {
      setIsLoadingFallbackAmountOut(true);

      try {
        const amountIn = mode === "buy" ? ethValue : tokenValue;
        const fn = isV1
          ? getPureAmountOutV1
          : isV3
            ? getPureAmountOutV3
            : isV4
              ? getPureAmountOutV4
              : getPureAmountOutV2;
        const result = await fn(
          debouncedChainId,
          tokenAddress!,
          amountIn,
          mode === "buy"
        );
        setFallbackAmountOut(result ?? null);
      } catch (error) {
        console.error("Error fetching fallback amount out:", error);
        setFallbackAmountOut(null);
      } finally {
        setIsLoadingFallbackAmountOut(false);
      }
    };

    // Only run if not connected and we have meaningful inputs:
    if (!isConnected && tokenAddress && (ethValue > 0n || tokenValue > 0n)) {
      fetchFallback();
    } else if (isConnected) {
      setFallbackAmountOut(null);
    }
  }, [isConnected, tokenAddress, ethValue, tokenValue, mode, isV1, isV3, isV4, debouncedChainId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [txLogs]);

  // Update your amountOutSelect logic
  const amountOutSelect = isConnected && debouncedChainId === connectedChain ? amountOut : fallbackAmountOut;
  const isLoadingAmountOutSelect = isConnected && debouncedChainId === connectedChain
    ? isLoadingAmountOut
    : isLoadingFallbackAmountOut;

  const {
    data: latestETHPrice,
    isLoading: isLoadingLatestETHPrice,
    refetch: refetchLatestETHPrice,
  } = useReadContract({
    address: PRICE_GETTER_ADDRESSES[debouncedChainId],
    abi: PRICE_GETTER_ABI.abi,
    functionName: "getLatestETHPrice",
    args: [ETH_USDT_PRICE_FEED_ADDRESSES[debouncedChainId]!],
  });

  const {
    data: is_SafuHolder,
    isLoading: isLoadingSafuHolder,
    refetch: refetchSafuHolder,
  } = useReadContract({
    abi: isV1
      ? LAUNCHER_ABI_V1.abi
      : isV3
        ? LAUNCHER_ABI_V3.abi
        : isV4
          ? LAUNCHER_ABI_V4.abi
          : LAUNCHER_ABI_V2.abi,
    address: isV1
      ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
      : isV3
        ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
        : isV4
          ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
          : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
    functionName: "isSafuTokenAutoWL",
    args: [address as `0x${string}`],
  });

  const {
    data: _safuHolderBalance,
    isLoading: isLoadingSafuHolderBalance,
    refetch: refetchSafuHolderBalance,
  } = useReadContract({
    ...TOKEN_ABI,
    address: SAFU_TOKEN_ADDRESSES[debouncedChainId],
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const {
    data: _safuSupply,
    isLoading: isLoadingSafuSupply,
    refetch: refetchSafuSupply,
  } = useReadContract({
    ...TOKEN_ABI,
    address: SAFU_TOKEN_ADDRESSES[debouncedChainId],
    functionName: "totalSupply",
  });

  useEffect(() => {
    let cancelled = false;

    const toNumberPct = (raw: any): number | null => {
      if (raw == null) return null;
      // raw could be ethers.BigNumber, string (like "7500"), number, or bigint
      try {
        if (typeof raw === "number") return raw;
        if (typeof raw === "bigint") return Number(raw);
        if (typeof raw === "string") return Number(raw);
        // ethers.BigNumber or similar
        if (typeof raw?.toNumber === "function") {
          // toNumber can throw if value is out of JS number range — fallback to string
          try {
            return raw.toNumber();
          } catch {
            return Number(raw.toString());
          }
        }
        // final fallback
        return Number(raw);
      } catch {
        return null;
      }
    };

    const fetchMetrics = async () => {
      try {
        if (isV3) {
          const metrics3 = await getV3Metrics(debouncedChainId);
          if (cancelled) return;
          // convert to array of bigint if that's what you expect; adjust mapping if needed
          const metrics3Array: bigint[] = Array.from(metrics3).map((m: any) =>
            typeof m === "bigint" ? m : BigInt(m)
          );
          if (!cancelled) setV3Metrics(metrics3Array);
        } else {
          const metrics4 = await getV4Metrics(debouncedChainId);
          if (cancelled) return;
          // convert to array of bigint if that's what you expect; adjust mapping if needed
          const metrics4Array: bigint[] = Array.from(metrics4).map((m: any) =>
            typeof m === "bigint" ? m : BigInt(m)
          );
          if (!cancelled) setV4Metrics(metrics4Array);
        }

      } catch (err) {
        console.error("Could not fetch v3 metrics:", err);
        if (!cancelled) setV3Metrics([]);
        if (!cancelled) setV4Metrics([]);
      }
    };

    // kickoff metrics fetch
    fetchMetrics();

    // handle milestone depending on V3 vs legacy endpoint
    if (isV3) {
      // read directly from v3Metrics[19]
      const raw = v3Metrics?.[19];
      const pct = toNumberPct(raw);
      console.log("pct", pct);
      if (!cancelled) setListingMilestonePct(pct);
    }

    else if (isV4) {
      // read directly from v3Metrics[19]
      const raw = v4Metrics?.[19];
      const pct = toNumberPct(raw);
      console.log("pct", pct);
      if (!cancelled) setListingMilestonePct(pct);
    }

    else {
      // legacy async fetch
      getListingMilestone(debouncedChainId)
        .then((raw) => {
          console.log("raw", raw);
          if (!cancelled) setListingMilestonePct(toNumberPct(raw));
        })
        .catch((err) => {
          console.error("Could not fetch listing milestone:", err);
          if (!cancelled) setListingMilestonePct(null);
        });
    }

    return () => {
      cancelled = true;
    };
    // include any external values used inside effect:
  }, [isV3, v3Metrics, isV4, v4Metrics, debouncedChainId]);

  const infoETHCurrentPrice = useMemo(() => {
    if (isConnected && debouncedChainId === connectedChain && !isLoadingLatestETHPrice && latestETHPrice) {
      return Number(latestETHPrice) / 1e8;
    }
    if (fallbackETHPrice) {
      return Number(fallbackETHPrice) / 1e8;
    }
    return 0; // Default to 1 if no price available
  }, [isConnected, connectedChain, getChainIdForContract, isLoadingLatestETHPrice, latestETHPrice, fallbackETHPrice]);

  // const curvePercent = infoData
  //   ? (Number(tokenSold) / (0.75 * Number(tokenSupply))) * 100
  //   : 0;
  // const curvePercentClamped = Math.min(Math.max(curvePercent, 0), 100);

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

  const tokenBalance = getBalance
    ? ethers.formatEther(getBalance.toString())
    : "0";
  const isTransactionPending = isWritePending || isConfirming;

  // Market cap calculations
  const totalSupplyTokens = tokenSupply / 1e18;
  // console.log("totalSupplyTokens", totalSupplyTokens);
  // console.log("oneTokenPriceETH", oneTokenPriceETH);
  // console.log("infoETHCurrentPrice", infoETHCurrentPrice);
  const marketCapETH =
    !isLoadingOneTokenPrice && oneTokenPriceETH !== null
      ? oneTokenPriceETH * totalSupplyTokens
      : 0;
  // console.log("marketCapETH", marketCapETH);
  const marketCapUSD = marketCapETH * infoETHCurrentPrice;

  // Pool valuation
  const tokenPool = tokenSupply - tokenSold;

  const priceFeedAddress = ETH_USDT_PRICE_FEED_ADDRESSES[debouncedChainId];

  // 3) Synchronous percent calculation
  const calculateCurvePercent = useCallback((): number => {
    if (!infoData) return 0;

    // pull out your sold & total

    if (isListed) {
      return 100;
    } else {
      const virtPool = Array.isArray(infoData) ? Number(infoData[9]) : 0;
      const ETHRaised = Array.isArray(infoData) ? Number(infoData[7]) : 0;
      const initPool = (virtPool - ETHRaised) / 1e18;

      const tokenSupply = Array.isArray(infoData) ? Number(infoData[6]) : 1;
      const index1 = (initPool * tokenSupply) / 1e18;

      if (listingMilestonePct === null) return 0;
      const lmstone = (listingMilestonePct / 100) * tokenSupply;

      const index2 = (tokenSupply - lmstone) / 1e18;
      const index1Div2 = index1 / index2;
      const index3 = (index1Div2 / index2) * (tokenSupply / 1e18);
      const finalMC = index3 * infoETHCurrentPrice;

      console.log("finalMC", finalMC);

      const m1 = Math.min(Math.max((marketCapUSD / finalMC) * 100, 0), 100);

      // const tokenSold = Array.isArray(infoData) ? Number(infoData[8]) : 0;
      // return Math.min(Math.max((tokenSold / allowed) * 100, 0), 100);
      return m1;
    }
    // require that the milestone has arrived
  }, [
    infoData,
    isListed,
    listingMilestonePct,
    infoETHCurrentPrice,
    marketCapUSD,
  ]);

  // 4) Memoize the final clamped value
  const curvePercentClamped = useMemo(
    () => calculateCurvePercent(),
    [calculateCurvePercent]
  );

  useEffect(() => {
    if (!isConnected && tokenAddress) {
      setIsLoadingFallbackAmountOut(true);
      const fetchFallbackData = async () => {
        try {
          if (isV1) {
            const [infoData, ethPrice] = await Promise.all([
              await getPureInfoV1DataRaw(
                debouncedChainId,
                tokenAddress
              ).catch(() => []),
              priceFeedAddress
                ? await getPureGetLatestETHPrice(
                  debouncedChainId,
                  priceFeedAddress
                ).catch(() => null)
                : Promise.resolve(null),
            ]);
            setFallbackInfoData(Array.isArray(infoData) ? infoData : []);
            setFallbackETHPrice(ethPrice);
          } else if (isV3) {
            const [infoData, ethPrice] = await Promise.all([
              await getPureInfoV3DataRaw(
                debouncedChainId,
                tokenAddress
              ).catch(() => []),
              priceFeedAddress
                ? await getPureGetLatestETHPrice(
                  debouncedChainId,
                  priceFeedAddress
                ).catch(() => null)
                : Promise.resolve(null),
            ]);
            setFallbackInfoData(Array.isArray(infoData) ? infoData : []);
            setFallbackETHPrice(ethPrice);
          } else if (isV4) {
            const [infoData, ethPrice] = await Promise.all([
              await getPureInfoV4DataRaw(
                debouncedChainId,
                tokenAddress
              ).catch(() => []),
              priceFeedAddress
                ? await getPureGetLatestETHPrice(
                  debouncedChainId,
                  priceFeedAddress
                ).catch(() => null)
                : Promise.resolve(null),
            ]);
            setFallbackInfoData(Array.isArray(infoData) ? infoData : []);
            setFallbackETHPrice(ethPrice);
          } else {
            const [infoData, ethPrice] = await Promise.all([
              await getPureInfoV2DataRaw(
                debouncedChainId,
                tokenAddress
              ).catch(() => []),
              priceFeedAddress
                ? await getPureGetLatestETHPrice(
                  debouncedChainId,
                  priceFeedAddress
                ).catch(() => null)
                : Promise.resolve(null),
            ]);
            setFallbackInfoData(Array.isArray(infoData) ? infoData : []);
            setFallbackETHPrice(ethPrice);
          }
        } catch (error) {
          console.error("Error loading fallback data:", error);
          setFallbackInfoData([]);
          setFallbackETHPrice(null);
        } finally {
          setIsLoadingFallbackAmountOut(false); // Reset loading state
        }
      };

      fetchFallbackData();
    }
  }, [isConnected, tokenAddress, priceFeedAddress, isV1, isV3, isV4, debouncedChainId]); // Added isV1 dependency

  // Load one token price
  useEffect(() => {
    async function fetchTokenMark() {
      if (!tokenAddress) return;

      setIsLoadingOneTokenPrice(true);
      try {
        const fn = isV1
          ? getPureAmountOutMarketCapV1
          : isV3
            ? getPureAmountOutMarketCapV3
            : isV4
              ? getPureAmountOutMarketCapV4
              : getPureAmountOutMarketCapV2;
        const raw = await fn(debouncedChainId, tokenAddress);
        console.log("raw one token price", raw);

        if (raw !== undefined && raw !== null) {
          const eth = Number(raw.toString()) / 1e18;
          setOneTokenPriceETH(eth);
        } else {
          setOneTokenPriceETH(0);
        }
      } catch (err) {
        console.error("Price fetch error:", err);
        setOneTokenPriceETH(0);
      } finally {
        setIsLoadingOneTokenPrice(false);
      }
    }

    fetchTokenMark();
  }, [tokenAddress, isV1, isV3, isV4, debouncedChainId]);

  useEffect(() => {
    if (tokenAddress && curvePercentClamped !== undefined) {
      setCurveProgressMap((prev) => ({
        ...prev,
        [tokenAddress]: curvePercentClamped,
      }));
    }
  }, [tokenAddress, curvePercentClamped]);

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
          `${isAutoUpdate ? "Auto-" : ""
          }Loading OHLC data for token: ${tokenAddress}, timeframe: ${selectedTimeframe.value
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
    [tokenAddress, selectedTimeframe, base]
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
        const res = await base.get("token", {
          params: { tokenAddress, include: "image" },
        });
        const all: TokenMetadata = res.data.data.data;
        console.log({ all });

        if (!all) {
          setToken(null);
          setTokenChainId(null);
          setTokenChainName(null);
          setIsLoadingToken(false);
          return;
        }
        setToken(all);
        setTokenChainId(all.chainId!);
        setTokenChainName(all.chainName!);
      } catch (error) {
        console.error("Error loading token metadata:", error);
        setToken(null);
        setTokenChainId(debouncedChainId); // Fallback to connected
        setTokenChainName(null); // Fallback to connected
      } finally {
        setIsLoadingToken(false);
      }
    })();
  }, [tokenAddress, base, debouncedChainId]);

  // Check approval needs
  useEffect(() => {
    if (
      mode === "sell" &&
      allowance !== undefined &&
      amount &&
      !isLoadingAllowance &&
      tokenAddress &&
      address
    ) {
      try {
        if (!amount || amount === "0" || amount === "") {
          setNeedsApproval(false);
          return;
        }
        const parsedAmount = ethers.parseEther(amount);
        const currentAllowance = allowance ?? BigInt(0);

        console.log("Checking approval:", {
          amount,
          parsedAmount: parsedAmount.toString(),
          currentAllowance: currentAllowance.toString(),
          needsApproval: currentAllowance < parsedAmount,
        });

        setNeedsApproval(currentAllowance < parsedAmount);
      } catch {
        setNeedsApproval(false);
      }
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, amount, isLoadingAllowance, mode, tokenAddress, address]);

  // Handle transaction errors
  useEffect(() => {
    if (error && lastTxnType === "approval") {
      setIsProcessingTxn(false);
    }
  }, [error, lastTxnType]);

  // Reset processing state
  useEffect(() => {
    if (!txHash) {
      setIsProcessingTxn(false);
    }
  }, [txHash]);

  // Handle transaction confirmation
  useEffect(() => {
    async function fetchTokenMet() {
      if (isConfirmed && txHash) {
        await refetchAllowance();

        if (lastTxnType === "approval") {
          // Small delay to ensure the blockchain state is updated
          setTimeout(async () => {
            await refetchAllowance();
            // Force recalculation of needsApproval
            setNeedsApproval(false);
          }, 1000);
        }

        refetchInfoData();
        refetchLatestETHPrice();
        if (isV1) {
          await getPureAmountOutMarketCapV1(debouncedChainId, tokenAddress!)
            .then((raw) => {
              if (raw !== undefined && raw !== null) {
                const eth = Number(raw.toString()) / 1e18;
                setOneTokenPriceETH(eth);
              } else {
                setOneTokenPriceETH(0);
              }
            })
            .catch((err) => {
              console.error("Error updating token price after txn:", err);
            });
        } else if (isV3) {
          await getPureAmountOutMarketCapV3(debouncedChainId, tokenAddress!)
            .then((raw) => {
              if (raw !== undefined && raw !== null) {
                const eth = Number(raw.toString()) / 1e18;
                setOneTokenPriceETH(eth);
              } else {
                setOneTokenPriceETH(0);
              }
            })
            .catch((err) => {
              console.error("Error updating token price after txn:", err);
            });
        } else if (isV4) {
          await getPureAmountOutMarketCapV4(debouncedChainId, tokenAddress!)
            .then((raw) => {
              if (raw !== undefined && raw !== null) {
                const eth = Number(raw.toString()) / 1e18;
                setOneTokenPriceETH(eth);
              } else {
                setOneTokenPriceETH(0);
              }
            })
            .catch((err) => {
              console.error("Error updating token price after txn:", err);
            });
        } else {
          await getPureAmountOutMarketCapV2(debouncedChainId, tokenAddress!)
            .then((raw) => {
              if (raw !== undefined && raw !== null) {
                const eth = Number(raw.toString()) / 1e18;
                setOneTokenPriceETH(eth);
              } else {
                setOneTokenPriceETH(0);
              }
            })
            .catch((err) => {
              console.error("Error updating token price after txn:", err);
            });
        }

        refetchSafuHolder();
        refetchSafuSupply();
        refetchSafuHolderBalance();
        refetchWhitelistBalance();
        refetchAmountOut();
        refetchLauncherAmount();
        refetchUniAmounts();
        refetchETHBalance();
        refetchBalance();

        refetchAllowance();
        setIsProcessingTxn(false);

        // Immediate chart update after successful transaction
        if (lastTxnType === "buy" || lastTxnType === "sell") {
          // Small delay to ensure backend has processed the transaction
          setTimeout(() => {
            loadChartData(true);
          }, 2000);
        }
      }
    }

    fetchTokenMet();
  }, [isConfirmed, txHash, lastTxnType, loadChartData, marketCapUSD, refetchUniAmounts, refetchLauncherAmount, marketCapETH, oneTokenPriceETH, infoETHCurrentPrice, totalSupplyTokens, tokenSupply, refetchInfoData, refetchAmountOut, refetchBalance, refetchAllowance, refetchLatestETHPrice, refetchETHBalance, refetchWhitelistBalance, refetchSafuHolderBalance, refetchSafuSupply, refetchSafuHolder, tokenAddress, isV1, isV3, isV4, debouncedChainId]);

  const loggedTxns = useRef<Set<string>>(new Set());

  // Enhanced fetchLogs with callback for chart update
  const fetchLogsWithCallback = useCallback(async () => {
    if (!tokenAddress) return;
    try {
      const response = await base.get(
        `transactions?limit=100&tokenAddress=${tokenAddress}`
      );
      const all: TxLog[] = await response.data.data.data;
      console.log("all", all);
      const filtered = all.filter(
        (tx) => tx.type === "buy" || tx.type === "sell"
      );
      setTxLogs(filtered);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  }, [tokenAddress, base]);

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
          const timestamp = Date.now();

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
          fetchLogsWithCallback();
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
    fetchLogsWithCallback,
  ]);

  // Replace the existing fetchLogs effect
  useEffect(() => {
    fetchLogsWithCallback();

    if (!socket.connected) {
      console.log("socket connected");
      socket.connect();
    }

    // ...existing code...
    const handleReceiveTransaction = (tx: TxLog) => {
      if (tx.type === "buy" || tx.type === "sell") {
        setTxLogs((prevLogs) => {
          const updated = [tx, ...prevLogs];
          // Update chart and curve progress for all devices
          setTimeout(() => loadChartData(true), 100);

          // Calculate new curve progress based on updated txLogs
          // You may need to fetch latest tokenSold and tokenSupply, but here's a simple example:
          if (tokenAddress && tokenSupply > 0) {
            // Calculate total tokens sold from updated logs
            const totalSold = updated.reduce(
              (sum, log) =>
                sum + (log.type === "buy" ? Number(log.tokenAmount) : 0),
              0
            );

            const curvePercent =
              // isV1
              // ?
              (totalSold /
                ((Number(listingMilestonePct) / 1e2) * tokenSupply)) *
              100;
            // : (totalSold / (0.75 * tokenSupply)) * 100;
            const curvePercentClamped = Math.min(
              Math.max(curvePercent, 0),
              100
            );

            setCurveProgressMap((prev) => ({
              ...prev,
              [tokenAddress]: curvePercentClamped,
            }));
          }

          return updated;
        });
      }
    };
    // ...existing code...
    socket.on("recTransaction", handleReceiveTransaction);

    return () => {
      socket.off("recTransaction", handleReceiveTransaction);
      socket.disconnect();
    };
  }, [
    fetchLogsWithCallback,
    isAutoUpdateEnabled,
    loadChartData,
    tokenAddress,
    tokenSupply,
    listingMilestonePct,
    // isV1,
  ]);

  // Volume calculations
  const now = Date.now();
  const since24h = now - 24 * 60 * 60 * 1000;
  const since7d = now - 7 * 24 * 60 * 60 * 1000;
  const logs1d = txLogs.filter(
    (tx) => new Date(tx.timestamp).getTime() >= since24h
  );
  const logs7d = txLogs.filter(
    (tx) => new Date(tx.timestamp).getTime() >= since7d
  );

  const sumVolume = (logs: TxLog[]) =>
    logs.reduce((sum, tx) => sum + parseFloat(tx.ethAmount), 0);

  const volume1dEth = sumVolume(logs1d);
  const volume7dEth = sumVolume(logs7d);
  const volumeAllEth = sumVolume(txLogs);

  const volume1dUsd = volume1dEth * infoETHCurrentPrice;
  const volume7dUsd = volume7dEth * infoETHCurrentPrice;
  const volumeAllUsd = volumeAllEth * infoETHCurrentPrice;

  const volumeOptions = useMemo(
    () => [
      {
        label: "24h",
        eth: volume1dEth,
        usd: volume1dUsd,
      },
      {
        label: "7 Days",
        eth: volume7dEth,
        usd: volume7dUsd,
      },
      {
        label: "All Time",
        eth: volumeAllEth,
        usd: volumeAllUsd,
      },
    ],
    [
      volume1dEth,
      volume1dUsd,
      volume7dEth,
      volume7dUsd,
      volumeAllEth,
      volumeAllUsd,
    ]
  );

  const tokenPriceUSD = useMemo(() => {
    if (oneTokenPriceETH !== null && infoETHCurrentPrice > 0) {
      return oneTokenPriceETH * infoETHCurrentPrice;
    }
    return 0;
  }, [oneTokenPriceETH, infoETHCurrentPrice]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const defaultVolumeLabel = "24h";
  const [selectedVolume, setSelectedVolume] = useState({
    label: defaultVolumeLabel,
    eth: 0,
    usd: 0,
  });

  // Update selectedVolume when volume data becomes available
  useEffect(() => {
    const found = volumeOptions.find((opt) => opt.label === defaultVolumeLabel);
    if (found && found.usd > 0) {
      setSelectedVolume(found);
    }
  }, [
    volume1dUsd,
    volume1dEth,
    volume7dUsd,
    volume7dEth,
    volumeAllUsd,
    volumeAllEth,
    volumeOptions,
  ]);

  const volumeDropdownRef = useRef<HTMLDivElement>(null);

  // Close volume dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isDropdownOpen &&
        volumeDropdownRef.current &&
        !volumeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

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

  const handleMaxClick = useCallback(async () => {
    if (mode === "sell" && getBalance) {
      const maxAmount = ethers.formatEther(getBalance.toString());
      setAmount(maxAmount);

      // Force allowance check after setting max amount
      setTimeout(() => {
        refetchAllowance();
      }, 100);
    }
  }, [mode, getBalance, refetchAllowance]);

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

    try {
      setIsProcessingTxn(true);
      setLastTxnType("approval");
      setErrorMsg("");

      // Determine spender based on listing status
      const spender = isListed
        ? ROUTER_ADDRESSES_LIST[debouncedChainId]
        : isV1
          ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
          : isV3
            ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
            : isV4
              ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
              : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId];

      writeContract({
        ...TOKEN_ABI,
        functionName: "approve",
        address: tokenAddress,
        args: [spender as `0x${string}`, MaxUint256 as bigint],
      });
    } catch (error) {
      console.error("Approval rejected:", error);
      setErrorMsg("Approval was rejected");
      setIsProcessingTxn(false);
    }
  }, [tokenAddress, isLoadingAllowance, isConfirming, mode, amount, isListed, getChainIdForContract, isV1, isV3, isV4, writeContract]);

  useEffect(() => {
    // Refetch allowance when user changes amount (debounced)
    const timeoutId = setTimeout(() => {
      if (mode === "sell" && amount && !isLoadingAllowance) {
        refetchAllowance();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [amount, mode, refetchAllowance, isLoadingAllowance]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      if (e) e.preventDefault();
      if (!tokenAddress || isConfirming) return;

      setErrorMsg("");
      setLastTxnType(mode);

      if (isListed) {
        try {
          // Calculate slippage-adjusted min amount
          const amountOutRaw = amountOutSelect;
          if (!amountOutRaw) throw new Error("Could not fetch swap quote");

          const slippageBasis = 10000n - BigInt(Math.round(slippage * 100));
          const minAmountOut = (amountOutRaw * slippageBasis) / 10000n;

          // Calculate deadline
          const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

          // Choose swap method based on tax status
          const methodName = isTaxedOnDex
            ? mode === "buy"
              ? "swapExactETHForTokensSupportingFeeOnTransferTokens"
              : "swapExactTokensForETHSupportingFeeOnTransferTokens"
            : mode === "buy"
              ? "swapExactETHForTokens"
              : "swapExactTokensForETH";

          if (mode === "buy") {
            console.log("buy", {
              ...UNISWAP_ROUTER_ABI,
              address: routerAddress as `0x${string}`,
              functionName: methodName,
              args: [
                minAmountOut, // amountOutMin
                uniPath as readonly `0x${string}`[],
                address as `0x${string}`,
                BigInt(deadline),
              ],
              value: ethValue,
            });
            // BUY transaction
            writeContract({
              ...UNISWAP_ROUTER_ABI,
              address: routerAddress as `0x${string}`,
              functionName: methodName,
              args: [
                minAmountOut, // amountOutMin
                uniPath as readonly `0x${string}`[],
                address as `0x${string}`,
                BigInt(deadline),
              ],
              value: ethValue,
            });
          } else {
            console.log("sell", {
              ...UNISWAP_ROUTER_ABI,
              address: routerAddress as `0x${string}`,
              functionName: methodName,
              args: [
                tokenValue, // amountIn
                minAmountOut, // amountOutMin
                uniPath as readonly `0x${string}`[],
                address as `0x${string}`,
                BigInt(deadline),
              ],
              value: ethValue,
            });

            // SELL transaction
            writeContract({
              ...UNISWAP_ROUTER_ABI,
              address: routerAddress as `0x${string}`,
              functionName: methodName,
              args: [
                tokenValue, // amountIn
                minAmountOut, // amountOutMin
                uniPath as readonly `0x${string}`[],
                address as `0x${string}`,
                BigInt(deadline),
              ],
            });
          }
        } catch (error) {
          setErrorMsg("Swap setup failed: " + (error as Error).message);
          return;
        }
      } else {
        // Existing SafuLauncher logic
        writeContract({
          abi: isV1
            ? LAUNCHER_ABI_V1.abi
            : isV3
              ? LAUNCHER_ABI_V3.abi
              : isV4
                ? LAUNCHER_ABI_V4.abi
                : LAUNCHER_ABI_V2.abi,
          address: isV1
            ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
            : isV3
              ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
              : isV4
                ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
                : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
          functionName: mode,
          args: mode === "sell" ? [tokenAddress, tokenValue] : [tokenAddress],
          value: mode === "buy" ? ethValue : undefined,
        });
      }
      setIsProcessingTxn(true);
    },
    [tokenAddress, isConfirming, mode, isListed, amountOutSelect, slippage, deadlineMinutes, isTaxedOnDex, routerAddress, uniPath, address, ethValue, writeContract, tokenValue, isV1, isV3, isV4, debouncedChainId]
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
              message: `Entry ${index + 1
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
      abi: isV1
        ? LAUNCHER_ABI_V1.abi
        : isV3
          ? LAUNCHER_ABI_V3.abi
          : isV4
            ? LAUNCHER_ABI_V4.abi
            : LAUNCHER_ABI_V2.abi,
      address: isV1
        ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
        : isV3
          ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
          : isV4
            ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
            : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
      functionName: "startTrading",
      args: [tokenAddress as `0x${string}`],
    });
    setIsProcessingTxn(true);
  }, [tokenAddress, isTokenCreator, writeContract, isV1, isV3, isV4, debouncedChainId]);

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
      abi: isV1
        ? LAUNCHER_ABI_V1.abi
        : isV3
          ? LAUNCHER_ABI_V3.abi
          : isV4
            ? LAUNCHER_ABI_V4.abi
            : LAUNCHER_ABI_V2.abi,
      address: isV1
        ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
        : isV3
          ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
          : isV4
            ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
            : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
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
      abi: isV1
        ? LAUNCHER_ABI_V1.abi
        : isV3
          ? LAUNCHER_ABI_V3.abi
          : isV4
            ? LAUNCHER_ABI_V4.abi
            : LAUNCHER_ABI_V2.abi,
      address: isV1
        ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
        : isV3
          ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
          : isV4
            ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
            : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
      functionName: "disableWhitelist",
      args: [tokenAddress as `0x${string}`],
    });
    setIsProcessingTxn(true);
  }, [tokenAddress, isTokenCreator, writeContract, isV1, isV3, isV4, debouncedChainId]);

  const handleDisableMaxWalletLimit = useCallback(() => {
    if (!tokenAddress || !isTokenCreator) return;

    setErrorMsg("");
    setLastTxnType("disableMaxWalletLimit");

    writeContract({
      abi: isV1
        ? LAUNCHER_ABI_V1.abi
        : isV3
          ? LAUNCHER_ABI_V3.abi
          : isV4
            ? LAUNCHER_ABI_V4.abi
            : LAUNCHER_ABI_V2.abi,
      address: isV1
        ? SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId]
        : isV3
          ? SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId]
          : isV4
            ? SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId]
            : SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
      functionName: "disableMaxWalletLimit",
      args: [tokenAddress as `0x${string}`],
    });
    setIsProcessingTxn(true);
  }, [tokenAddress, isTokenCreator, writeContract, isV1, isV3, isV4, debouncedChainId]);

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
        return { isDisabled: true, message: `Insufficient ${tokenChainName} balance` };
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

  function formatRelativeTime(dateInput: string | Date): string {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const now = new Date();
    const target = new Date(dateInput);
    const diff = target.getTime() - now.getTime();

    const seconds = Math.round(diff / 1000);
    const minutes = Math.round(diff / (1000 * 60));
    const hours = Math.round(diff / (1000 * 60 * 60));
    const days = Math.round(diff / (1000 * 60 * 60 * 24));

    if (Math.abs(seconds) < 60) {
      return rtf.format(seconds, "second");
    } else if (Math.abs(minutes) < 60) {
      return rtf.format(minutes, "minute");
    } else if (Math.abs(hours) < 24) {
      return rtf.format(hours, "hour");
    } else {
      return rtf.format(days, "day");
    }
  }

  useEffect(() => {
    if (!tokenAddress) return;

    async function fetchWithRetry<T>(
      fn: () => Promise<T>,
      retries = 3,
      delay = 500,
      attempt = 1
    ): Promise<T> {
      try {
        return await fn();
      } catch (err: any) {
        const status = err?.response?.status;

        // Skip retry if it's a permanent error (404)
        if (status === 404) {
          console.warn(`No message count found for ${tokenAddress} (404)`);
          throw err;
        }

        if (retries === 0) throw err;

        console.warn(
          `Attempt ${attempt} failed for ${tokenAddress}, retrying in ${delay}ms...`,
          err
        );

        await new Promise((res) => setTimeout(res, delay));
        return fetchWithRetry(fn, retries - 1, delay * 2, attempt + 1);
      }
    }

    async function fetchMessageCount() {
      try {
        const res = await fetchWithRetry(() =>
          base.get(`message-count/${tokenAddress}`)
        );
        setMessageCount(Number(res?.data?.data ?? 0));
      } catch (err) {
        console.error(
          `Error fetching message count for ${tokenAddress} after retries`,
          err
        );
        setMessageCount(0);
      }
    }

    fetchMessageCount();
  }, [tokenAddress, base]);

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
            {token.image?.path && (
              <div className="flex items-center mb-1">
                {token.tokenImageId && (
                  <img
                    src={`${networkInfo.apiBaseUrl}${token.image?.path}`}
                    alt={`${token.symbol} logo`}
                    className="w-10 h-10 rounded-md mt-2"
                    crossOrigin=""
                  />
                )}
              </div>
            )}
            <div>
              {/* Always Visible Heading */}
              <div className="flex flex-col gap-y-3 lg:flex-row">
                <div className="flex items-center gap-x-4">
                  <h1 className="text-2xl tracking-tight font-bold dark:text-white text-black font-raleway">
                    {token.name}{" "}
                    <span className="dark:text-white/60 text-black/80">
                      ({token.symbol})
                    </span>
                  </h1>
                  <div className="flex items-center gap-2 mt-1 self-start mr-2">
                    {token.twitter && (
                      <a
                        href={token.twitter}
                        className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {/* Twitter SVG */}
                        <FaXTwitter className="text-black dark:text-white text-[15px]" />
                      </a>
                    )}
                    {token.telegram && (
                      <a
                        href={token.telegram}
                        className=""
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaTelegram className="text-black dark:text-white text-[32px]" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Conditional Admin Buttons */}
                {isTokenCreator && (
                  <div className="flex gap-2 h-fit">
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
                      className={`w-full rounded-xl px-6 py-4 text-white font-semibold mt-10 ${isFormValid
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

            <div className="flex items-center gap-1 justify-end my-2 lg:my-0">
              <span className=" font-medium dark:text-white text-black">
                {showSectionA ? "Token Info" : "Launch Info"}
              </span>

              <div
                onClick={() => {
                  setShowSectionA((prev) => !prev);
                  setAutoSlideEnabled(false);
                }}
                className={`w-[40px] h-[20px] rounded-full p-[2px] cursor-pointer flex items-center transition-colors duration-300
      ${showSectionA ? "bg-Primary" : "bg-white"} shadow-inner relative`}
              >
                <div
                  className={`absolute z-20 left-[2px] pt-[1px] size-[20px] rounded-full flex items-center justify-center
        transition-transform duration-300 ease-in-out dark:shadow-[1px_-2px_12px_0px_rgba(71,_71,_77,_0.5)]
        ${showSectionA
                      ? "translate-x-[17.5px] bg-white"
                      : "translate-x-0 bg-[#D9D9D9]"
                    }`}
                >
                  {showSectionA ? (
                    <CircleCheckBig className="text-Primary w-[12px] h-[12px]" />
                  ) : (
                    <div className="flex items-center justify-center  border border-Primary rounded-full">
                      <X className="text-Primary w-[8px] h-[8px]" />
                    </div>
                  )}
                </div>

                {/* Static X on left */}
                <div className="absolute left-[5px] flex items-center justify-center z-10 border border-white rounded-full">
                  <X className="text-white w-[8px] h-[8px]" />
                </div>

                {/* Static Check on right */}
                <div className="absolute right-[5px] z-10">
                  <CircleCheckBig className="text-black w-[8px] h-[8px]" />
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className={`transition-opacity duration-700 ${showSectionA
                  ? "opacity-100 relative z-40"
                  : "opacity-0 absolute inset-0 pointer-events-none -z-50"
                  }`}
              >
                {/* ✅ Section A — Token Metadata */}
                <div className="grid sm:grid-cols-2 gap-3 mt-2 text-sm">
                  {/* Token Name, Symbol, Address, etc. (your current SectionA content) */}
                  <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex flex-col">
                    <h2 className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway text-sm">
                      Token Name
                    </h2>
                    <p className="text-xs text-black/80 dark:text-white/80">
                      {token.name}
                    </p>
                  </div>
                  <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex flex-col">
                    <h2 className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway text-sm">
                      Token Symbol
                    </h2>
                    <p className="text-xs text-black/80 dark:text-white/80">
                      {token.symbol}
                    </p>
                  </div>
                  <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex flex-col break-all">
                    <h2 className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway text-sm">
                      Token Address
                    </h2>
                    <div className="flex items-start">
                      <p className="text-xs text-black/80 dark:text-white/80">
                        {token.tokenAddress}
                      </p>
                      <CopyButton value={token.tokenAddress} />
                    </div>
                  </div>

                  {token.description && (
                    <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex flex-col">
                      <h2 className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway text-sm">
                        Token Description
                      </h2>
                      <p className="text-xs text-black/80 dark:text-white/80">
                        {token.description}
                      </p>
                    </div>
                  )}

                  {token.website && (
                    <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex flex-col">
                      <h2 className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway text-sm">
                        Website
                      </h2>
                      <a href={token.website} target="_blank" rel="noreferrer">
                        <p className="text-xs text-black/80 dark:text-white/80 hover:underline">
                          {token.website}
                        </p>
                      </a>
                    </div>
                  )}
                  {token?.createdAt && (
                    <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex flex-col">
                      <h2 className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway text-sm">
                        Created
                      </h2>
                      <p className="text-xs text-black/80 dark:text-white/80">
                        {(() => {
                          const createdAt = new Date(token.createdAt);
                          const absoluteTime = createdAt.toLocaleString(
                            "en-US",
                            {
                              timeZone: "UTC",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            }
                          );
                          const relativeTime = formatRelativeTime(
                            token.createdAt
                          );
                          return `${absoluteTime} UTC (${relativeTime})`;
                        })()}
                      </p>
                    </div>
                  )}

                  <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex items-center justify-between">
                    <h2 className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway text-sm">
                      Social Links
                    </h2>
                    {/* Social Links */}
                    <div className="flex justify-end items-center gap-2 mt-1">
                      {token.twitter && (
                        <a
                          href={token.twitter}
                          className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {/* Twitter SVG */}
                          <FaXTwitter className="text-black dark:text-white text-[15px]" />
                        </a>
                      )}
                      {token.telegram && (
                        <a
                          href={token.telegram}
                          className=""
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaTelegram className="text-black dark:text-white text-[32px]" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`transition-opacity duration-700 ${showSectionA ? "opacity-0 absolute inset-0" : "opacity-100"
                  }`}
              >
                {/* 🚀 Section B — Launch Info */}
                <div className="grid sm:grid-cols-2 gap-3 mt-2 text-sm">
                  {/* Launch status, isBundled, Max wallet, etc. (your current SectionB content) */}
                  {[
                    { label: "Trading Started", value: isStartTrading },
                    {
                      label: "Dev Bundled",
                      value: isBundled,
                      extra: isBundled
                        ? `${token?.percentBundled ?? 0}%`
                        : undefined,
                    },
                    {
                      label: "Tax on Dex",
                      value: isTaxedOnDex,
                      extra: isTaxedOnDex ? `${taxOnDexBps ?? 0}%` : undefined,
                    },
                    {
                      label: "Tax on SafuLauncher",
                      value: IsTaxedOnSafu,
                      extra: IsTaxedOnSafu
                        ? `${taxOnSafuBps ?? 0}%`
                        : undefined,
                    },
                    { label: "Whitelist Ongoing", value: isWhiteListOngoing },
                    {
                      label: "Max wallet size on SafuLauncher",
                      value: isMaxWalletOnSafu,
                      extra:
                        isMaxWalletOnSafu !== 0
                          ? `${maxWalletAmountOnSafu ?? 0}%`
                          : undefined,
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
                          extra: `${ywhitelistBalance.toFixed(2) ?? 0} ${token?.symbol
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
                        {`${mode === "buy" ? tokenChainName : token.symbol}`}
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
                          ).toFixed(2)} ${tokenChainName}`
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
                            `${parseFloat(tokenBalance).toLocaleString()} ${token.symbol
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
                          <>
                            {formatTokenAmount(
                              (Number(amountOutSelect.toString()) / 1e18) *
                              (isListed && isTaxedOnDex
                                ? 1 - taxOnDexBps / 100
                                : 1),
                              mode === "sell" ? 8 : 2
                            )}
                            {isListed && isTaxedOnDex && (
                              <span className="text-xs text-red-400 ml-1">
                                (-{taxOnDexBps}% tax)
                              </span>
                            )}
                          </>
                        ) : (
                          "0"
                        )}
                      </span>
                      <span className="ml-1 font-raleway font-medium text-xs flex items-center gap-1">
                        {mode === "sell" && (
                          <FaEthereum className="text-base" />
                        )}
                        {`${mode === "buy" ? token.symbol : tokenChainName}`}
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

                  <div className="relative">
                    <div className="flex items-center gap-2">
                      {/* Settings Button - only shown when listed */}
                      {isListed === 1 ? (
                        <button
                          type="button"
                          onClick={() => setShowSettings(!showSettings)}
                          className="p-2 rounded-full bg-black/10 dark:bg-white/10 border border-white/10 hover:bg-[#0C8CE0] transition"
                        >
                          <FiSettings className="text-black dark:text-white text-sm" />
                        </button>
                      ) : (
                        ""
                      )}

                      <button
                        type="button"
                        onClick={handleButtonClick}
                        className={`flex-1 rounded-lg py-2 text-white text-xs bg-[#0C8CE0] hover:bg-blue-600 transition ${validationState.isDisabled
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
                    </div>
                    {/* Settings Panel */}
                    {showSettings && (
                      <div className="absolute z-[10000] bottom-full mb-2 p-4 bg-white dark:bg-[#0B132B] border-2 dark:border-white/20 border-black/30 rounded-lg shadow-xl drop-shadow-lg outline-1 outline-black/10 dark:outline-white/10 w-full max-w-xs">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium dark:text-white text-black">
                            Swap Settings
                          </h3>
                          <button
                            onClick={() => setShowSettings(false)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs dark:text-white/70 text-black/70 mb-1">
                              Slippage tolerance
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={slippage}
                                onChange={(e) =>
                                  setSlippage(
                                    Math.max(
                                      0.1,
                                      Math.min(100, Number(e.target.value))
                                    )
                                  )
                                }
                                className="w-full p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white text-black"
                                step="0.1"
                              />
                              <span className="ml-2 dark:text-white text-black">
                                %
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs dark:text-white/70 text-black/70 mb-1">
                              Transaction deadline
                            </label>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={deadlineMinutes}
                                onChange={(e) =>
                                  setDeadlineMinutes(
                                    Math.max(
                                      1,
                                      Math.min(60, Number(e.target.value))
                                    )
                                  )
                                }
                                className="w-full p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white text-black"
                              />
                              <span className="ml-2 dark:text-white text-black">
                                minutes
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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
                        href={`${networkInfo.explorerUrl}/tx/${txHash}`}
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
              <div className="w-full max-w-[40rem] bg-[#031E51]/95 h-[30px] border-2 border-[#031E51] rounded-full overflow-hidden relative mt-auto p-1.5">
                {/* Percentage Label */}
                <p className="absolute right-4 text-white text-[13px] font-semibold z-50 flex items-center">
                  {isLoadingInfoData ? (
                    <span className="h-full w-full bg-gray-600 animate-pulse rounded-full" />
                  ) : (
                    `${curvePercentClamped.toFixed(2) ?? "0"}%`
                  )}
                </p>

                {!isLoadingInfoData &&
                  Array.from({ length: 50 }).map((_, i) => {
                    if (i === 0) return null;
                    const stripeWidth = 4;
                    const spacing = 100 / 50;
                    return (
                      <div
                        key={i}
                        className="bg-[#031E51] h-full absolute top-0 -skew-x-[24deg] z-40"
                        style={{
                          width: `${stripeWidth}px`,
                          left: `calc(${(i * spacing).toFixed(2)}% - ${stripeWidth / 2
                            }px)`,
                        }}
                      />
                    );
                  })}

                {/* Progress Fill */}
                {(() => {
                  const progress = curveProgressMap[token.tokenAddress] || 0;
                  const gradientStyle: React.CSSProperties = {};

                  if (!isLoadingInfoData) {
                    gradientStyle.backgroundImage =
                      getProgressGradient(progress);
                  }

                  return (
                    <div
                      className={`h-full absolute top-0 left-0 z-10 transition-all duration-500 ease-in-out ${progress < 100 ? "rounded-l-full" : "rounded-full"
                        } ${isLoadingInfoData ? "bg-gray-600" : ""}`}
                      style={{
                        width: `${isLoadingInfoData ? 0 : progress}%`,
                        ...gradientStyle,
                      }}
                    />
                  );
                })()}

                <div
                  className={`h-full absolute top-0 left-0 z-10 transition-all duration-500 ease-in-out ${curvePercentClamped < 100
                    ? "rounded-l-full"
                    : "rounded-full"
                    } ${isLoadingInfoData ? "bg-gray-600" : ""}`}
                  style={{
                    width: `${isLoadingInfoData ? 0 : curvePercentClamped}%`,
                    backgroundImage: isLoadingInfoData
                      ? undefined
                      : getProgressGradient(curvePercentClamped),
                  }}
                />
              </div>
            </div>

            {/* Top Holders */}
            <div className="mt-6">
              <TopHoldersTable
                tokenAddress={token.tokenAddress}
                creatorAddress={token.tokenCreator}
                bondingAddrs={
                  [
                    SAFU_LAUNCHER_ADDRESSES_V1[debouncedChainId],
                    SAFU_LAUNCHER_ADDRESSES_V2[debouncedChainId],
                    SAFU_LAUNCHER_ADDRESSES_V3[debouncedChainId],
                    SAFU_LAUNCHER_ADDRESSES_V4[debouncedChainId],
                  ].filter(Boolean) as string[]
                }
                chainId={debouncedChainId}
              />
            </div>
          </div>

          {/* Right section */}

          <div className="w-full lg:w-[55%]">
            <div className="">
              {/* Tab Buttons */}
              <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center mb-2">
                <h1 className="text-left text-[20px] lg:text-[24px] font-raleway font-medium dark:text-white text-black">
                  Chart
                </h1>
                {!isListed && (
                  <div className="flex items-start gap-2 w-fit">
                    <div className="flex flex-col md:flex-row items-start gap-2 w-fit">
                      <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex items-center justify-between relative group">
                        <p className="dark:text-white text-black text-sm">
                          <span className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway">
                            Token Supply:
                          </span>{" "}
                          {(tokenSupply / 1e18).toLocaleString()}
                        </p>
                      </div>
                      <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex items-center justify-between relative group">
                        <p className="dark:text-white text-black text-sm">
                          <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                            Market Cap:
                          </span>{" "}
                          {marketCapUSD > 0
                            ? `$${formatTokenAmount(marketCapUSD)}`
                            : "Calculating..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start gap-2 w-fit">
                      <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex items-center justify-between relative group w-fit">
                        <p className="dark:text-white text-black text-sm">
                          <span className="dark:text-[#ea981c] text-[#FF0199] font-medium font-raleway">
                            {`Pooled ${tokenChainName}`}:
                          </span>{" "}
                          {(ethRaised / 1e18).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div className="dark:bg-[#ea971c0a] bg-[#FF0199]/5 rounded-lg px-3 py-2 flex items-center justify-between relative group w-fit">
                        <p className="dark:text-white text-black text-sm">
                          <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                            Pooled {token.symbol}:
                          </span>{" "}
                          {(tokenPool / 1e18).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Tab Content */}

              <div className="">
                {/* Chart Header */}
                {!isListed && (
                  <div className="chart-header dark:bg-[#0B132B] border dark:border-white/10 border-black/50 rounded-t-xl px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between text-sm">
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
                        className={`px-3 py-[3px] rounded text-xs font-medium ${isAutoUpdateEnabled
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          } transition duration-150`}
                      >
                        {isAutoUpdateEnabled ? "Auto" : "Manual"}
                      </button>

                      <div className="text-xs dark:text-white/50 text-black/80 ml-1">
                        Last updated:{" "}
                        <span className="">
                          {new Date(lastUpdateTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold dark:text-white text-black font-raleway relative z-40">
                        ${tokenPriceUSD.toFixed(4)}
                      </p>
                    </div>
                    {/* Volume summary */}
                    {/* Volume dropdown display */}
                    <div
                      ref={volumeDropdownRef}
                      className="relative z-30 w-fit"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <div className="cursor-pointer rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="dark:text-[#EA971C] text-[#FF0199] font-medium font-raleway">
                          Volume ({selectedVolume.label}):
                        </span>
                        <span className="dark:text-white text-black whitespace-nowrap">
                          $
                          {selectedVolume.usd.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        <FaChevronDown
                          className={`ml-1 text-sm transition-transform cursor-pointer text-black dark:text-white ${isDropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                      </div>

                      {/* Dropdown menu */}
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 right-0 bg-white dark:bg-[#0B132B] border border-white/10 rounded-lg shadow-lg w-max">
                          {volumeOptions.map((option) => (
                            <div
                              key={option.label}
                              onClick={() => {
                                setSelectedVolume(option);
                                setIsDropdownOpen(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/10 text-sm cursor-pointer flex justify-between gap-4"
                            >
                              <span className="text-[#FF0199] dark:text-[#EA971C] font-medium">
                                {option.label}
                              </span>
                              <span className="dark:text-white text-black whitespace-nowrap">
                                $
                                {option.usd.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chart Container */}
                <div>
                  <div className="chart-container">
                    {isListed ? (
                      <div className="h-[390px] w-full">
                        <iframe
                          title="GeckoTerminal Embed"
                          src={`https://www.geckoterminal.com/eth/pools/${token.tokenAddress}?embed=1&info=0&swaps=0&light_chart=0&chart_type=price&resolution=15m&bg_color=111827`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="clipboard-write"
                          allowFullScreen
                        />
                      </div>
                    ) : isLoadingChart ? (
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
            </div>

            <div className="mt-[34px]">
              {/* Tabs Header */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("transactions")}
                  className={`px-4 py-2 rounded-lg lg:text-[20px] font-raleway font-medium text-left ${activeTab === "transactions"
                    ? " dark:text-white text-[#141314]"
                    : "dark:text-white/60 text-[#141314]/40"
                    } transition cursor-pointer`}
                >
                  Recent Transactions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-2 rounded-lg lg:text-[20px] flex items-center gap-2 font-raleway font-medium text-left ${activeTab === "chat"
                    ? "dark:text-white text-[#141314]"
                    : "dark:text-white/60 text-[#141314]/40"
                    } transition cursor-pointer`}
                >
                  Community Chat{" "}
                  {/* {messageCount > 0 && (
                    <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      {messageCount}
                    </span> */}
                  <div className="mt-auto relative">
                    <Message className="size-6" />
                    <p className="absolute -right-1 -top-1 text-white size-4 text-xs flex items-center justify-center rounded-full bg-red-500">
                      {messageCount}
                    </p>
                  </div>
                </button>
              </div>

              {/* Tabs Content */}
              <div className=" backdrop-blur-md py-4">
                {activeTab === "transactions" ? (
                  <>
                    <div className="tx-table overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="min-w-[900px] lg:min-w-[700px] text-sm dark:text-white/80">
                        <thead className="text-left dark:text-white/60 text-[#141313]/75 mb-4 border-black/10 border-b-2 dark:border-b-white/20 ">
                          <tr>
                            <th className="py-3 pl-1">Type</th>
                            <th className="py-3">Market Cap</th>
                            <th className="py-3 px-2">Wallet</th>
                            <th className="py-3 px-2">{tokenChainName}</th>
                            <th className="py-3 px-2">{token.symbol}</th>
                            <th className="py-3 px-2">Txn</th>
                            <th className="py-3 px-2">Date / Time (UTC)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTxLogs.map((tx, i) => (
                            <tr
                              key={i}
                              className="mb-4 border-b-2 dark:border-b-white/20 border-black/10 last-of-type:border-none"
                            >
                              <td
                                className={`font-medium py-3 pl-1 flex items-center gap-1 ${tx.type === "buy"
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
                              <td className="dark:text-white text-black text-center">
                                {" "}
                                {/* Market Cap Cell */}
                                {tx.oldMarketCap
                                  ? `$${Number(tx.oldMarketCap).toLocaleString(
                                    undefined,
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}`
                                  : "—"}
                              </td>

                              <td className="dark:text-white/80 text-[#141313] font-semibold">
                                {tx.wallet.slice(0, 6)}…{tx.wallet.slice(-4)}
                              </td>
                              <td className="dark:text-white/80 text-[#141313] font-semibold">
                                {Number(tx.ethAmount).toFixed(3)}
                              </td>
                              <td className="dark:text-white/80 text-[#141313] font-semibold">
                                {Number(tx.tokenAmount).toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td>
                                <a
                                  href={`${networkInfo.explorerUrl}/tx/${tx.txnHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-400 hover:underline"
                                >
                                  {tx.txnHash.slice(0, 6)}…
                                  {tx.txnHash.slice(-4)}
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
                    <Chat
                      address={address}
                      tokenAddress={tokenAddress}
                      onMessageCountChange={setMessageCount}
                    />
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
