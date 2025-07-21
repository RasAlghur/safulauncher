// src/components/NotableBuys.tsx
import { useEffect, useState } from "react";
import { pureGetLatestETHPrice } from "../../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../../web3/config";
import { base } from "../../lib/api";
import { processUsername } from "../../lib/username";

export interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  createdAt?: string;
  expiresAt?: string;
}

interface BuyTx {
  wallet: string;
  timestamp: string;
  tokenAmount: string;
  ethAmount: string;
  usdValue: number;
  token: { symbol: string };
  user: { username: string };
  tokenAddress: string;
  txnHash: string;
  type: string;
}

const NotableBuys = () => {
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [allBuys, setAllBuys] = useState<{ recent: BuyTx[]; wins: BuyTx[] }>({
    recent: [],
    wins: [],
  });
  const [activeTab, setActiveTab] = useState<"buys" | "wins">("buys");
  const [loading, setLoading] = useState(true);

  // Load ETH price
  useEffect(() => {
    pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!)
      .then((raw) => (typeof raw === "number" ? raw : Number(raw)) / 1e8)
      .then(setEthPriceUSD)
      .catch(() => console.error("Failed to fetch ETH price"));
  }, []);

  // Fetch recent buys & wins, then fetch unique token symbols
  useEffect(() => {
    if (!ethPriceUSD) {
      setLoading(true);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const request = await base.get("recent-and-win", {
          params: { ethAmt: ethPriceUSD },
        });
        const { recent, win } = request.data.data;
        console.log({ recent, win });
        setAllBuys({ recent, wins: win });
      } catch (error) {
        console.error("Failed to load notable buys:", error);
        setAllBuys({ recent: [], wins: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, [ethPriceUSD]);

  const activeData = activeTab === "buys" ? allBuys.recent : allBuys.wins;

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading trades…</div>;
  }

  return (
    <section className="dark:bg-[#0A0D24]/40 p-6 rounded-xl w-full max-w-6xl mx-auto">
      {/* Header with Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 font-semibold text-sm sm:text-base">
          <button
            onClick={() => setActiveTab("buys")}
            className={`transition ${
              activeTab === "buys"
                ? "dark:text-white text-black border-b-2 border-[#1D223E]"
                : "dark:text-white/30 text-black/70"
            }`}
          >
            Recent Buys
          </button>
          <button
            onClick={() => setActiveTab("wins")}
            className={`transition ${
              activeTab === "wins"
                ? "dark:text-white text-black border-b-2 border-[#1D223E]"
                : "dark:text-white/30 text-black/70"
            }`}
          >
            Notable Buys
          </button>
        </div>
        <button className="text-sm text-gray-400 hover:underline">
          All trades
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {activeData.map((tx, i) => {
          const username = tx.user.username;
          const username_ = username !== undefined || username !== null;
          console.log({ username, username_ });
          return (
            <div
              key={i}
              className="dark:bg-[#151A32]/50 bg-[#01061c0d] p-4 rounded-lg flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-10 h-10 flex items-center justify-center rounded-full text-white font-bold text-sm bg-gray-600">
                {tx.wallet.slice(2, 3).toUpperCase()}
              </div>

              {/* Text */}
              <div className="text-sm">
                <div className="dark:text-white text-[#141313] font-medium">
                  {!username_
                    ? `@${processUsername(username)}`
                    : `${tx.wallet.slice(0, 6)}...${tx.wallet.slice(-4)}`}
                </div>
                <div className="flex items-center gap-2 mt-1 text-gray-300 flex-wrap">
                  <span className="dark:text-white text-[#141313]/50">
                    bought
                  </span>
                  {/* Display symbol instead of address */}
                  <span className="px-2 py-1 rounded-full dark:text-white text-[#141313] text-xs font-semibold bg-indigo-600">
                    {tx.token.symbol}
                  </span>
                  <span className="dark:text-white text-[#141313]/50">
                    with{" "}
                    <span className="dark:text-white text-[#141313] font-medium">
                      ${tx?.usdValue.toFixed(0)}
                    </span>
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}

        {activeData.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400">
            Nothing to see here
          </div>
        )}
      </div>
    </section>
  );
};

export default NotableBuys;
