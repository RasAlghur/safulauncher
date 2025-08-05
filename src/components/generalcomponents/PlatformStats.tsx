// LlaunchIntro/PlatformStats.tsx
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
import DustParticles from "./DustParticles";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";
import {
  ETH_USDT_PRICE_FEED_ADDRESSES,
  SAFU_TOKEN_ADDRESSES,
} from "../../web3/config";
import {
  getPureMetrics,
  getPureGetLatestETHPrice,
  getPureUniqueTraderCount,
} from "../../web3/readContracts";
import cloudRight from "../../assets/cloud-right.png";
import { base } from "../../lib/api";
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

const PlatformStats = () => {
  const networkInfo = useNetworkEnvironment();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  // State variables
  const [currentETHPrice, setCurrentETHPrice] = useState<number>(0);
  const [safuHolders, setSafuHolders] = useState<number>(0);
  const [combinedMetrics, setCombinedMetrics] = useState<bigint[]>([]);
  const [uniqueTraderCount, setUniqueTraderCount] = useState<bigint>(0n);
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch combined metrics from contracts
  useEffect(() => {
    async function fetchMetrics() {
      try {
        if (!networkInfo?.chainId) return;

        const [metrics, traderCount] = await Promise.all([
          getPureMetrics(networkInfo.chainId),
          getPureUniqueTraderCount(networkInfo.chainId),
        ]);

        setCombinedMetrics(metrics);
        setUniqueTraderCount(traderCount);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        // Set default values if fetch fails
        setCombinedMetrics([0n, 0n, 0n, 0n, 0n, 0n, 0n]);
        setUniqueTraderCount(0n);
      }
    }

    fetchMetrics();
  }, [networkInfo?.chainId]);

  // Fetch ETH price
  useEffect(() => {
    async function fetchETHPrice() {
      try {
        if (
          !networkInfo?.chainId ||
          !ETH_USDT_PRICE_FEED_ADDRESSES?.[networkInfo.chainId]
        ) {
          console.warn("Chain ID or price feed address not available");
          return;
        }

        const priceResult = await getPureGetLatestETHPrice(
          networkInfo.chainId,
          ETH_USDT_PRICE_FEED_ADDRESSES[networkInfo.chainId]
        );

        const price =
          (typeof priceResult === "number"
            ? priceResult
            : Number(priceResult)) / 1e8;
        setCurrentETHPrice(price);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
        // You might want to set a fallback price or fetch from an alternative source
        setCurrentETHPrice(0);
      }
    }

    fetchETHPrice();
  }, [networkInfo?.chainId]);

  // Fetch SAFU holders
  useEffect(() => {
    async function fetchSafuHolders() {
      try {
        if (!Moralis.Core.isStarted) {
          await Moralis.start({ apiKey: import.meta.env.VITE_MORALIS_API_KEY });
        }

        const response = await Moralis.EvmApi.token.getTokenOwners({
          chain: networkInfo.chainId === 1 ? "0x1" : "0xaa36a7", // Sepolia
          order: "DESC",
          tokenAddress:
            networkInfo.chainId === 1
              ? SAFU_TOKEN_ADDRESSES[1]
              : SAFU_TOKEN_ADDRESSES[11155111],
        });

        const holdersCount = response.raw().result.length;
        setSafuHolders(holdersCount);
      } catch (err) {
        console.error("Error fetching SAFU holders:", err);
        setSafuHolders(0);
      }
    }

    fetchSafuHolders();
  }, [networkInfo.chainId]);

  // Fetch token list
  useEffect(() => {
    async function fetchTokens() {
      try {
        const response = await base.get("token-all");
        const data = response.data.data;

        let flattenedTokens: TokenMetadata[] = [];

        if (Array.isArray(data)) {
          flattenedTokens = data.flat();
        } else if (data && typeof data === "object") {
          flattenedTokens = [data];
        }

        setTotalTokenCount(flattenedTokens.length);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setTotalTokenCount(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokens();
  }, []);

  // Calculate derived values
  const averageBondingProgress = useMemo(() => {
    return totalTokenCount > 0 && combinedMetrics.length > 3
      ? (Number(combinedMetrics[3]) / totalTokenCount) * 100
      : 0;
  }, [combinedMetrics, totalTokenCount]);

  const averageVolume = useMemo(() => {
    return totalTokenCount > 0 && combinedMetrics.length > 0
      ? Number(combinedMetrics[0]) / 1e18 / totalTokenCount
      : 0;
  }, [combinedMetrics, totalTokenCount]);

  // Helper functions
  const getMainValue = useCallback(
    (ethValue: number, fallbackValue: string) => {
      if (currentETHPrice === 0) return fallbackValue;
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
      if (currentETHPrice === 0) return "";
      return `(${ethValue.toFixed(2)} ETH)`;
    },
    [currentETHPrice]
  );

  // Stats configurations
  const stats1 = useMemo(() => {
    const metrics =
      combinedMetrics.length > 0
        ? combinedMetrics
        : [0n, 0n, 0n, 0n, 0n, 0n, 0n];

    return [
      {
        id: 1,
        title: "Total Volume",
        mainValue: getMainValue(
          Number(metrics[0]) / 1e18,
          `${(Number(metrics[0]) / 1e18).toFixed(8)} ETH`
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
        title: "Fees Collected",
        mainValue: getMainValue(
          Number(metrics[1]) / 1e18,
          `${(Number(metrics[1]) / 1e18).toFixed(8)} ETH`
        ),
        icon: FeeCollected,
      },
      {
        id: 4,
        title: "Tokens Deployed",
        mainValue: `${metrics[2]?.toString() || 0}`,
        ethValue: "",
        icon: TokensLaunched,
      },
      {
        id: 5,
        title: "Graduated Tokens",
        mainValue: `${metrics[3]?.toString() || 0}`,
        ethValue: "",
        icon: TokensListed,
      },
    ];
  }, [getMainValue, averageVolume, combinedMetrics]);

  const stats2 = useMemo(() => {
    const metrics =
      combinedMetrics.length > 0
        ? combinedMetrics
        : [0n, 0n, 0n, 0n, 0n, 0n, 0n];
    const devReward = Number(metrics[6]) / 1e18;

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
        mainValue: `${metrics[4]?.toString() || 0}`,
        ethValue: "",
        icon: TaxTokens,
      },
      {
        id: 3,
        title: "0% Tax Tokens",
        mainValue: `${metrics[5]?.toString() || 0}`,
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
        mainValue: uniqueTraderCount.toString(),
        ethValue: "",
        icon: UniqueWallet,
      },
    ];
  }, [
    averageBondingProgress,
    getMainValue,
    getETHDisplay,
    combinedMetrics,
    safuHolders,
    uniqueTraderCount,
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

      const raw = stat.mainValue;
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
            const val = parseFloat(el.innerText);
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
              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) cardRefs.current[stats1.length + index] = el;
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
                  <div
                    id={`main-value-${stats1.length + index}`}
                    className="xl:text-lg text-base font-semibold dark:text-white text-black mb-2"
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
