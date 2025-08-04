// TrendingTokens.tsx
import { getHoldersFromMoralis } from "../../lib/getHoldersFromMoralis";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPureInfoDataRaw,
  getPureAmountOutMarketCap,
  getPureGetLatestETHPrice,
  getPureInfoV2DataRaw,
  getPureV2AmountOutMarketCap,
  getPureMetrics,
} from "../../web3/readContracts";
import { ETH_USDT_PRICE_FEED_ADDRESSES } from "../../web3/config";
import { base } from "../../lib/api";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";

export interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  tokenImageId?: string;
  tokenVersion?: string;
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
  messageCount: number;
  criteria: {
    volumeThreshold: boolean;
    highGain: boolean;
    highLoss: boolean;
    messageCount: boolean;
  };
  criteriaCount: number;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

const TrendingTokens = () => {
  const networkInfo = useNetworkEnvironment();
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

  useEffect(() => {
    const priceFeed = ETH_USDT_PRICE_FEED_ADDRESSES[networkInfo.chainId];
    if (!priceFeed) return;

    (async () => {
      try {
        const raw = await getPureGetLatestETHPrice(networkInfo.chainId, priceFeed);
        setEthPriceUSD((Number(raw) / 1e8));
      } catch (err) {
        console.error("Failed to fetch ETH price", err);
      }
    })();
  }, [networkInfo.chainId]);

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

        // 👇—> log the raw data for full inspection
        console.log("Logs:", tokenLogs?.data.data);
        console.log("MessageCount:", count?.data.data);

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

      try {
        // Group logs by token address
        const tokenGroups: Record<string, logs[]> = {};
        if (Array.isArray(logs)) {
          logs.forEach((log) => {
            const tokenAddress = log.tokenAddress;
            if (!tokenGroups[tokenAddress]) {
              tokenGroups[tokenAddress] = [];
            }
            tokenGroups[tokenAddress].push(log);
          });
        }

        // Create message count map for easy lookup
        const messageCountMap: Record<string, number> = {};
        if (Array.isArray(msgCount)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          msgCount.forEach((item: any) => {
            messageCountMap[item.groupId] = item.messageCount || 0;
          });
        }

        // Get all unique token addresses from both logs and message count
        const allTokenAddresses = new Set([
          ...Object.keys(tokenGroups),
          ...Object.keys(messageCountMap),
        ]);

        // Early return if no tokens available
        if (allTokenAddresses.size === 0) {
          setTrendingData([]);
          setLoading(false);
          return;
        }

        // Get platform total volume threshold (4% of total volume)

        const metrics = await getPureMetrics(networkInfo.chainId);
        const mainValue =
          metrics[0] !== undefined ? Number(metrics[0]) / 1e18 : 0;
        const usdValue = mainValue * ethPriceUSD;
        const volumeThreshold = 0.04 * usdValue; // 4% of total volume

        // Process each token individually
        const tokenPromises = Array.from(allTokenAddresses).map(
          async (tokenAddress) => {
            try {
              const tokenLogs = tokenGroups[tokenAddress] || [];

              // Get token metadata first
              let token: TokenMetadata;
              if (tokenLogs.length > 0) {
                token = tokenLogs[0].token;
              } else {
                const res = await base.get("token", {
                  params: { tokenAddress },
                });
                const all: TokenMetadata = res.data.data.data;

                token = {
                  name: `${all.name}`,
                  symbol: `${all.symbol}`,
                  tokenAddress,
                  tokenCreator: "",
                  tokenImageId: all.tokenImageId,
                  tokenVersion: all.tokenVersion,
                  image: all.image,
                };
              }

              // Get contract data based on token version
              const version = token.tokenVersion || "token_v1";
              let info, rawAmt;

              if (version === "token_v2") {
                // Use v2 functions
                info = await getPureInfoV2DataRaw(networkInfo.chainId, tokenAddress);
                rawAmt = await getPureV2AmountOutMarketCap(networkInfo.chainId, tokenAddress);
              } else {
                // Default to v1
                info = await getPureInfoDataRaw(networkInfo.chainId, tokenAddress);
                rawAmt = await getPureAmountOutMarketCap(networkInfo.chainId, tokenAddress);
              }

              // Calculate market cap
              let marketCap = 0;
              if (Array.isArray(info)) {
                const supply = Number(info[6]);
                const pricePerToken = rawAmt
                  ? Number(rawAmt.toString()) / 1e18
                  : 0;
                marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;
              }

              // Calculate volume for this token
              const volumeEth = tokenLogs.reduce(
                (sum, tx) => sum + parseFloat(tx.ethAmount),
                0
              );
              const volume = volumeEth * ethPriceUSD;

              // Calculate price change for this token
              let priceChange = 0;
              if (tokenLogs.length > 0) {
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
              const holders = await getHoldersFromMoralis(tokenAddress, networkInfo.chainId);

              // Get message count for this token
              const messageCount = messageCountMap[tokenAddress] || 0;

              // Check all 4 criteria
              const criteria = {
                volumeThreshold: volume >= volumeThreshold,
                highGain: priceChange >= 100,
                highLoss: priceChange <= -90,
                messageCount: messageCount >= 50,
              };

              // Count how many criteria are met
              const criteriaCount =
                Object.values(criteria).filter(Boolean).length;

              return {
                token,
                marketCap,
                volume,
                priceChange,
                holders,
                messageCount,
                criteria,
                criteriaCount,
              };
            } catch (e) {
              console.error(
                `Error fetching data for token ${tokenAddress}:`,
                e
              );

              // Get token metadata for error case
              const tokenLogs = tokenGroups[tokenAddress] || [];

              let token: TokenMetadata;
              if (tokenLogs.length > 0) {
                token = tokenLogs[0].token;
              } else {
                token = {
                  name: `Token ${tokenAddress.slice(0, 6)}`,
                  symbol: `T${tokenAddress.slice(-4)}`,
                  tokenAddress,
                  tokenCreator: "",
                };
              }

              return {
                token,
                marketCap: 0,
                volume: 0,
                priceChange: 0,
                holders: 0,
                messageCount: messageCountMap[tokenAddress] || 0,
                criteria: {
                  volumeThreshold: false,
                  highGain: false,
                  highLoss: false,
                  messageCount: (messageCountMap[tokenAddress] || 0) >= 3,
                },
                criteriaCount:
                  (messageCountMap[tokenAddress] || 0) >= 3 ? 1 : 0,
              };
            }
          }
        );

        // Wait for all token data to be processed
        const processedTokens = await Promise.all(tokenPromises);

        // Filter tokens that meet at least 1 criteria
        const trendingTokens = processedTokens.filter(
          (token) => token.criteriaCount > 0
        );

        // Sort by criteria count (descending), then by volume (descending) for ties
        const rankedTokens = trendingTokens.sort((a, b) => {
          // First, sort by criteria count (higher is better)
          if (b.criteriaCount !== a.criteriaCount) {
            return b.criteriaCount - a.criteriaCount;
          }
          // If criteria count is the same, sort by volume (higher is better)
          return b.volume - a.volume;
        });

        // Log the ranking for debugging
        rankedTokens.forEach((token, index) => {
          console.log(
            `#${index + 1} ${token.token.symbol} (${token.token.tokenAddress
            }):`,
            `Criteria: ${token.criteriaCount}/4`,
            `[Vol≥4%: ${token.criteria.volumeThreshold ? "✓" : "✗"},`,
            `Gain≥100%: ${token.criteria.highGain ? "✓" : "✗"},`,
            `Loss≤-90%: ${token.criteria.highLoss ? "✓" : "✗"},`,
            `Msg≥3: ${token.criteria.messageCount ? "✓" : "✗"}]`,
            `Volume: $${token.volume.toFixed(2)},`,
            `Messages: ${token.messageCount}`
          );
        });

        // Take top 10 and update state
        setTrendingData(rankedTokens.slice(0, 10));
        setLoading(false);
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
    const formattedNumber = Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    return `${value >= 0 ? "+" : "-"}${formattedNumber}%`;
  };

  return (
    <section id="trending-tokens" className="pt-10">
      <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 mt-10">
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
                className={`px-3 py-1 rounded-full transition-colors ${range === selectedRange
                    ? "bg-[#1D223E] text-white"
                    : "text-gray-400 dark:hover:text-white hover:text-black"
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
                            {data.token.tokenImageId &&
                              data.token.image?.path ? (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL}${data.token.image.path
                                  }`}
                                alt={data.token.name}
                                className="w-10 h-10 rounded-xl"
                                crossOrigin="anonymous"
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
                        <td className="p-3">
                          {formatCurrency(data.marketCap)}
                        </td>
                        <td
                          className={`p-3 font-semibold ${data.priceChange < 0
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
      </div>
    </section>
  );
};

export default TrendingTokens;
