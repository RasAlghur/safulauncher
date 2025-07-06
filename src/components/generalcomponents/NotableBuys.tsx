// src/components/NotableBuys.tsx
import { useEffect, useState } from "react";
import { pureGetLatestETHPrice } from "../../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../../web3/config";
import { base } from "../../lib/api";

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
  tokenSymbol: string;
}

const NotableBuys = () => {
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [allBuys, setAllBuys] = useState<BuyTx[]>([]);
  const [activeTab, setActiveTab] = useState<"buys" | "wins">("buys");
  const [loading, setLoading] = useState(true);

  // 1) load ETH price
  useEffect(() => {
    pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!)
      .then((raw) => (typeof raw === "number" ? raw : Number(raw)) / 1e8)
      .then(setEthPriceUSD)
      .catch(() => console.error("Failed to fetch ETH price"));
  }, []);

  // 2) load token list
  useEffect(() => {
    (async () => {
      const response = await base.get("token", {
        params: { includes: "image" },
      });
      const data = response.data.data.data;
      // setTotalTokenCount(data.length);
      setTokens(data);
      console.log(data);
    })();
  }, []);

  // 3) once we have tokens + ETH price, pull all buys
  useEffect(() => {
    if (!ethPriceUSD || tokens.length === 0) return;
    setLoading(true);

    (async () => {
      const buys: BuyTx[] = [];

      await Promise.all(
        tokens.map(async (tk) => {
          try {
            const res = await base.get(`/transactions/${tk.tokenAddress}`);
            const logs: {
              type: string;
              wallet: string;
              timestamp: string;
              tokenAmount: string;
              ethAmount: string;
            }[] = res.data.data.data;

            logs
              .filter((tx) => tx.type === "buy")
              .forEach((tx) => {
                const ethAmt = parseFloat(tx.ethAmount);
                buys.push({
                  wallet: tx.wallet,
                  timestamp: tx.timestamp,
                  tokenAmount: tx.tokenAmount,
                  ethAmount: tx.ethAmount,
                  usdValue: ethAmt * ethPriceUSD,
                  tokenSymbol: tk.symbol,
                });
              });
          } catch (e) {
            console.error(`Failed to load txs for ${tk.symbol}`, e);
          } finally {
            setLoading(false);
          }
        })
      );

      setAllBuys(buys);
      setLoading(false);
    })();
  }, [ethPriceUSD, tokens]);

  // prepare the two views:
  // - recent: top 4 by timestamp
  // - wins:   top 4 by usdValue
  const recent = [...allBuys]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 4);

  const wins = [...allBuys]
    .filter((tx) => tx.usdValue >= 1000) // only buys ≥ $1k
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - // most recent first
        new Date(a.timestamp).getTime()
    )
    .slice(0, 4);

  const activeData = activeTab === "buys" ? recent : wins;

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Loading trades…</div>;
  }

  return (
    <section className="dark:bg-[#0A0D24]/40 text-white p-6 rounded-xl w-full max-w-6xl mx-auto">
      {/* Header with Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 font-semibold text-sm sm:text-base">
          <button
            onClick={() => setActiveTab("buys")}
            className={`transition ${
              activeTab === "buys"
                ? "text-white border-b-2 border-[#1D223E]"
                : "text-white/30"
            }`}
          >
            Notable Buys
          </button>
          <button
            onClick={() => setActiveTab("wins")}
            className={`transition ${
              activeTab === "wins"
                ? "text-white border-b-2 border-[#1D223E]"
                : "text-white/30"
            }`}
          >
            Big Wins
          </button>
        </div>
        <button className="text-sm text-gray-400 hover:underline">
          All trades
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {activeData.map((tx, i) => (
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
                {tx.wallet.slice(0, 6)}…{tx.wallet.slice(-4)}
              </div>
              <div className="flex items-center gap-2 mt-1 text-gray-300 flex-wrap">
                <span className="dark:text-white text-[#141313]/50">
                  bought
                </span>
                <span className="px-2 py-1 rounded-full dark:text-white text-[#141313] text-xs font-semibold bg-indigo-600">
                  {tx.tokenSymbol}
                </span>
                <span className="dark:text-white text-[#141313]/50">
                  {" "}
                  with{" "}
                  <span className="dark:text-white text-[#141313] font-medium">
                    ${tx.usdValue.toFixed(0)}
                  </span>
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(tx.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {activeData.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-400">
            Not found.
          </div>
        )}
      </div>
    </section>
  );
};

export default NotableBuys;
