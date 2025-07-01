import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import DustParticles from "../generalcomponents/DustParticles";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const roadmap = [
  {
    quarter: "Q2 2025",
    items: [
      "Launch mainnet v1 with core bonding-curve AMM and automatic Uniswap integration",
      "Introduce whitelist tiers & presale bundle features",
    ],
    side: "left",
  },
  {
    quarter: "Q3 2025",
    items: [
      "Deploy $SAFU token with tiered launch-access benefits",
      "Add real-time analytics dashboard for fees/volume/trader counts",
    ],
    side: "right",
  },
  {
    quarter: "Q4 2025",
    items: [
      "Multi-chain support (BSC, Polygon, Avalanche)",
      "Governance portal for $SAFU holders to vote on protocol parameters",
    ],
    side: "left",
  },
  {
    quarter: "2026 and Beyond",
    items: [
      "Yield-farming vaults for platform fee reinvestment",
      "SDK & APIs for third-party dApp integrations",
    ],
    side: "right",
  },
];

const Roadmap = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: path,
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
    });

    // Animate path drawing
    tl.fromTo(
      path,
      { strokeDasharray: pathLength, strokeDashoffset: pathLength },
      { strokeDashoffset: 0, ease: "none" }
    );

    // Animate roadmap items
    itemsRef.current.forEach((item) => {
      tl.fromTo(
        item,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" },
        `+=0.2`
      );
    });

    // ✅ Only run if `path` is not null
    gsap.to("#waterDot", {
      motionPath: {
        path,
        align: path,
        autoRotate: false,
        start: 0,
        end: 1,
      },
      scrollTrigger: {
        trigger: path,
        start: "top center",
        end: "bottom center",
        scrub: true,
      },
      ease: "none",
    });
  }, []);

  return (
    <section
      id="roadmap"
      className="relative px-6 py-20 lg:px-32 lg:py-20 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <h2 className="text-3xl font-bold text-center mb-20 font-raleway text-black dark:text-white">
        Roadmap
      </h2>

      {/* SVG Path */}
      <svg
        className="absolute left-1/2 transform -translate-x-1/2 top-[7rem] z-0 pointer-events-none"
        width="400"
        height="1000"
        viewBox="0 0 300 900"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stream Glow Background */}
        <path
          d="M150 0
             C150 100, 100 100, 100 200
             C100 300, 150 300, 150 400
             C150 500, 200 500, 200 600
             C200 700, 150 700, 150 800"
          stroke="#3B82F6"
          strokeWidth="100"
          fill="none"
          strokeLinecap="round"
          style={{
            filter: "blur(20px)",
            opacity: 0.2,
          }}
        />
        {/* Main Stream Path */}
        <path
          ref={pathRef}
          d="M150 0
             C150 100, 100 100, 100 200
             C100 300, 150 300, 150 400
             C150 500, 200 500, 200 600
             C200 700, 150 700, 150 800"
          stroke="#3B82F6"
          strokeWidth="30"
          fill="none"
          strokeLinecap="round"
        />
        {/* Orb */}
        <circle id="waterDot" r="7" fill="#60A5FA" filter="url(#glow)" />
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Roadmap Items */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {roadmap.map((phase, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) itemsRef.current[index] = el;
            }}
            className={`w-full flex ${
              phase.side === "left"
                ? "justify-start text-left"
                : "justify-end text-right"
            } mb-20 opacity-0`} // hidden by default
          >
            <div className="w-full max-w-md">
              <h3
                className={`text-blue-400 font-semibold text-lg mb-2 font-raleway ${
                  phase.side === "left" ? "text-right" : "text-left"
                }`}
              >
                {phase.quarter}
              </h3>
              <ul className=" dark:text-white text-[#141313] space-y-2">
                {phase.items.map((item, i) => (
                  <li
                    className={`${
                      phase.side === "left" ? "text-right" : "text-left"
                    }`}
                    key={i}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Roadmap;
