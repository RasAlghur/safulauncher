import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TrendingTokens from "./TrendingTokens";
import NotableBuys from "./NotableBuys";
import VolumeIcon from "../svgcomponents/Volume";
import FeeCollected from "../svgcomponents/FeeCollected";
import TokensLaunched from "../svgcomponents/TokensLaunched";
import TokensListed from "../svgcomponents/TokensListed";
import AverageBonding from "../svgcomponents/AverageBonding";
import TaxTokens from "../svgcomponents/TaxTokens";
import ZeroTaxTokens from "../svgcomponents/ZeroTaxTokens";
import SafuHolders from "../svgcomponents/SafuHolders";
import DustParticles from "./DustParticles";
import { ETH_USDT_PRICE_FEED } from "../../web3/config";
import { pureGetLatestETHPrice, pureMetrics, pureInfoDataRaw } from "../../web3/readContracts";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const [currentETHPrice, setCurrentETHPrice] = useState<number>(0);

  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  // Add new state for aggregated data
  const [totalCurveProgress, setTotalCurveProgress] = useState<number>(0);
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0);

  const API = import.meta.env.VITE_API_BASE_URL;


  // Fetch list of tokens
  useEffect(() => {
    fetch(`${API}/api/token`)
      .then((res) => res.json())
      .then((data: TokenMetadata[]) => {
        setTokens(data);
        setTotalTokenCount(data.length); // Set total token count
      })
      .catch(console.error);
  }, []);

  // Fetch on-chain and API data for each token when list updates
  useEffect(() => {
    if (tokens.length === 0) return;

    async function fetchTokenMetrics() {
      const newCurve: Record<string, number> = {};

      await Promise.all(
        tokens.map(async (token) => {
          try {
            // Fetch bonding curve data
            const info = await pureInfoDataRaw(token.tokenAddress);
            if (Array.isArray(info)) {
              const supply = Number(info[7]);
              const sold = Number(info[10]);
              const percent = (sold / (0.75 * supply)) * 100;
              newCurve[token.tokenAddress] = Math.min(
                Math.max(percent, 0),
                100
              );
            }
          } catch (e) {
            console.error(`Error for ${token.tokenAddress}:`, e);
          }
        })
      );

      // Calculate total curve progress
      const totalProgress = Object.values(newCurve).reduce((sum, progress) => sum + progress, 0);
      setTotalCurveProgress(totalProgress);
    }

    fetchTokenMetrics();
  }, [tokens]);

  // Calculate average curve progress
  const averageCurveProgress = totalTokenCount > 0 ? totalCurveProgress / totalTokenCount : 0;



  // Fetch ETH price if not provided
  useEffect(() => {
    async function fetchETHPrice() {
      try {
        const raw = await pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!);
        const price = (typeof raw === "number" ? raw : Number(raw)) / 1e8;
        setCurrentETHPrice(price);
      } catch (error) {
        console.error("Failed to fetch ETH price:", error);
      }
    }
    fetchETHPrice();
  }, []);

  // Helper function to get USD value as main display
  const getMainValue = (ethValue: number, fallbackValue: string) => {
    if (currentETHPrice === 0) return fallbackValue;
    const usdValue = ethValue * currentETHPrice;
    return `$${usdValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper function to get ETH value for display
  const getETHDisplay = (ethValue: number) => {
    if (currentETHPrice === 0) return "";
    return `(${ethValue.toFixed(4)} ETH)`;
  };

  const stats1 = [
    {
      id: 1,
      title: "Total Volume",
      mainValue: getMainValue(
        pureMetrics[0] !== undefined ? Number(pureMetrics[0]) / 1e18 : 0,
        `${pureMetrics[0] !== undefined
          ? (Number(pureMetrics[0]) / 1e18).toFixed(8)
          : 0
        } ETH`
      ),
      ethValue: getETHDisplay(
        pureMetrics[0] !== undefined ? Number(pureMetrics[0]) / 1e18 : 0
      ),
      icon: VolumeIcon,
    },
    {
      id: 2,
      title: "Fee Collected",
      mainValue: getMainValue(
        pureMetrics[1] !== undefined ? Number(pureMetrics[1]) / 1e18 : 0,
        `${pureMetrics[1] !== undefined
          ? (Number(pureMetrics[1]) / 1e18).toFixed(8)
          : 0
        } ETH`
      ),
      ethValue: getETHDisplay(
        pureMetrics[1] !== undefined ? Number(pureMetrics[1]) / 1e18 : 0
      ),
      icon: FeeCollected,
    },
    {
      id: 3,
      title: "Tokens Launched",
      mainValue: `${pureMetrics?.[2] || 0}`,
      ethValue: "",
      icon: TokensLaunched,
    },
    {
      id: 4,
      title: "Tokens Listed",
      mainValue: `${pureMetrics?.[3] || 0}`,
      ethValue: "",
      icon: TokensListed,
    },
  ];

  const stats2 = [
    {
      id: 1,
      title: "Avg. Bonding",
      mainValue: `${averageCurveProgress.toFixed(2) || 0}%`, // This doesn't seem to have a corresponding pureMetrics value
      ethValue: "",
      icon: AverageBonding,
    },
    {
      id: 2,
      title: "Tax Tokens",
      mainValue: `${pureMetrics?.[4] || 0}`,
      ethValue: "",
      icon: TaxTokens,
    },
    {
      id: 3,
      title: "0% - Tax Token",
      mainValue: `${pureMetrics?.[5] || 0}`,
      ethValue: "",
      icon: ZeroTaxTokens,
    },
    {
      id: 4,
      mainValue: "234", // This doesn't seem to have a corresponding pureMetrics value
      ethValue: "",
      icon: SafuHolders,
    },
  ];

  const stats3 = [
    {
      id: 1,
      title: "Dev Reward",
      mainValue: getMainValue(
        pureMetrics[6] !== undefined ? Number(pureMetrics[6]) / 1e18 : 0,
        `${pureMetrics[6] !== undefined
          ? (Number(pureMetrics[6]) / 1e18).toFixed(4)
          : 0
        } ETH`
      ),
      ethValue: getETHDisplay(
        pureMetrics[6] !== undefined ? Number(pureMetrics[6]) / 1e18 : 0
      ),
      icon: SafuHolders,
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      });

      tl.from(cardRefs.current, {
        opacity: 0,
        y: 50,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out",
      }).from(
        headlineRef.current,
        {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "power2.out",
        },
        "+=0.1"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="lg:px-[80px] lg:pb-20 lg:pt-24 relative z-20 px-4"
      id="stats"
      ref={containerRef}
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute bottom-[100px] right-0 blur-3xl hidden dark:block"></div>
      <h1
        ref={headlineRef}
        className="text-[1.5rem] lg:text-[2rem] font-bold dark:text-[#ECF1F0] text-black mb-[45px] text-center lg:text-left"
      >
        Platform Stats
      </h1>
      <div className="flex flex-col lg:grid lg:grid-cols-[.3fr_.7fr] gap-4">
        <div className="grid grid-cols-2 gap-4">
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
                  {/* Main value (USD for ETH values, original for others) */}
                  <div className="text-lg font-semibold dark:text-white text-black mb-2">
                    {stat.mainValue}
                  </div>
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
          <div className="bg-[#0c8be011] p-[20px] rounded-[20px] grid grid-cols-1 gap-4">
            {stats2.map((stat, index) => {
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
                  {/* Main value (USD for ETH values, original for others) */}
                  <div className="text-lg font-semibold dark:text-white text-black mb-2">
                    {stat.mainValue}
                  </div>
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

          <div className="bg-[#0c8be011] p-[20px] rounded-[20px] grid grid-cols-1 gap-4">
            {stats3.map((stat, index) => {
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
                  {/* Main value (USD for ETH values, original for others) */}
                  <div className="text-lg font-semibold dark:text-white text-black mb-2">
                    {stat.mainValue}
                  </div>
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
        <div>
          <TrendingTokens />
          <NotableBuys />
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;
