import DustParticles from "../generalcomponents/DustParticles";
import roadmapTree from "../../assets/roadmap-tree.png";
import roadmapTreeMobile from "../../assets/roadmap-tree-mobile.png";

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
  return (
    <section
      id="roadmap"
      className="relative px-6 py-20 lg:px-32 lg:py-20 lg:pb-40 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <h2 className="text-3xl font-bold text-center mb-20 font-raleway text-black dark:text-white">
        Roadmap
      </h2>

      <div className="relative max-w-6xl mx-auto flex items-start justify-center">
        {/* Roadmap center image */}
        <img
          src={roadmapTree}
          alt="roadmap tree desktop"
          className="hidden md:block w-[325px] h-auto relative z-0"
        />
        <img
          src={roadmapTreeMobile}
          alt="roadmap tree mobile"
          className="block md:hidden w-[200px] h-auto relative z-0"
        />
        {/* Left and right content */}
        <div className="absolute top-0 left-0 w-full h-full">
          {roadmap.map((entry, index) => {
            const isLeft = entry.side === "left";
            const verticalOffset = index * 150;

            return (
              <div
                key={index}
                className={`absolute sm:w-[calc(50%-180px)] sm:mt-40 ${
                  isLeft ? "left-0 text-right pr-8" : "right-0 text-left pl-8"
                }`}
                style={{ top: `${verticalOffset}px` }}
              >
                <h3 className="text-[#3BC3DB] font-semibold text-lg mb-2">
                  {entry.quarter}
                </h3>
                <ul className="text-black dark:text-white space-y-2 text-sm leading-relaxed">
                  {entry.items.map((point, i) => (
                    <li key={i} className="before:content-['•'] before:mr-2">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
