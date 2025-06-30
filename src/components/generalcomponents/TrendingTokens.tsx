import native from "../../assets/native.png";
import fwog from "../../assets/fwog.png";
import clankfun from "../../assets/clank.png";
import opsys from "../../assets/opsys.png";
import bankr from "../../assets/bankr.png";

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
    <section className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 mt-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white text-black">
          Trending
        </h2>
        <div className="flex gap-2 text-sm dark:bg-[#141933] bg-white/5 rounded-full p-1">
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

      {/* Table */}
      <div className="dark:bg-[#0B132B]/50 backdrop-blur-md  rounded-xl shadow-xl">
        <div className="overflow-x-auto ">
          <table className="min-w-[600px] md:min-w-full">
            <thead>
              <tr className="text-left text-sm md:text-base font-semibold text-gray-400 border-b border-[#2A2F45]">
                <th className="p-3">Token</th>
                <th className="p-3">Market Cap</th>
                <th className="p-3">24h %</th>
                <th className="p-3">24h Volume</th>
                <th className="p-3 text-right">Holders</th>
              </tr>
            </thead>
            <tbody>
              {trendingTokens.map((token, index) => (
                <tr
                  key={index}
                  className="border-b border-[#2A2F45] text-black dark:text-white text-sm md:text-base"
                >
                  <td className="p-3 flex items-center gap-3">
                    <img
                      src={token.icon}
                      alt={token.name}
                      className="w-10 h-10 rounded-xl"
                    />
                    <div>
                      <div className="font-medium">{token.name}</div>
                      <div className="text-xs text-black/50 dark:text-white/50">
                        {token.address}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{token.marketCap}</td>
                  <td
                    className={`p-3 font-semibold ${
                      token.change24h.includes("-")
                        ? "text-red-500"
                        : "text-green-400"
                    }`}
                  >
                    {token.change24h}
                  </td>
                  <td className="p-3">{token.volume24h}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs">
                        A
                      </span>
                      <span>1.2k</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-right text-sm text-gray-400 mt-4">
        <button className="hover:underline">Browse All</button>
      </div>
    </section>
  );
};

export default TrendingTokens;
