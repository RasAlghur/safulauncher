import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  pureMetrics,
  pureGetLatestETHPrice,
  pureInfoDataRaw,
} from "../../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../../web3/config";
import cloudRight from "../../assets/cloud-right.png";
import cloudLeft from "../../assets/cloud-left.png";

import VolumeIcon from "../svgcomponents/Volume";
import FeeCollected from "../svgcomponents/FeeCollected";
import TokensLaunched from "../svgcomponents/TokensLaunched";
import TokensListed from "../svgcomponents/TokensListed";
import AverageBonding from "../svgcomponents/AverageBonding";
import TaxTokens from "../svgcomponents/TaxTokens";
import ZeroTaxTokens from "../svgcomponents/ZeroTaxTokens";
import SafuHolders from "../svgcomponents/SafuHolders";
import DustParticles from "../generalcomponents/DustParticles";
import { base } from "../../lib/api";

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

  // Fetch list of tokens
  useEffect(() => {
    (async () => {
      try {
        const response = await base.get("token-all");
        const data = response.data.data;

        console.log("Raw API response:", data);

        // Handle the nested array structure
        let flattenedTokens: TokenMetadata[] = [];

        if (Array.isArray(data)) {
          // If data is an array of arrays, flatten it
          flattenedTokens = data.flat();
        } else if (data && typeof data === "object") {
          // If data is a single object, wrap it in an array
          flattenedTokens = [data];
        }

        setTotalTokenCount(flattenedTokens.length);
        setTokens(flattenedTokens);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    })();
  }, []);

  // Fetch on-chain and API data for each token when list updates
  useEffect(() => {
    if (tokens.length === 0) {
      return;
    }

    async function fetchTokenMetrics() {
      const newCurve: Record<string, number> = {};

      const validTokens = tokens.filter((token) => token && token.tokenAddress);

      await Promise.all(
        validTokens.map(async (token) => {
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
      const totalProgress = Object.values(newCurve).reduce(
        (sum, progress) => sum + progress,
        0
      );
      setTotalCurveProgress(totalProgress);
    }

    fetchTokenMetrics();
  }, [tokens]);

  // Calculate average curve progress
  const averageCurveProgress =
    totalTokenCount > 0 ? totalCurveProgress / totalTokenCount : 0;

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

  // Create stats array with real data from pureMetrics
  const stats = [
    {
      title: "Total Volume",
      mainValue: getMainValue(
        pureMetrics[0] !== undefined ? Number(pureMetrics[0]) / 1e18 : 0,
        `${
          pureMetrics[0] !== undefined
            ? (Number(pureMetrics[0]) / 1e18).toFixed(8)
            : 0
        } ETH`
      ),
      // ethValue: getETHDisplay(
      //   pureMetrics[0] !== undefined ? Number(pureMetrics[0]) / 1e18 : 0
      // ),
      icon: VolumeIcon,
    },
    {
      title: "Fee Collected",
      mainValue: getMainValue(
        pureMetrics[1] !== undefined ? Number(pureMetrics[1]) / 1e18 : 0,
        `${
          pureMetrics[1] !== undefined
            ? (Number(pureMetrics[1]) / 1e18).toFixed(8)
            : 0
        } ETH`
      ),
      // ethValue: getETHDisplay(
      //   pureMetrics[1] !== undefined ? Number(pureMetrics[1]) / 1e18 : 0
      // ),
      icon: FeeCollected,
    },
    {
      title: "Tokens Launched",
      mainValue: `${pureMetrics?.[2] || 0}`,
      ethValue: "",
      icon: TokensLaunched,
    },
    {
      title: "Tokens Listed",
      mainValue: `${pureMetrics?.[3] || 0}`,
      ethValue: "",
      icon: TokensListed,
    },
    {
      title: "Avg. Bonding",
      mainValue: `${averageCurveProgress.toFixed(2) || 0}%`, // This doesn't seem to have a corresponding pureMetrics value
      ethValue: "",
      icon: AverageBonding,
    },
    {
      title: "Tax Tokens",
      mainValue: `${pureMetrics?.[4] || 0}`,
      ethValue: "",
      icon: TaxTokens,
    },
    {
      title: "0% - Tax Token",
      mainValue: `${pureMetrics?.[5] || 0}`,
      ethValue: "",
      icon: ZeroTaxTokens,
    },
    {
      title: "$SAFU Holders",
      mainValue: "234",
      ethValue: "",
      icon: SafuHolders,
    },
    {
      title: "Dev Reward",
      mainValue: getMainValue(
        pureMetrics[6] !== undefined ? Number(pureMetrics[6]) / 1e18 : 0,
        `${
          pureMetrics[6] !== undefined
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
      gsap
        .timeline({
          defaults: { ease: "power4.out" },
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        })
        .from(
          headlineRef.current,
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
            ease: "power2.out",
          },
          "+=0.1"
        )
        .from(cardRefs.current, {
          opacity: 0,
          y: 50,
          stagger: 0.15,
          duration: 0.8,
          ease: "power2.out",
        });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="stats" className="mt-28 px-6 relative" ref={containerRef}>
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        <DustParticles />
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
      </div>
    </section>
  );
};

export default PlatformStats;
