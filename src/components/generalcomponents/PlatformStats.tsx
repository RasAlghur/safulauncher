// src/compponents/generalcomponents/PlatfromStats.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TrendingTokens from "./TrendingTokens";
import NotableBuys from "./NotableBuys";
import Reward from "../svgcomponents/Reward";
import VolumeIcon from "../svgcomponents/Volume";
import FeeCollected from "../svgcomponents/FeeCollected";
import TokensLaunched from "../svgcomponents/TokensLaunched";
import TokensListed from "../svgcomponents/TokensListed";
import AverageBonding from "../svgcomponents/AverageBonding";
import TaxTokens from "../svgcomponents/TaxTokens";
import ZeroTaxTokens from "../svgcomponents/ZeroTaxTokens";
import SafuHolders from "../svgcomponents/SafuHolders";
import AverageVolume from "../svgcomponents/AverageVolume";
import UniqueWallet from "../svgcomponents/UniqueWallet";
import Donate from "../svgcomponents/Donate";
import DustParticles from "./DustParticles";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";
import {
  ETH_USDT_PRICE_FEED_ADDRESSES,
  SAFU_TOKEN_ADDRESSES,
  GIGGLE_ACADEMY_WALLET,
  SAFU_LAUNCHER_ADDRESSES_V3,
} from "../../web3/config";
import {
  getPureMetrics,
  getPureGetLatestETHPrice,
  getPureUniqueTraderCount,
} from "../../web3/readContracts";
import cloudRight from "../../assets/cloud-right.png";
import { useApiClient } from "../../lib/api";
import Moralis from "moralis";

gsap.registerPlugin(ScrollTrigger);

export interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  createdAt?: string;
  expiresAt?: string;
}

// Interface for storing transfer data
interface TransferData {
  totalBNBTransferred: number;
  lastBlockNumber: number;
  lastFetchTimestamp: number;
}

// Default data structure
const DEFAULT_TRANSFER_DATA: TransferData = {
  totalBNBTransferred: 0,
  lastBlockNumber: 0,
  lastFetchTimestamp: 0,
};

// localStorage key
const STORAGE_KEY = "bnb_transfers_data";

// Helper function to read transfer data from localStorage
const readTransferData = (): TransferData => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (error) {
    console.error("Error reading transfer data from localStorage:", error);
  }
  return DEFAULT_TRANSFER_DATA;
};

// Helper function to write transfer data to localStorage
const writeTransferData = (data: TransferData): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error("Error writing transfer data to localStorage:", error);
  }
};

// define chainHexMap inside the effect
const chainHexMap: Record<number, string> = {
  1: "0x1", // Ethereum Mainnet
  56: "0x38", // BSC Mainnet
  97: "0x61", // BSC Testnet
  11155111: "0xaa36a7", // Sepolia
};

const DEFAULT_METRICS = Array(24).fill(0n) as bigint[];

const PlatformStats = () => {
  const networkInfo = useNetworkEnvironment();
  const base = useApiClient();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  // State
  const [currentETHPrice, setCurrentETHPrice] = useState<number>(0);
  const [safuHolders, setSafuHolders] = useState<number>(0);
  // getMetrics returns 24 values in v3/v4 — create a safe default

  const [combinedMetrics, setCombinedMetrics] =
    useState<bigint[]>(DEFAULT_METRICS);
  const [uniqueTraderCount, setUniqueTraderCount] = useState<bigint>(0n);
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bnbTransferredToGiggle, setBnbTransferredToGiggle] =
    useState<number>(0);
  const [lastProcessedBlock, setLastProcessedBlock] = useState<number>(0);

  console.log(lastProcessedBlock);

  // helper: safe bigint / BigNumber -> number conversion
  const bnToNumber = useCallback((v: any): number => {
    if (v === null || v === undefined) return 0;
    try {
      if (typeof v === "number") return v;
      if (typeof v === "bigint") return Number(v);
      if (typeof v === "string") return Number(v);
      if (typeof v?.toString === "function") return Number(v.toString());
    } catch {
      // fallback
    }
    return 0;
  }, []);

  // ---------- METRICS ----------
  useEffect(() => {
    let cancelled = false;
    const fetchMetrics = async () => {
      if (!networkInfo?.chainId) return;
      try {
        const [metrics, traderCount] = await Promise.all([
          getPureMetrics(networkInfo.chainId).catch(() => DEFAULT_METRICS),
          getPureUniqueTraderCount(networkInfo.chainId).catch(() => 0n),
        ]);

        if (cancelled) return;

        // ensure metrics is an array of bigints
        const safeMetrics = Array.isArray(metrics)
          ? metrics.map((m: any) =>
              typeof m === "bigint" ? m : BigInt(m ?? 0)
            )
          : DEFAULT_METRICS;

        setCombinedMetrics(safeMetrics);
        setUniqueTraderCount(
          typeof traderCount === "bigint"
            ? traderCount
            : BigInt(traderCount ?? 0)
        );
      } catch (error) {
        console.error("Error fetching metrics:", error);
        if (!cancelled) {
          setCombinedMetrics(DEFAULT_METRICS);
          setUniqueTraderCount(0n);
        }
      }
    };

    fetchMetrics();

    return () => {
      cancelled = true;
    };
  }, [networkInfo?.chainId, bnToNumber]);

  // ---------- ETH PRICE ----------
  useEffect(() => {
    let cancelled = false;
    const fetchETHPrice = async () => {
      try {
        if (
          !networkInfo?.chainId ||
          !ETH_USDT_PRICE_FEED_ADDRESSES?.[networkInfo.chainId]
        ) {
          console.warn("Chain ID or price feed address not available");
          setCurrentETHPrice(0);
          return;
        }

        const priceResult = await getPureGetLatestETHPrice(
          networkInfo.chainId,
          ETH_USDT_PRICE_FEED_ADDRESSES[networkInfo.chainId]
        ).catch(() => null);

        if (cancelled) return;

        // priceResult may be 0n, bigint, string, number
        const priceRaw = priceResult ?? 0;
        const priceNum = bnToNumber(priceRaw) / 1e8;
        setCurrentETHPrice(Number.isFinite(priceNum) ? priceNum : 0);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
        if (!cancelled) setCurrentETHPrice(0);
      }
    };

    fetchETHPrice();
    return () => {
      cancelled = true;
    };
  }, [networkInfo?.chainId, bnToNumber]);

  // ---------- SAFU HOLDERS (Moralis) ----------
  const startMoralisIfNeeded = useCallback(async () => {
    try {
      const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
      if (!apiKey) {
        console.warn("VITE_MORALIS_API_KEY not set - Moralis calls will fail");
        return;
      }

      if ((Moralis as any)?.Core && !(Moralis as any).Core.isStarted) {
        await Moralis.start({ apiKey });
      } else if (!(Moralis as any).Core && !(Moralis as any).started) {
        await Moralis.start?.({ apiKey });
      }
    } catch (e) {
      console.warn("Moralis start failed:", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSafuHolders = async () => {
      try {
        await startMoralisIfNeeded();

        if (!networkInfo?.chainId) {
          setSafuHolders(0);
          return;
        }

        const chainParam =
          chainHexMap[networkInfo.chainId] ??
          `0x${networkInfo.chainId.toString(16)}`;

        if (!/^0x[0-9a-fA-F]+$/.test(chainParam)) {
          console.warn("Invalid chainParam for Moralis:", chainParam);
          setSafuHolders(0);
          return;
        }

        const safuAddress =
          SAFU_TOKEN_ADDRESSES[networkInfo.chainId] ??
          SAFU_TOKEN_ADDRESSES[1] ??
          SAFU_TOKEN_ADDRESSES[56] ??
          SAFU_TOKEN_ADDRESSES[11155111];

        if (!safuAddress) {
          console.warn("No SAFU token address for chain:", networkInfo.chainId);
          setSafuHolders(0);
          return;
        }

        // Read previous transfer data from localStorage
        const previousData = readTransferData();
        setBnbTransferredToGiggle(previousData.totalBNBTransferred);
        setLastProcessedBlock(previousData.lastBlockNumber);

        const params: any = {
          chain: chainHexMap[56], // Using BSC mainnet for the launcher
          address: SAFU_LAUNCHER_ADDRESSES_V3[56],
          order: "DESC", // Get newest first to find the latest block quickly
        };

        // Only add from_block if we have a previous block to avoid fetching old data
        if (previousData.lastBlockNumber > 0) {
          params.from_block = previousData.lastBlockNumber + 1; // Start from next block
        }

        const res2 = await Moralis.EvmApi.wallets.getWalletHistory(params);
        const raw2 = res2.raw?.() ?? res2;
        console.log("res2 for getWalletHistory", raw2);

        let totalBNB = previousData.totalBNBTransferred;
        let highestBlock = previousData.lastBlockNumber;

        if (raw2.result && Array.isArray(raw2.result)) {
          for (const transaction of raw2.result) {
            // Update highest block if this transaction is newer
            const blockNum = parseInt(transaction.block_number);
            if (blockNum > highestBlock) {
              highestBlock = blockNum;
            }

            // Only process transactions that are newer than our last processed block
            if (blockNum > previousData.lastBlockNumber) {
              // Check if this transaction has native transfers
              if (
                transaction.native_transfers &&
                Array.isArray(transaction.native_transfers)
              ) {
                for (const transfer of transaction.native_transfers) {
                  // Check if transfer is from SAFU_LAUNCHER to GIGGLE_ACADEMY_WALLET
                  if (
                    transfer.from_address?.toLowerCase() ===
                      SAFU_LAUNCHER_ADDRESSES_V3[56]?.toLowerCase() &&
                    transfer.to_address?.toLowerCase() ===
                      GIGGLE_ACADEMY_WALLET.toLowerCase()
                  ) {
                    // Convert value from wei to BNB and add to total
                    const valueInWei = parseFloat(transfer.value) || 0;
                    const valueInBNB = valueInWei / 1e18;
                    totalBNB += valueInBNB;

                    console.log(
                      `Found transfer: ${valueInBNB} BNB from ${transfer.from_address} to ${transfer.to_address} at block ${blockNum}`
                    );
                  }
                }
              }
            }
          }

          // Update state and save to localStorage
          if (highestBlock > previousData.lastBlockNumber) {
            const newData: TransferData = {
              totalBNBTransferred: totalBNB,
              lastBlockNumber: highestBlock,
              lastFetchTimestamp: Date.now(),
            };

            setBnbTransferredToGiggle(totalBNB);
            setLastProcessedBlock(highestBlock);
            writeTransferData(newData);

            console.log(
              `Updated BNB transfers: ${totalBNB} BNB total, last block: ${highestBlock}`
            );
          }
        }

        const response = await Moralis.EvmApi.token.getTokenOwners({
          chain: chainParam,
          tokenAddress: safuAddress,
          order: "DESC",
        });

        if (cancelled) return;

        const raw = response.raw?.() ?? response;
        const owners = Array.isArray(raw?.result)
          ? raw.result
          : raw?.result ?? [];
        setSafuHolders(owners.length);
      } catch (err) {
        console.error("Error fetching SAFU holders:", err);
        if (!cancelled) setSafuHolders(0);
      }
    };

    fetchSafuHolders();

    return () => {
      cancelled = true;
    };
  }, [networkInfo?.chainId, startMoralisIfNeeded]);

  // ---------- TOKEN LIST ----------
  useEffect(() => {
    let cancelled = false;
    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        const response = await base.get("token-all");
        if (cancelled) return;

        const data = response?.data?.data;
        let flattenedTokens: TokenMetadata[] = [];

        if (Array.isArray(data)) {
          // some endpoints return nested arrays
          flattenedTokens = data.flat();
        } else if (data && typeof data === "object") {
          flattenedTokens = [data];
        }

        setTotalTokenCount(flattenedTokens.length);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        if (!cancelled) setTotalTokenCount(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchTokens();
    return () => {
      cancelled = true;
    };
  }, [base]);

  // Derived values
  const averageBondingProgress = useMemo(() => {
    // metrics[3] corresponds to tokens listed in your combined metrics logic
    const denom = totalTokenCount > 0 ? totalTokenCount : 1;
    const metricVal = combinedMetrics?.[3] ?? 0n;
    return (bnToNumber(metricVal) / denom) * 100;
  }, [combinedMetrics, totalTokenCount, bnToNumber]);

  const averageVolume = useMemo(() => {
    const denom = totalTokenCount > 0 ? totalTokenCount : 1;
    return bnToNumber(combinedMetrics?.[0] ?? 0n) / 1e18 / denom;
  }, [combinedMetrics, totalTokenCount, bnToNumber]);

  // Helper display functions
  const getMainValue = useCallback(
    (ethValue: number, fallbackValue: string) => {
      if (!currentETHPrice) return fallbackValue;
      const usdValue = ethValue * currentETHPrice;
      return `$${usdValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currentETHPrice]
  );

  const getETHDisplay = useCallback(
    (ethValue: number) => {
      if (!currentETHPrice) return "";
      return `(${ethValue.toFixed(2)} ETH)`;
    },
    [currentETHPrice]
  );

  // build stats arrays
  const stats1 = useMemo(() => {
    const metrics =
      combinedMetrics.length > 0 ? combinedMetrics : DEFAULT_METRICS;
    return [
      {
        id: 1,
        title: "Total Volume",
        mainValue: getMainValue(
          bnToNumber(metrics[0]) / 1e18,
          `${(bnToNumber(metrics[0]) / 1e18).toFixed(8)} ETH`
        ),
        icon: VolumeIcon,
      },
      {
        id: 2,
        title: "Average Volume (Per Token)",
        mainValue: getMainValue(averageVolume, averageVolume.toFixed(2)),
        ethValue: "",
        icon: AverageVolume,
      },
      {
        id: 3,
        title: "Revenue Generated",
        mainValue: getMainValue(
          bnToNumber(metrics[1]) / 1e18,
          `${(bnToNumber(metrics[1]) / 1e18).toFixed(8)} ETH`
        ),
        icon: FeeCollected,
      },
      {
        id: 4,
        title: "Tokens Deployed",
        mainValue: `${bnToNumber(metrics[2]) || 0}`,
        ethValue: "",
        icon: TokensLaunched,
      },
      {
        id: 5,
        title: "Graduated Tokens",
        mainValue: `${bnToNumber(metrics[3]) || 0}`,
        ethValue: "",
        icon: TokensListed,
      },
    ];
  }, [getMainValue, averageVolume, combinedMetrics, bnToNumber]);

  const stats2 = useMemo(() => {
    const metrics =
      combinedMetrics.length > 0 ? combinedMetrics : DEFAULT_METRICS;
    const devReward = bnToNumber(metrics[6]) / 1e18;
    const metric8 = bnToNumber(metrics[8] ?? 0n);
    return [
      {
        id: 1,
        title: "Average Bonding",
        mainValue: `${
          isNaN(averageBondingProgress) ? 0 : averageBondingProgress.toFixed(2)
        }%`,
        ethValue: "",
        icon: AverageBonding,
      },
      {
        id: 2,
        title: "Tax Tokens",
        mainValue: `${bnToNumber(metrics[4]) || 0}`,
        ethValue: "",
        icon: TaxTokens,
      },
      {
        id: 3,
        title: "0% Tax Tokens",
        mainValue: `${bnToNumber(metrics[5]) || 0}`,
        ethValue: "",
        icon: ZeroTaxTokens,
      },
      {
        id: 4,
        title: "SAFU Holders",
        mainValue: safuHolders.toString(),
        ethValue: "",
        icon: SafuHolders,
      },
      {
        id: 5,
        title: "Paid Out Dev Reward",
        mainValue: getMainValue(devReward, `${devReward.toFixed(2)} ETH`),
        ethValue: getETHDisplay(devReward),
        icon: Reward,
      },
      {
        id: 6,
        title: "Total Unique Traders",
        mainValue: (bnToNumber(uniqueTraderCount) + metric8).toString(),
        ethValue: "",
        icon: UniqueWallet,
      },
      {
        id: 7,
        title: "BNB to Giggle Academy",
        mainValue: "", // hide main value
        ethValue: `${bnbTransferredToGiggle.toFixed(6)} BNB`, // show only BNB here
        icon: Donate,
      },
    ];
  }, [
    combinedMetrics,
    bnToNumber,
    averageBondingProgress,
    safuHolders,
    getMainValue,
    getETHDisplay,
    uniqueTraderCount,
    bnbTransferredToGiggle,
  ]);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          toggleActions: "play reverse play reverse",
        },
      });

      tl.from(
        headlineRef.current,
        {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: "power2.out",
        },
        "+=0.1"
      ).from(cardRefs.current, {
        opacity: 0,
        y: 50,
        stagger: 0.2,
        duration: 0.6,
        ease: "power2.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Counter animations
  useEffect(() => {
    if (isLoading) return; // Don't animate until data is loaded

    const allStats = [...stats1, ...stats2];

    allStats.forEach((stat, index) => {
      const el = document.getElementById(`main-value-${index}`);
      if (!el) return;

      const raw = String(stat.mainValue);
      const clean = parseFloat(raw.replace(/[^0-9.]/g, ""));
      const isCurrency = raw.includes("$");
      const isETH = raw.includes("ETH");
      const isPercent = raw.includes("%");

      gsap.fromTo(
        el,
        { innerText: 0 },
        {
          innerText: clean,
          duration: 2,
          ease: "power3.out",
          snap: { innerText: isPercent ? 0.1 : 1 },
          onUpdate: function () {
            const val = parseFloat(String(el.innerText || "0")) || 0;
            if (isCurrency) {
              el.innerText = `$${val.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            } else if (isETH) {
              el.innerText = `${val.toFixed(4)} ETH`;
            } else if (isPercent) {
              el.innerText = `${val.toFixed(1)}%`;
            } else {
              el.innerText = `${Math.floor(val)}`;
            }
          },
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: false,
          },
        }
      );
    });
  }, [stats1, stats2, isLoading]);

  return (
    <section
      className="xl:px-[80px] lg:pb-20 lg:pt-24 relative z-20 px-4"
      id="stats"
      ref={containerRef}
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <div className="dark:hidden block">
        <img
          src={cloudRight}
          alt="This is the cloud on the right"
          className="absolute -top-[7rem] md:-top-[15rem] -right-[1rem] -z-[100px]"
        />
      </div>

      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute bottom-[100px] right-0 blur-3xl hidden dark:block"></div>

      <h1
        ref={headlineRef}
        className="text-[1.5rem] lg:text-[2rem] font-bold dark:text-[#ECF1F0] text-black mb-[45px] text-center lg:text-left"
      >
        Platform Stats
      </h1>

      <div className="flex flex-col lg:grid lg:grid-cols-[.3fr_.7fr] gap-4">
        <div className="grid grid-cols-2 xl:gap-4 gap-4 md:gap-2">
          <div className="bg-[#0c8be011] p-[20px] rounded-[10px] grid grid-cols-1 gap-4">
            {stats1.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) cardRefs.current[index] = el;
                  }}
                  className="dark:bg-[#9747FF]/5 bg-[#064C7A]/10 px-2.5 py-8 rounded-xl flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 mb-4">
                    <Icon className="w-full h-full" />
                  </div>
                  <div
                    id={`main-value-${index}`}
                    className="main-value xl:text-lg text-base font-semibold dark:text-white text-black mb-2"
                  >
                    {isLoading ? "Loading..." : stat.mainValue}
                  </div>
                  <div className="text-sm dark:text-white/70 text-[#141313] leading-tight mb-2">
                    {stat.title}
                  </div>
                  {stat.ethValue && (
                    <div className="text-sm dark:text-white/60 text-black/60 font-medium">
                      {stat.ethValue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-[#0c8be011] p-[20px] rounded-[20px] grid grid-cols-1 gap-4">
            {stats2.map((stat, index) => {
              const Icon = stat.icon;
              const idx = stats1.length + index;
              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) cardRefs.current[idx] = el;
                  }}
                  className="dark:bg-[#9747FF]/5 bg-[#064C7A]/10 px-2.5 py-8 rounded-xl flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 mb-4 relative">
                    <Icon className="w-full h-full" />
                    {stat.id === 3 && (
                      <p className="text-white/50 font-bold text-[22px] absolute bottom-6 left-[10px] dark:hidden block">
                        TAX
                      </p>
                    )}
                  </div>
                  {/* Main value */}
                  {stat.mainValue && (
                    <div className="text-lg font-semibold dark:text-white text-black mb-2">
                      <span className="main-value" id={`main-value-${index}`}>
                        {isLoading ? "Loading..." : stat.mainValue}
                      </span>
                    </div>
                  )}

                  <div className="text-sm dark:text-white/70 text-[#141313] leading-tight mb-2">
                    {stat.title}
                  </div>
                  {stat.ethValue && (
                    <div className="text-sm dark:text-white/60 text-black/60 font-medium">
                      {stat.ethValue}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <TrendingTokens />
          <NotableBuys />
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;
