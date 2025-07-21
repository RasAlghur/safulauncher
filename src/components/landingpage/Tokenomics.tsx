import { memo, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import piechart from "../../assets/piechart.png";
import piechartWhite from "../../assets/piechart-white.png";
import DustParticles from "../generalcomponents/DustParticles";

gsap.registerPlugin(ScrollTrigger);

const Tokenomics = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Whole section fades and slides up
      gsap.from(".tokenomics-wrapper", {
        opacity: 0,
        y: 80,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".tokenomics-wrapper",
          start: "top 85%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Pie chart zoom in
      gsap.from(".piechart", {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: ".piechart",
          start: "top 85%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Distribution blocks slide in
      gsap.from(".token-block", {
        opacity: 0,
        x: 50,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".tokenomics-wrapper",
          start: "top 85%",
          toggleActions: "play reverse play reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="tokenomics"
      className="lg:py-20 relative overflow-x-hidden"
    >
      {/* Dust particles */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <DustParticles />
      </div>

      <div className="py-12 px-6 md:px-20 tokenomics-wrapper">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#01061C] dark:text-white">
          Tokenomics
        </h2>

        <div className="flex flex-col lg:flex-row items-center gap-12 justify-center">
          {/* Token Info */}
          <div className="space-y-4 text-[#141313] dark:text-white">
            <p>
              <span className="font-semibold">Token Name:</span> SafuLauncher
            </p>
            <p>
              <span className="font-semibold">Ticker:</span> SAFU
            </p>
            <p>
              <span className="font-semibold">Total Supply:</span> 1,000,000,000
            </p>
            <p>
              <span className="font-semibold">Decimal:</span> 5
            </p>
            <p>
              <span className="font-semibold">Tax:</span> 5/5
            </p>
          </div>

          {/* Chart + Distribution */}
          <div className="flex flex-col md:flex-row items-center justify-between lg:gap-8">
            {/* Chart */}
            <img
              src={piechart}
              alt="Pie chart dark"
              className="w-full max-w-md hidden dark:block piechart"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
            <img
              src={piechartWhite}
              alt="Pie chart light"
              className="w-full max-w-md dark:hidden piechart"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />

            {/* Distribution */}
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold font-raleway mb-6 text-black dark:text-white">
                Token Distribution
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3 text-left">
                {/* Left Column */}
                <div>
                  <div className="flex items-start gap-2 mb-[34px] token-block">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#2883A3]" />
                    <div>
                      <span className="font-semibold text-xl text-black dark:text-white">
                        Liquidity
                      </span>
                      <br />
                      <p className="text-black dark:text-white">
                        400,000,000 (40%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mb-[34px] token-block">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#BD2624]" />
                    <div>
                      <span className="font-semibold text-xl text-black dark:text-white">
                        Marketing
                      </span>
                      <br />
                      <p className="text-black dark:text-white">
                        250,000,000 (Vested) (25%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="flex items-start gap-2 mb-[34px] token-block">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#2CB54A]" />
                    <div>
                      <span className="font-semibold text-xl text-black dark:text-white">
                        Future Plans
                      </span>
                      <br />
                      <p className="text-black dark:text-white">
                        Such as CEX listing: 250,000,000 (Locked) (25%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 token-block">
                    <div className="w-3 h-3 rounded-full mt-1 bg-[#631DBE]" />
                    <div>
                      <span className="font-semibold text-xl text-black dark:text-white">
                        Team
                      </span>
                      <br />
                      <p className="text-black dark:text-white">
                        100,000,000 (Locked) (10%)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(Tokenomics);
