import { useRef, useEffect, memo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

// ✅ Move outside component so it's not recreated on every render
const stats = [
  { title: "Total Volume", value: "$1.2M", icon: VolumeIcon },
  { title: "Fee Collected", value: "$12.3K", icon: FeeCollected },
  { title: "Tokens Launched", value: "456", icon: TokensLaunched },
  { title: "Tokens Listed", value: "123", icon: TokensListed },
  { title: "Avg. Bonding", value: "75%", icon: AverageBonding },
  { title: "Tax Tokens", value: "89K", icon: TaxTokens },
  { title: "0% - Tax Token", value: "234", icon: ZeroTaxTokens },
  { title: "$SAFU Holders", value: "234", icon: SafuHolders },
];

const PlatformStats = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

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
        .from(cardRefs.current, {
          opacity: 0,
          y: 50,
          stagger: 0.15,
          duration: 0.8,
          ease: "power2.out",
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
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="stats" className="mt-16 px-6 relative" ref={containerRef}>
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        <DustParticles />
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
      </div>
    </section>
  );
};

export default memo(PlatformStats);
