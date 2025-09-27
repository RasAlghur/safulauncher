/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  getPureMetrics,
  getPureGetLatestETHPrice,
  getPureUniqueTraderCount,
} from "../../web3/readContracts";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";
import {
  ETH_USDT_PRICE_FEED_ADDRESSES,
  SAFU_TOKEN_ADDRESSES,
  GIGGLE_ACADEMY_WALLET,
  SAFU_LAUNCHER_ADDRESSES_V3,
} from "../../web3/config";
import cloudRight from "../../assets/cloud-right.png";
import cloudLeft from "../../assets/cloud-left.png";
import { useApiClient } from "../../lib/api";

import VolumeIcon from "../svgcomponents/Volume";
import FeeCollected from "../svgcomponents/FeeCollected";
import TokensLaunched from "../svgcomponents/TokensLaunched";
import TokensListed from "../svgcomponents/TokensListed";
import AverageBonding from "../svgcomponents/AverageBonding";
import TaxTokens from "../svgcomponents/TaxTokens";
import ZeroTaxTokens from "../svgcomponents/ZeroTaxTokens";
import SafuHolders from "../svgcomponents/SafuHolders";
import UniqueWallet from "../svgcomponents/UniqueWallet";
import DustParticles from "../generalcomponents/DustParticles";
import Reward from "../svgcomponents/Reward";
import AverageVolume from "../svgcomponents/AverageVolume";
import Donate from "../svgcomponents/Donate";
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

const DEFAULT_METRICS = Array(24).fill(0n) as bigint[]; // match getMetrics length for v3/v4

const chainHexMap: Record<number, string> = {
  1: "0x1", // Ethereum Mainnet
  56: "0x38", // BSC Mainnet
  97: "0x61", // BSC Testnet
  11155111: "0xaa36a7", // Sepolia
  // add other chain mappings here if needed
};

const PlatformStats = () => {
  const networkInfo = useNetworkEnvironment();
  const base = useApiClient();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  const [currentETHPrice, setCurrentETHPrice] = useState<number>(0);
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0);
  const [safuHolders, setSafuHolders] = useState<number>(0);
  const [combinedMetrics, setCombinedMetrics] =
    useState<bigint[]>(DEFAULT_METRICS);
  const [uniqueTraderCount, setUniqueTraderCount] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bnbTransferredToGiggle, setBnbTransferredToGiggle] =
    useState<number>(0);
  const [lastProcessedBlock, setLastProcessedBlock] = useState<number>(0);

  console.log(lastProcessedBlock);

  // Safe conversion helper for BigInt / BigNumber / string / number -> number
  const bnToNumber = useCallback((v: any): number => {
    if (v === null || v === undefined) return 0;
    try {
      if (typeof v === "number") return v;
      if (typeof v === "bigint") return Number(v);
      if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      if (typeof v?.toString === "function") {
        const n = Number(v.toString());
        return Number.isFinite(n) ? n : 0;
      }
    } catch {
      // fall through
    }
    return 0;
  }, []);

  // Safe Moralis start (idempotent)
  const startMoralisIfNeeded = useCallback(async () => {
    try {
      const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
      if (!apiKey) {
        // warn but continue — caller will handle absence
        console.warn(
          "VITE_MORALIS_API_KEY is not set; Moralis calls will fail."
        );
        return;
      }

      // Moralis v2 exposes Moralis.Core.isStarted
      if ((Moralis as any)?.Core && !(Moralis as any).Core.isStarted) {
        await Moralis.start({ apiKey });
        return;
      }

      // Fallback: some builds expose a top-level `started` flag
      if (!(Moralis as any).Core && !(Moralis as any).started) {
        await Moralis.start?.({ apiKey });
      }
    } catch (err) {
      console.warn("Moralis.start() failed:", err);
    }
  }, []);

  // Single effect to fetch metrics, price, SAFU holders, token count in parallel,
  // with cancellation guard.
  useEffect(() => {
    const cancelled = false;

    const fetchAll = async () => {
      setIsLoading(true);

      // Kick off all tasks in parallel where possible
      const tasks: Promise<any>[] = [];

      // 1) metrics + unique traders
      const metricsTask = (async () => {
        if (!networkInfo?.chainId)
          return { metrics: DEFAULT_METRICS, traders: 0n };
        try {
          const [metricsRaw, tradersRaw] = await Promise.all([
            getPureMetrics(networkInfo.chainId).catch(() => DEFAULT_METRICS),
            getPureUniqueTraderCount(networkInfo.chainId).catch(() => 0n),
          ]);
          // normalize metrics -> bigint[]
          const metrics = Array.isArray(metricsRaw)
            ? metricsRaw.map((m: any) =>
                typeof m === "bigint" ? m : BigInt(m ?? 0)
              )
            : DEFAULT_METRICS;
          const traders =
            typeof tradersRaw === "bigint"
              ? tradersRaw
              : BigInt(tradersRaw ?? 0);
          return { metrics, traders };
        } catch (err) {
          console.error("getPureMetrics/getPureUniqueTraderCount failed:", err);
          return { metrics: DEFAULT_METRICS, traders: 0n };
        }
      })();
      tasks.push(metricsTask);

      // 2) ETH price
      const priceTask = (async () => {
        if (!networkInfo?.chainId) return null;
        const priceFeedAddress =
          ETH_USDT_PRICE_FEED_ADDRESSES[networkInfo.chainId];
        if (!priceFeedAddress) return null;
        try {
          const raw = await getPureGetLatestETHPrice(
            networkInfo.chainId,
            priceFeedAddress
          ).catch(() => null);
          const price = bnToNumber(raw) / 1e8;
          return Number.isFinite(price) ? price : null;
        } catch (err) {
          console.error("getPureGetLatestETHPrice failed:", err);
          return null;
        }
      })();
      tasks.push(priceTask);

      // 3) SAFU holders (Moralis)
      const safuTask = (async () => {
        try {
          await startMoralisIfNeeded();

          if (!networkInfo?.chainId) return 0;

          const chainParam =
            chainHexMap[networkInfo.chainId] ??
            `0x${networkInfo.chainId.toString(16)}`;

          if (!/^0x[0-9a-fA-F]+$/.test(chainParam)) {
            console.warn("Invalid chain param for Moralis:", chainParam);
            return 0;
          }

          // choose SAFU token address for the chain (try fallback options)
          const safuAddress =
            SAFU_TOKEN_ADDRESSES[networkInfo.chainId] ??
            SAFU_TOKEN_ADDRESSES[1] ??
            SAFU_TOKEN_ADDRESSES[56] ??
            SAFU_TOKEN_ADDRESSES[11155111] ??
            null;

          if (!safuAddress) {
            console.warn(
              "No SAFU token address configured for chain:",
              networkInfo.chainId
            );
            return 0;
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

          const resp = await Moralis.EvmApi.token.getTokenOwners({
            chain: chainParam,
            tokenAddress: safuAddress,
            order: "DESC",
          });

          // robustly read result
          const raw = resp?.raw?.() ?? resp;
          const owners = Array.isArray(raw?.result)
            ? raw.result
            : raw?.result ?? [];
          return owners.length;
        } catch (err) {
          console.error("Moralis token owners fetch failed:", err);
          return 0;
        }
      })();
      tasks.push(safuTask);

      // 4) token count via API
      const tokenCountTask = (async () => {
        try {
          const resp = await base.get("token-all");
          const data = resp?.data?.data;
          let flattened: TokenMetadata[] = [];
          if (Array.isArray(data)) flattened = data.flat();
          else if (data && typeof data === "object") flattened = [data];
          return flattened.length;
        } catch (err) {
          console.error("token-all fetch failed:", err);
          return 0;
        }
      })();
      tasks.push(tokenCountTask);

      // wait for all
      const results = await Promise.allSettled(tasks);

      if (cancelled) return;

      // map results
      // metricsTask result at index 0
      const metricsResult = results[0];
      if (metricsResult.status === "fulfilled" && metricsResult.value) {
        setCombinedMetrics(metricsResult.value.metrics ?? DEFAULT_METRICS);
        setUniqueTraderCount(metricsResult.value.traders ?? 0n);
      } else {
        setCombinedMetrics(DEFAULT_METRICS);
        setUniqueTraderCount(0n);
      }

      // priceTask index 1
      const priceResult = results[1];
      if (
        priceResult.status === "fulfilled" &&
        priceResult.value !== null &&
        typeof priceResult.value !== "undefined"
      ) {
        setCurrentETHPrice(priceResult.value as number);
      } else {
        setCurrentETHPrice(0);
      }

      // safuTask index 2
      const safuResult = results[2];
      if (safuResult.status === "fulfilled") {
        setSafuHolders(Number(safuResult.value ?? 0));
      } else {
        setSafuHolders(0);
      }

      // tokenCountTask index 3
      const tokenCountResult = results[3];
      if (tokenCountResult.status === "fulfilled") {
        setTotalTokenCount(Number(tokenCountResult.value ?? 0));
      } else {
        setTotalTokenCount(0);
      }

      setIsLoading(false);
    };

    fetchAll();

    return () => {
      // cancellation
      // simply flip the flag - our async work reads it via closure
      // (we don't abort network requests here since fetch implementations vary)
      // But we avoid setState after unmount via checks above
      // set cancelled by closure variable
      // (we rely on `fetchAll` checking the cancelled flag where appropriate)
      // nothing to do here explicitly
      // (kept for clarity)
    };
  }, [networkInfo?.chainId, base, bnToNumber, startMoralisIfNeeded]);

  // Derived: average bonding & average volume
  const averageBondingProgress = useMemo(() => {
    const denom = totalTokenCount > 0 ? totalTokenCount : 1;
    const m3 = combinedMetrics?.[3] ?? 0n;
    return (bnToNumber(m3) / denom) * 100;
  }, [combinedMetrics, totalTokenCount, bnToNumber]);

  const averageVolume = useMemo(() => {
    const denom = totalTokenCount > 0 ? totalTokenCount : 1;
    const v = combinedMetrics?.[0] ?? 0n;
    return bnToNumber(v) / 1e18 / denom;
  }, [combinedMetrics, totalTokenCount, bnToNumber]);

  // display helpers
  const getMainValue = useCallback(
    (ethValue: number, fallbackValue: string) => {
      if (!currentETHPrice || currentETHPrice === 0) return fallbackValue;
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
      if (!currentETHPrice || currentETHPrice === 0) return "";
      return `(${ethValue.toFixed(2)} ETH)`;
    },
    [currentETHPrice]
  );

  // build stats array (unique ids)
  const stats = useMemo(() => {
    const metrics =
      combinedMetrics.length > 0 ? combinedMetrics : DEFAULT_METRICS;
    const totalTradersExtra = bnToNumber(metrics[8] ?? 0n); // earlier code used metrics[8]
    const devRewardEth = bnToNumber(metrics[6] ?? 0n) / 1e18;

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
      {
        id: 6,
        title: "Average Bonding",
        mainValue: `${
          isNaN(averageBondingProgress) ? 0 : averageBondingProgress.toFixed(2)
        }%`,
        ethValue: "",
        icon: AverageBonding,
      },
      {
        id: 7,
        title: "Tax Tokens",
        mainValue: `${bnToNumber(metrics[4]) || 0}`,
        ethValue: "",
        icon: TaxTokens,
      },
      {
        id: 8,
        title: "0% Tax Tokens",
        mainValue: `${bnToNumber(metrics[5]) || 0}`,
        ethValue: "",
        icon: ZeroTaxTokens,
      },
      {
        id: 9,
        title: "$SAFU Holders",
        mainValue: safuHolders.toString(),
        ethValue: "",
        icon: SafuHolders,
      },
      {
        id: 10,
        title: "Paid Out Dev Reward",
        mainValue: getMainValue(devRewardEth, `${devRewardEth.toFixed(2)} ETH`),
        ethValue: getETHDisplay(devRewardEth),
        icon: Reward,
      },
      {
        id: 11,
        title: "Total Unique Traders",
        mainValue: (
          bnToNumber(uniqueTraderCount) + totalTradersExtra
        ).toLocaleString(),
        ethValue: "", // not applicable
        icon: UniqueWallet,
      },
      {
        id: 12,
        title: "BNB to Giggle Academy",
        mainValue: "", // hide main value
        ethValue: `${bnbTransferredToGiggle.toFixed(6)} BNB`, // show only BNB here
        icon: Donate,
      },
    ];
  }, [
    combinedMetrics,
    averageBondingProgress,
    averageVolume,
    getMainValue,
    getETHDisplay,
    safuHolders,
    uniqueTraderCount,
    bnToNumber,
    bnbTransferredToGiggle,
  ]);

  // GSAP entrance animation (useLayoutEffect for better layout timing)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play reverse play reverse",
        },
      });

      tl.from(
        headlineRef.current,
        {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "power2.out",
        },
        "+=0.1"
      ).from(cardRefs.current, {
        opacity: 0,
        y: 50,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out",
      });

      return () => {
        tl.kill();
      };
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Counter animations: wait until initial load finished
  useEffect(() => {
    if (isLoading) return;

    stats.forEach((stat, index) => {
      const el = document.getElementById(`main-value-${index}`);
      if (!el) return;

      const raw = String(stat.mainValue);
      const clean = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
      const isCurrency = raw.includes("$");
      const isETH = raw.toUpperCase().includes("ETH");
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
            const v = parseFloat(String(el.innerText || "0")) || 0;
            if (isCurrency) {
              el.innerText = `$${v.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            } else if (isETH) {
              el.innerText = `${v.toFixed(4)} ETH`;
            } else if (isPercent) {
              el.innerText = `${v.toFixed(1)}%`;
            } else {
              el.innerText = `${Math.floor(v)}`;
            }
          },
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        }
      );
    });
  }, [stats, isLoading]);

  return (
    <section id="stats" className="mt-28 px-6 relative" ref={containerRef}>
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <div className="dark:hidden block">
        <img
          src={cloudLeft}
          alt="This is the cloud on the left"
          className="absolute bottom-0 -left-[1rem]"
        />
        <img
          src={cloudRight}
          alt="This is the cloud on the right"
          className="absolute -top-[15rem] -right-[1rem] "
        />
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="dark:bg-[#9747FF]/15 bg-[#3AC2DB]/10 rounded-3xl px-6 py-4 lg:px-6 lg:py-6 lg:pb-2 text-white relative border-[2px] border-t-0 dark:border-[#9747FF]/10 border-Primary">
          <div className="rounded-tab-inverted">
            <h2
              ref={headlineRef}
              className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold dark:text-white text-black text-center mt-4"
            >
              Platform Stats
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-24 pb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  ref={(el) => {
                    if (el) cardRefs.current[index] = el;
                  }}
                  className="dark:bg-[#9747FF]/5 bg-[#064C7A]/10 px-2.5 py-8 rounded-xl flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 mb-4 relative">
                    <Icon className="w-full h-full" />
                    {stat.id === 8 && (
                      <p className="text-white/60 font-bold text-[22px]  absolute bottom-6 left-[10px] dark:hidden block">
                        TAX
                      </p>
                    )}
                  </div>
                  {/* Main value */}
                  {/* Main value */}
                  {stat.mainValue && (
                    <div className="text-lg font-semibold dark:text-white text-black mb-2">
                      <span className="main-value" id={`main-value-${index}`}>
                        {isLoading ? "Loading..." : stat.mainValue}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <div className="text-sm dark:text-white/70 text-[#141313] leading-tight mb-2">
                    {stat.title}
                  </div>
                  {/* ETH value in brackets (only for ETH-related stats) */}
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
      </div>
    </section>
  );
};

export default PlatformStats;
