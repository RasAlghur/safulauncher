import { useRef, useEffect } from "react";
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

gsap.registerPlugin(ScrollTrigger);

const stats1 = [
  {
    id: 1,
    title: "Total Volume",
    value: "$1.2M",
    icon: VolumeIcon,
  },
  {
    id: 2,
    title: "Fee Collected",
    value: "$12.3K",
    icon: FeeCollected,
  },
  {
    id: 3,
    title: "Tokens Launched",
    value: "456",
    icon: TokensLaunched,
  },
  {
    id: 4,
    title: "Tokens Listed",
    value: "123",
    icon: TokensListed,
  },
];

const stats2 = [
  {
    id: 1,
    title: "Avg. Bonding",
    value: "75%",
    icon: AverageBonding,
  },
  {
    id: 2,
    title: "Tax Tokens",
    value: "89K",
    icon: TaxTokens,
  },
  {
    id: 3,
    title: "0% - Tax Token",
    value: "234",
    icon: ZeroTaxTokens,
  },
  {
    id: 4,
    title: "$SAFU Holders",
    value: "234",
    icon: SafuHolders,
  },
];

const PlatformStats = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

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
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute bottom-[100px] right-0 blur-3xl hidden dark:block"></div>
      <h1 className="text-[1.5rem] lg:text-[2rem] font-bold dark:text-[#ECF1F0] text-black mb-[45px] text-center lg:text-left">
        Platform Stats
      </h1>
      <div className="grid lg:grid-cols-[.3fr_.7fr] gap-4">
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
                  <div className="text-lg font-semibold dark:text-white text-black">
                    {stat.value}
                  </div>
                  <div className="text-sm dark:text-white/70 text-[#141313] leading-tight">
                    {stat.title}
                  </div>
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
                  <div className="text-lg font-semibold dark:text-white text-black">
                    {stat.value}
                  </div>
                  <div className="text-sm dark:text-white/70 text-[#141313] leading-tight">
                    {stat.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* <div>
          <TrendingTokens />
          <NotableBuys />
        </div> */}
      </div>
    </section>
  );
};

export default PlatformStats;
