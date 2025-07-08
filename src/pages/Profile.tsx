import { useState } from "react";
import Footer from "../components/generalcomponents/Footer";
import Navbar from "../components/launchintro/Navbar";
import { FaBell } from "react-icons/fa";
import DustParticles from "../components/generalcomponents/DustParticles";

const Profile = () => {
  const [activeTab, setActiveTab] = useState<"holdings" | "launched">(
    "holdings"
  );

  const holdings = [
    { name: "CLANKVTX", amount: "2.345", value: "$6,789" },
    { name: "CLANKER", amount: "1,500", value: "$3,000" },
    { name: "TINY", amount: "3,200", value: "$1,280" },
    { name: "MOAR", amount: "750", value: "$1,150" },
    { name: "TINY", amount: "5,800", value: "$4,060" },
  ];

  const launchedTokens = [
    { name: "Galactica", symbol: "GL", deployed: "2025-04-01" },
    { name: "RocketCoin", symbol: "RC", deployed: "2025-03-15" },
    { name: "MetaCoin", symbol: "MC2", deployed: "2025-02-20" },
  ];

  return (
    <div className="px-4 relative mountain">
      <Navbar />

      {/* Background Glow */}
      <div className="lg:size-[30rem] lg:w-[55rem] rounded-full bg-[#3BC3DB]/10 absolute top-[50px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <h1 className="lg:text-4xl font-bold text-center dark:text-white text-black mb-10 font-raleway pt-40">
        My Profile
      </h1>
      <div className="max-w-3xl mx-auto mb-40 dark:bg-[#050A1E]/80 bg-[#141313]/3 border border-white/10 px-6 py-10 lg:px-[20px] lg:py-[60px] rounded-[20px] text-white">
        {/* Wallet & Notification */}
        <div className="flex justify-center items-center gap-6 mb-10">
          <div className="dark:bg-white/4 bg-[#141313]/2 text-[#141313]/90 dark:text-white px-4 py-4 rounded-xl text-sm font-mono">
            0xgdk9...a29f
          </div>
          <div className="relative w-8 h-8 dark:bg-white/10 bg-[#141313]/5 rounded-full flex items-center justify-center">
            <FaBell className="dark:text-white/70 text-[#141313] text-sm" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        </div>

        {/* Balance Card */}

        <div className="relative rounded-xl p-6 mb-10 flex flex-col items-center justify-center overflow-hidden">
          {/* Gradient Background Layer */}
          <div className="absolute inset-0 bg-gradient-to-l from-[#3BC3DB] to-[#0C8CE0] dark:opacity-[0.2] opacity-[0.08] pointer-events-none rounded-xl" />

          {/* Content Layer */}
          <div className="relative z-10 text-black dark:text-white">
            <h2 className="dark:text-white/80 text-[#0C8CE0] lg:text-[20px] mb-2 text-center font-raleway font-semibold">
              Total Balance
            </h2>
            <div className="lg:text-[70px] font-bold mb-2 font-raleway">
              $16,254
            </div>
            <div className="text-green-400 text-sm text-center">
              ▲ +10% [$1,600]
            </div>
            <div className="mt-4">{/* Replace with chart component */}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 text-lg font-semibold mb-6">
          <button
            className={`pb-1 transition cursor-pointer ${
              activeTab === "holdings"
                ? "border-white dark:text-white text-black"
                : "border-transparent dark:text-white/30 text-black/60"
            }`}
            onClick={() => setActiveTab("holdings")}
          >
            Holdings
          </button>
          <button
            className={`pb-1 transition cursor-pointer ${
              activeTab === "launched"
                ? "border-white dark:text-white text-[#141313]/75"
                : "border-transparent dark:text-white/30 text-black/60"
            }`}
            onClick={() => setActiveTab("launched")}
          >
            Token Launched
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "holdings" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holdings.map((token, i) => (
              <div
                key={i}
                className="dark:bg-[#0B132B] bg-[#141313]/5  rounded-xl px-5 py-4 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                  <span className="font-bold text-sm text-black dark:text-white">
                    {token.name}
                  </span>
                </div>
                <div className="text-sm dark:text-white/70 text-[#141313]/75">
                  {token.amount} <span className="ml-2">[{token.value}]</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {launchedTokens.map((token, i) => (
              <div
                key={i}
                className="dark:bg-[#0B132B] bg-[#141313]/5 rounded-xl px-5 py-4 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span className="font-bold text-sm text-black dark:text-white">
                    {token.name} ({token.symbol})
                  </span>
                </div>
                <div className="text-sm dark:text-white/70 text-[#141313]/75">
                  Deployed: {token.deployed}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
