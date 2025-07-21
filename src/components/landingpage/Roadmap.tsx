import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import DustParticles from "../generalcomponents/DustParticles";
import cloudRight from "../../assets/cloud-right.png";
import cloudLeft from "../../assets/cloud-left.png";
import topCloud from "../../assets/why-safu-cloud-top.png";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Roadmap = () => {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const animateFrom = (selector: string, xOffset: number, delay = 0) => {
        gsap.from(selector, {
          scrollTrigger: {
            trigger: selector,
            start: "top 90%",
            toggleActions: "play reverse play reverse",
          },
          x: xOffset,
          opacity: 0,
          duration: 1,
          delay,
          ease: "power3.out",
        });
      };

      animateFrom(".first-div", -100, 0);
      animateFrom(".third-div", -100, 0.2);
      animateFrom(".second-div", 100, 0.4);
      animateFrom(".fourth-div", 100, 0.6);
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="roadmap"
      className="relative px-4 sm:px-6 py-20 lg:px-32  lg:pb-40 overflow-hidden"
    >
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
          className="absolute top-[5rem] -right-[1rem] "
        />
        <img
          src={topCloud}
          alt=""
          className="absolute -top-[27rem] left-0 right-0 mx-auto -z-10"
        />
      </div>
      <h2 className="text-3xl font-bold text-center mb-20 font-raleway text-black dark:text-white">
        Roadmap
      </h2>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 grid-cols-[.4fr_.2fr_.4fr] gap-2 sm:gap-0">
          {/* Left Side */}
          <div className="flex flex-col space-y-16 sm:space-y-32 xl:mt-40 mt-[60px] sm:mt-[60px]">
            <div className="first-div">
              <h2 className="font-raleway text-[#0C8CE0] font-semibold text-right text-base sm:text-lg md:text-xl">
                Q2 2025
              </h2>
              <ul className="text-black dark:text-[#B6B6B6] space-y-2 text-[13px] lg:text-base leading-relaxed">
                <li className="list-disc ">
                  Launch mainnet v1 with core bonding-curve AMM and automatic
                  Uniswap integration
                </li>
                <li className="list-disc">
                  Introduce whitelist tiers & presale bundle features
                </li>
              </ul>
            </div>
            <div className="third-div">
              <h2 className="font-raleway text-[#0C8CE0] font-semibold text-right text-base sm:text-lg md:text-xl">
                Q4 2025
              </h2>
              <ul className="text-black dark:text-[#B6B6B6] space-y-2 text-[13px] lg:text-base leading-relaxed">
                <li className="list-disc">
                  Multi-chain support (BSC, Polygon, Avalanche)
                </li>
                <li className="list-disc">
                  Governance portal for $SAFU holders to vote on protocol
                  parameters
                </li>
              </ul>
            </div>
          </div>
          <div>
            {/* Top vertical line */}
            <div className="relative mx-auto  w-2 bg-[#0C8CE0] h-[100%] lg:h-[85%]">
              {/* Left curve for Q2 */}
              <div className="relative w-full h-[80px]">
                <div className="absolute top-[4rem] xl:top-[10rem] right-0 w-[35px] sm:w-[70px] lg:w-[120px] xl:w-40 h-full border-r-8 border-b-8 border-[#0C8CE0] rounded-br-full"></div>
              </div>

              {/* Right curve for Q3 */}
              <div className="relative w-full h-[80px]">
                <div className="absolute top-[4.5rem] xl:top-[12rem] left-0 w-[35px] sm:w-[70px] lg:w-[120px] xl:w-40 h-full border-l-8 border-b-8 border-[#0C8CE0] rounded-bl-full"></div>
              </div>

              {/* Left curve for Q4 */}
              <div className="relative w-full h-[80px]">
                <div className="absolute top-[9rem] xl:top-[15rem] right-0 w-[35px] sm:w-[70px] lg:w-[120px] xl:w-40 h-full border-r-8 border-b-8 border-[#0C8CE0] rounded-br-full"></div>
              </div>

              {/* Right curve for 2026+ */}
              <div className="relative w-full h-[80px]">
                <div className="absolute top-[10rem] lg:top-[10.5rem] xl:top-[18rem] left-0 w-[35px] sm:w-[70px] lg:w-[120px] xl:w-40 h-full border-l-8 border-b-8 border-[#0C8CE0] rounded-bl-full"></div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="mt-[180px] sm:mt-[180px] md:mt-[200px] xl:mt-72">
            <div className="flex flex-col space-y-20 sm:space-y-32">
              <div className="second-div">
                <h2 className="font-raleway text-[#0C8CE0] font-semibold text-left text-base sm:text-lg md:text-xl">
                  Q3 2025
                </h2>
                <ul className="text-black dark:text-[#B6B6B6] space-y-2 text-[13px] lg:text-base leading-relaxed">
                  <li className="list-disc">
                    Deploy $SAFU token with tiered launch-access benefits
                  </li>
                  <li className="list-disc">
                    Add real-time analytics dashboard for fees/volume/trader
                    counts
                  </li>
                </ul>
              </div>
              <div className="fourth-div">
                <h2 className="font-raleway text-[#0C8CE0] font-semibold text-left text-base sm:text-lg md:text-xl">
                  2026 and Beyond
                </h2>
                <ul className="text-black dark:text-[#B6B6B6] space-y-2 text-[13px] lg:text-base leading-relaxed">
                  <li className="list-disc">
                    Yield-farming vaults for platform fee reinvestment
                  </li>
                  <li className="list-disc">
                    SDK & APIs for third-party dApp integrations
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
