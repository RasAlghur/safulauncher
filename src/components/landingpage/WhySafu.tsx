import community from "../../assets/community.png";
import automation from "../../assets/bot.png";
import trust from "../../assets/handshake.png";
import ecosystem from "../../assets/ecosystem.png";
import DustParticles from "../generalcomponents/DustParticles";

const features = [
  {
    title: "Community- First Launches",
    description:
      "Everyone trades on the same curve — no private rounds or “snipers.”",
    icon: community,
  },
  {
    title: "Hands-Off Automation",
    description:
      "From token deploy to Uniswap listing, every step runs on-chain with zero manual intervention.",
    icon: automation,
  },
  {
    title: "Built-In Trust",
    description:
      "LP lock/burn and ownership renouncement guard against rug pulls.",
    icon: trust,
  },
  {
    title: "$SAFU Ecosystem",
    description: "Holders gain priority launch access and future fee rebates.",
    icon: ecosystem,
  },
];

const WhySafu = () => {
  return (
    <section id="whysafu" className="lg:py-20 relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(1)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="bg-[#0A0E1A] text-white py-16 px-6 md:px-20 text-center">
        <h2 className="text-3xl font-bold mb-12">Why Safu Launcher?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#0F172A] border border-blue-900 rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition duration-300"
            >
              <img src={feature.icon} alt="" className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center">
          <button className="text-[1rem] font-bold px-[24px] py-[13px]  text-white cursor-pointer gap-3 bg-[#0C8CE0] rounded-full">
            <p>Connect Wallet</p>
          </button>
        </div>
      </div>
    </section>
  );
};

export default WhySafu;
