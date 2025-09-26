import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import chain1 from "../../assets/chain-1.png";
import chain2 from "../../assets/chain-2.png";
import DustParticles from "./DustParticles";

gsap.registerPlugin(ScrollTrigger);

const HowItWorks = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate section wrapper
      gsap.from(".how-it-works-wrapper", {
        opacity: 0,
        y: 100,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".how-it-works-wrapper",
          start: "top 85%",
        },
      });

      // Animate headline
      gsap.from(".how-heading", {
        opacity: 0,
        scale: 0,
        y: 40,
        duration: 1,
        delay: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".how-it-works-wrapper",
          start: "top 85%",
        },
      });

      // Animate the grid container
      gsap.from(".how-grid", {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".how-it-works-wrapper",
          start: "top 50%",
        },
      });

      // Animate each step
      gsap.from(".step-item", {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".how-it-works-wrapper",
          start: "top 85%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Animate chains
      gsap.fromTo(
        "#chain-left",
        { x: -200, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".how-it-works-wrapper",
            start: "top bottom",
            toggleActions: "play reverse play reverse",
          },
        }
      );

      gsap.fromTo(
        "#chain-right",
        { x: 200, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".how-it-works-wrapper",
            start: "top bottom",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="lg:pb-20 lg:pt-28 relative overflow-hidden"
      id="howitworks"
    >
      {/* Dust */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      {/* Chains */}
      <img
        id="chain-left"
        src={chain1}
        alt=""
        className="absolute top-0 -left-[23rem] size-[500px] lg:size-[600px] z-10"
      />
      <img
        id="chain-right"
        src={chain2}
        alt=""
        className="absolute bottom-0 -right-[23rem] size-[500px] lg:size-[600px] z-10"
      />

      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 hidden dark:block blur-3xl"></div>

      {/* Main Content */}
      <div className="how-it-works-wrapper text-white px-6 py-12 md:px-20 md:py-10 max-w-[1000px] mx-auto subtract">
        <div className="max-w-5xl mx-auto">
          <h2 className="how-heading text-3xl md:text-4xl max-w-[20rem] font-bold mb-10 dark:text-[#ECF1F0] text-black font-raleway">
            How It Works in 3 Easy Steps
          </h2>
          <div className="how-grid grid md:grid-cols-2 gap-8 p-6 md:p-10">
            {/* Step 1 */}
            <div className="flex flex-col gap-[34px] step-item">
              <div>
                <div className="flex items-center mb-4">
                  <span className="bg-[#0C8CE0] text-white font-bold font-raleway rounded-md px-2 py-1 text-sm mr-3">
                    01
                  </span>
                  <h3 className="text-xl font-semibold font-raleway dark:text-white text-black">
                    Configure & Deploy
                  </h3>
                </div>
                <p className="dark:text-white text-[#141313]">
                  Fill out a simple form - name, supply, optional tax settings,
                  whitelist and bundle options.
                </p>
              </div>

              {/* Step 2 */}
              <div className="step-item">
                <div className="flex items-center mb-4">
                  <span className="bg-[#0C8CE0] text-white font-bold font-raleway rounded-md px-2 py-1 text-sm mr-3">
                    02
                  </span>
                  <h3 className="text-xl font-semibold font-raleway dark:text-white text-black">
                    Presale & Public Trading
                  </h3>
                </div>
                <p className="dark:text-white text-[#141313]">
                  Whitelisted and bundle addresses get first access; then the
                  public trades on our internal AMM with a 1% fee.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-item">
              <div className="flex items-center mb-4">
                <span className="bg-[#0C8CE0] text-white font-bold font-raleway rounded-md px-2 py-1 text-sm mr-3">
                  03
                </span>
                <h3 className="text-xl font-semibold font-raleway dark:text-white text-black">
                  Auto-List & Secure
                </h3>
              </div>
              <p className="dark:text-white text-[#141313] mb-2">
                Once the goal is reached, SafuLauncher automatically:
              </p>
              <ul className="dark:text-white text-[#141313] list-disc pl-6 space-y-1">
                <li>
                  Takes a 5% listing fee & pays 0.1 ETH / 0.4 BNB to the team
                </li>
                <li>
                  Adds remaining ETH / BNB + tokens to Uniswap / Pancakeswap
                </li>
                <li>Locks or burns LP tokens</li>
                <li>Renounces contract ownership</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
