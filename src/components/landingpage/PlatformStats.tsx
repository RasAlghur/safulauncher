import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pureMetrics, pureGetLatestETHPrice } from "../../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../../web3/config";

import VolumeIcon from "../svgcomponents/Volume";
import FeeCollected from "../svgcomponents/FeeCollected";
import TokensLaunched from "../svgcomponents/TokensLaunched";
import TokensListed from "../svgcomponents/TokensListed";
import AverageBonding from "../svgcomponents/AverageBonding";
import TaxTokens from "../svgcomponents/TaxTokens";
import ZeroTaxTokens from "../svgcomponents/ZeroTaxTokens";
import SafuHolders from "../svgcomponents/SafuHolders";
import DustParticles from "../generalcomponents/DustParticles";

gsap.registerPlugin(ScrollTrigger);

interface PlatformStatsProps {
  ethPriceUSD?: number;
}

const PlatformStats = ({ ethPriceUSD }: PlatformStatsProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const [currentETHPrice, setCurrentETHPrice] = useState<number>(ethPriceUSD || 0);

  // Fetch ETH price if not provided
  useEffect(() => {
    if (!ethPriceUSD) {
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
    } else {
      setCurrentETHPrice(ethPriceUSD);
    }
  }, [ethPriceUSD]);

  // Helper function to get USD value as main display
  const getMainValue = (ethValue: number, fallbackValue: string) => {
    if (currentETHPrice === 0) return fallbackValue;
    const usdValue = ethValue * currentETHPrice;
    return `$${usdValue.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
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
        pureMetrics[0] !== undefined ? (Number(pureMetrics[0]) / 1e18) : 0,
        `${pureMetrics[0] !== undefined ? (Number(pureMetrics[0]) / 1e18).toFixed(8) : 0} ETH`
      ),
      ethValue: getETHDisplay(pureMetrics[0] !== undefined ? (Number(pureMetrics[0]) / 1e18) : 0),
      icon: VolumeIcon 
    },
    { 
      title: "Fee Collected", 
      mainValue: getMainValue(
        pureMetrics[1] !== undefined ? (Number(pureMetrics[1]) / 1e18) : 0,
        `${pureMetrics[1] !== undefined ? (Number(pureMetrics[1]) / 1e18).toFixed(8) : 0} ETH`
      ),
      ethValue: getETHDisplay(pureMetrics[1] !== undefined ? (Number(pureMetrics[1]) / 1e18) : 0),
      icon: FeeCollected 
    },
    { 
      title: "Tokens Launched", 
      mainValue: `${pureMetrics?.[2] || 0}`,
      ethValue: "",
      icon: TokensLaunched 
    },
    { 
      title: "Tokens Listed", 
      mainValue: `${pureMetrics?.[3] || 0}`,
      ethValue: "",
      icon: TokensListed 
    },
    { 
      title: "Avg. Bonding", 
      mainValue: "75%", // This doesn't seem to have a corresponding pureMetrics value
      ethValue: "",
      icon: AverageBonding 
    },
    { 
      title: "Tax Tokens", 
      mainValue: `${pureMetrics?.[4] || 0}`,
      ethValue: "",
      icon: TaxTokens 
    },
    { 
      title: "0% - Tax Token", 
      mainValue: `${pureMetrics?.[5] || 0}`,
      ethValue: "",
      icon: ZeroTaxTokens 
    },
    { 
      title: "$SAFU Holders", 
      mainValue: "234",
      ethValue: "",
      icon: SafuHolders 
    },
    { 
      title: "Dev Reward", 
      mainValue: getMainValue(
        pureMetrics[6] !== undefined ? (Number(pureMetrics[6]) / 1e18) : 0,
        `${pureMetrics[6] !== undefined ? (Number(pureMetrics[6]) / 1e18).toFixed(4) : 0} ETH`
      ),
      ethValue: getETHDisplay(pureMetrics[6] !== undefined ? (Number(pureMetrics[6]) / 1e18) : 0),
      icon: SafuHolders 
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
    <section id="stats" className=" mt-16 px-6 relative" ref={containerRef}>
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="dark:bg-[#9747FF]/15 bg-[#3AC2DB]/10 rounded-3xl px-6 py-4 lg:px-6 lg:py-6 lg:pb-2 text-white relative border-[2px] border-t-0 dark:border-[#9747FF]/10 border-Primary">
          <div className="rounded-tab-inverted">
            <h2
              ref={headlineRef}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold dark:text-white text-black text-center mt-4"
            >
              Platform Stats
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-20 py-8">
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