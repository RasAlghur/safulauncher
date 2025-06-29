import native from "../../assets/native.png";
import fwog from "../../assets/fwog.png";
import clankfun from "../../assets/clank.png";
import opsys from "../../assets/opsys.png";
import bankr from "../../assets/bankr.png";
// Sample data
const trendingTokens = [
  {
    name: "$NATIVE",
    address: "0x3...DD0",
    marketCap: "$6.8M",
    change24h: "+10%",
    volume24h: "$20k",
    icon: native,
  },
  {
    name: "$FWOG",
    address: "0x3...DD0",
    marketCap: "$2.3M",
    change24h: "+4%",
    volume24h: "$19k",
    icon: fwog,
  },
  {
    name: "$CLANKFUN",
    address: "0x3...DD0",
    marketCap: "$450k",
    change24h: "+8%",
    volume24h: "$80k",
    icon: clankfun,
  },
  {
    name: "$OPSYS",
    address: "0x3...DD0",
    marketCap: "$230k",
    change24h: "-2%",
    volume24h: "$20k",
    icon: opsys,
  },
  {
    name: "$BANKR",
    address: "0x3...DD0",
    marketCap: "$18M",
    change24h: "+11%",
    volume24h: "$1.4M",
    icon: bankr,
  },
];

const TrendingTokens = () => {
  return (
    <section className="bg-transparent text-white p-6 rounded-xl w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white text-black">
          Trending
        </h2>
        <div className="flex gap-2 text-sm dark:bg-[#141933] bg-white/3 rounded-full p-1">
          {["1h", "6h", "24h", "7d"].map((range) => (
            <button
              key={range}
              className={`px-3 py-1 rounded-full ${
                range === "24h" ? "bg-[#1D223E] text-white" : "text-gray-400"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-gray-400 px-2">
        <div>Token</div>
        <div>Market Cap</div>
        <div>24h %</div>
        <div>24h Vol.</div>
        <div></div>
      </div>

      {trendingTokens.map((token, index) => (
        <div
          key={index}
          className="grid grid-cols-5 items-center gap-4 py-4 px-2 border-b border-[#1F253F]"
        >
          {/* Token */}
          <div className="flex items-center gap-3">
            <img src={token.icon} alt="" className="w-10 h-10 rounded-xl" />

            <div>
              <div className="font-medium dark:text-white text-black">
                {token.name}
              </div>
              <div className="text-xs dark:text-white/40 text-[#141313]/40">
                {token.address}
              </div>
            </div>
          </div>

          {/* Market Cap */}
          <div className="dark:text-white text-black">{token.marketCap}</div>

          {/* 24h % */}
          <div
            className={`font-medium ${
              token.change24h.includes("-") ? "text-red-500" : "text-green-400"
            }`}
          >
            {token.change24h}
          </div>

          {/* 24h Vol. */}
          <div className="dark:text-white text-black">{token.volume24h}</div>

          {/* Avatar + Online Count */}
          <div className="flex items-center gap-1 text-sm justify-end">
            <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs">
              A
            </span>
            <span className="text-black dark:text-white">1.2k</span>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="text-right text-sm text-gray-400 mt-4">
        <button className="hover:underline">Browse All</button>
      </div>
    </section>
  );
};

export default TrendingTokens;
