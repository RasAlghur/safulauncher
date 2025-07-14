// TrendingTokens.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  pureInfoDataRaw,
  pureGetLatestETHPrice,
  pureAmountOutMarketCap,
  pureMetrics,
} from "../../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../../web3/config";
import { base } from "../../lib/api";

export interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  tokenImageId?: string;
  image?: {
    name: string;
    path: string;
  };
  createdAt?: string;
  expiresAt?: string;
}

interface TrendingTokenData {
  token: TokenMetadata;
  marketCap: number;
  volume: number;
  priceChange: number;
  holders: number;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

const TrendingTokens = () => {
  const [trendingData, setTrendingData] = useState<TrendingTokenData[]>([]);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24h");
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Time range in milliseconds.
  const getTimeRangeMs = (range: TimeRange): number => {
    const now = Date.now();
    switch (range) {
      case "1h":
        return now - 1 * 60 * 60 * 1000;
      case "6h":
        return now - 6 * 60 * 60 * 1000;
      case "24h":
        return now - 24 * 60 * 60 * 1000;
      case "7d":
        return now - 7 * 24 * 60 * 60 * 1000;
      default:
        return now - 24 * 60 * 60 * 1000;
    }
  };

  // Fetch ETH price
  useEffect(() => {
    async function fetchEthPrice() {
      try {
        const raw = await pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!);
        const price = (typeof raw === "number" ? raw : Number(raw)) / 1e8;
        setEthPriceUSD(price);
      } catch {
        console.error("Failed to fetch ETH price");
      }
    }
    fetchEthPrice();
  }, []);

  interface logs {
    ethAmount: string;
    timestamp: string;
    type: string;
    oldMarketCap: string;
    wallet: string;
    tokenAmount: string;
    tokenAddress: string;
    token: TokenMetadata;
  }

  useEffect(() => {
    if (ethPriceUSD === 0) {
      setLoading(false);
      return;
    }

    const transactionByTime = async () => {
      const sinceTime = getTimeRangeMs(selectedRange);
      try {
        // Get volume and price change data
        const [Logs, messageCount] = await Promise.allSettled([
          base.get(`find-by-time`, {
            params: { timestamp: sinceTime },
          }),

          base.get(`message-count`, {
            params: { timestamp: sinceTime },
          }),
        ]);
        const tokenLogs = Logs.status === "fulfilled" ? Logs.value : null;
        const count =
          messageCount.status === "fulfilled" ? messageCount.value : null;

        return {
          token: tokenLogs?.data.data || [],
          messageCount: count?.data.data || [],
        };
      } catch (error) {
        console.log(error);
      }
    };

    async function fetchTrendingData() {
      const result = await transactionByTime();

      const logs: logs[] = result?.token;
      const msgCount = result?.messageCount;

      console.log(msgCount);

      try {
        // Early return if no logs available
        if (!Array.isArray(logs) || logs.length === 0) {
          console.warn(`No transaction logs found for ${selectedRange}`);
          setTrendingData([]);
          setLoading(false);
          return;
        }

        console.log("logs", logs);

        // Group logs by token address
        const tokenGroups: Record<string, logs[]> = {};
        logs.forEach((log) => {
          const tokenAddress = log.tokenAddress;
          if (!tokenGroups[tokenAddress]) {
            tokenGroups[tokenAddress] = [];
          }
          tokenGroups[tokenAddress].push(log);
        });

        // Process each token individually
        const tokenPromises = Object.entries(tokenGroups).map(
          async ([tokenAddress, tokenLogs]) => {
            try {
              // Get market cap for this token
              const info = await pureInfoDataRaw(tokenAddress);
              console.log("Fetching marketcap data for token:", tokenAddress);

              let marketCap = 0;
              if (Array.isArray(info)) {
                const supply = Number(info[7]);
                const rawAmt = await pureAmountOutMarketCap(tokenAddress);
                const pricePerToken = rawAmt
                  ? Number(rawAmt.toString()) / 1e18
                  : 0;
                marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;
              }
              console.log(
                `Market cap for token ${tokenAddress} is ${marketCap}`
              );

              // Calculate volume for this token
              const volumeEth = tokenLogs.reduce(
                (sum, tx) => sum + parseFloat(tx.ethAmount),
                0
              );
              const volume = volumeEth * ethPriceUSD;

              // Calculate price change for this token
              let priceChange = 0;
              if (tokenLogs.length > 0) {
                // Sort by timestamp to get the earliest transaction
                const sortedLogs = tokenLogs.sort(
                  (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
                );
                const firstTx = sortedLogs[0];
                const oldMC = parseFloat(firstTx.oldMarketCap);
                if (oldMC > 0) {
                  priceChange = ((marketCap - oldMC) / oldMC) * 100;
                }
              }

              // Calculate holders for this token
              const balanceMap: Record<string, number> = {};
              tokenLogs.forEach((tx) => {
                const amt = parseFloat(tx.tokenAmount);
                const w = tx.wallet.toLowerCase();
                if (!balanceMap[w]) balanceMap[w] = 0;
                // add on buys, subtract on sells
                balanceMap[w] += tx.type === "buy" ? amt : -amt;
              });

              // Count only those wallets still holding >0 tokens
              const holders = Object.values(balanceMap).filter(
                (net) => net > 0
              ).length;

              // Get token metadata from the first log (they should all be the same)
              const token = tokenLogs[0].token;

              return {
                token,
                marketCap,
                volume,
                priceChange,
                holders,
              };
            } catch (e) {
              console.error(
                `Error fetching data for token ${tokenAddress}:`,
                e
              );

              // Return token with zero values on error
              return {
                token: tokenLogs[0]?.token || ({} as TokenMetadata),
                marketCap: 0,
                volume: 0,
                priceChange: 0,
                holders: 0,
              };
            }
          }
        );

        // Wait for all token data to be processed
        const processedTokens = await Promise.all(tokenPromises);

        // After you have `processedTokens: TrendingTokenData[]`

        const mainValue =
          pureMetrics[0] !== undefined ? Number(pureMetrics[0]) / 1e18 : 0;
        const usdValue = mainValue * ethPriceUSD;

        const volumeCrit = 0.04 * usdValue; // 4% of total volume

        processedTokens.map((t) => {
          const meetsVolume = t.volume >= volumeCrit;
          const meetsHighGain = t.priceChange >= 100;
          const meetsHighLoss = t.priceChange <= -90;

          console.log(
            `Token ${t.token.symbol} (${t.token.tokenAddress}):`,
            `volume=${t.volume.toFixed(2)} (${meetsVolume ? "✔️" : "✖️"} ≥4%),`,
            `Δ=${t.priceChange.toFixed(1)}%`,
            meetsHighGain ? "✔️+100%" : "",
            meetsHighLoss ? "✔️-90%" : ""
          );

          return { ...t, meetsVolume, meetsHighGain, meetsHighLoss };
        });

        const filtered = processedTokens.filter(
          (t) =>
            t.volume >= volumeCrit ||
            t.priceChange >= 100 ||
            t.priceChange <= -90
        );

        const tier1 = filtered.filter(
          (t) =>
            t.volume >= volumeCrit &&
            (t.priceChange >= 100 || t.priceChange <= -90)
        );
        const tier2 = filtered.filter(
          (t) =>
            !(
              t.volume >= volumeCrit &&
              (t.priceChange >= 100 || t.priceChange <= -90)
            )
        );

        // 4. Sort *each* tier by descending volume
        tier1.sort((a, b) => b.volume - a.volume);
        tier2.sort((a, b) => b.volume - a.volume);

        // 5. Concatenate tiers (tier1 first), and optionally take top N
        const ranked = [...tier1, ...tier2].slice(0, 10);

        // 6. Update state
        setTrendingData(ranked);
        setLoading(false);

        // // Sort by volume (descending) and take top 10
        // const sortedTrending = processedTokens
        //   .sort((a, b) => b.volume - a.volume)
        //   .slice(0, 10);

        // setTrendingData(sortedTrending);
        // setLoading(false);
      } catch (e) {
        console.error(`Error in fetchTrendingData:`, e);
        setTrendingData([]);
        setLoading(false);
      }
    }

    fetchTrendingData();
  }, [selectedRange, ethPriceUSD]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <section className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 mt-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white text-black">
          Trending
        </h2>
        <div className="flex gap-2 text-sm dark:bg-[#141933] bg-white/5 rounded-full p-1">
          {(["1h", "6h", "24h", "7d"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1 rounded-full transition-colors ${
                range === selectedRange
                  ? "bg-[#1D223E] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="dark:bg-[#0B132B]/50 backdrop-blur-md rounded-xl shadow-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3BC3DB] mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading trending tokens...</p>
            </div>
          ) : (
            <table className="min-w-[600px] md:min-w-full">
              <thead>
                <tr className="text-left text-sm md:text-base font-semibold text-gray-400 border-b border-[#2A2F45] ">
                  <th className="p-3">Token</th>
                  <th className="p-3">Market Cap</th>
                  <th className="p-3">{selectedRange} %</th>
                  <th className="p-3">{selectedRange} Volume</th>
                  <th className="p-3 text-right">Holders</th>
                </tr>
              </thead>
              <tbody>
                {trendingData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No trending tokens found for this time range
                    </td>
                  </tr>
                ) : (
                  trendingData.map((data) => (
                    <tr
                      key={data.token.tokenAddress}
                      className="border-b border-[#2A2F45] last-of-type:border-b-0 text-black dark:text-white text-sm md:text-base hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3">
                        <Link
                          to={`/trade/${data.token.tokenAddress}`}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          {data.token.tokenImageId ? (
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL}${
                                data.token.image?.path
                              }`}
                              alt={data.token.name}
                              className="w-10 h-10 rounded-xl"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#3BC3DB] to-[#147ABD] flex items-center justify-center text-white font-bold">
                              {data.token.symbol.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {data.token.name} ({data.token.symbol})
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/50">
                              {data.token.tokenAddress.slice(0, 6)}...
                              {data.token.tokenAddress.slice(-4)}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3">{formatCurrency(data.marketCap)}</td>
                      <td
                        className={`p-3 font-semibold ${
                          data.priceChange < 0
                            ? "text-red-500"
                            : "text-green-400"
                        }`}
                      >
                        {formatPercentage(data.priceChange)}
                      </td>
                      <td className="p-3">{formatCurrency(data.volume)}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <span className="dark:text-white">
                            {data.holders > 1000
                              ? `${(data.holders / 1000).toFixed(1)}k`
                              : data.holders}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-right text-sm text-gray-400 mt-4">
        <Link to="/tokens" className="hover:underline">
          Browse All
        </Link>
      </div>
    </section>
  );
};

export default TrendingTokens;
