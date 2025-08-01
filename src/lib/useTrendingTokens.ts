import { useEffect, useState } from "react";
import {
  pureInfoDataRaw,
  pureGetLatestETHPrice,
  pureAmountOutMarketCap,
  pureMetrics,
} from "../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../web3/config";
import { base } from "../lib/api";
import type { TokenMetadata } from "../pages/Tokens";

export interface TrendingTokenData {
  token: TokenMetadata;
  marketCap: number;
  volume: number;
  priceChange: number;
  holders: number;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

export const useTrendingTokens = (selectedRange: TimeRange = "24h") => {
  const [trendingData, setTrendingData] = useState<TrendingTokenData[]>([]);
  const [loading, setLoading] = useState(true);

  const getTimeRangeMs = (range: TimeRange): number => {
    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      "1h": 1 * 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };
    return now - ranges[range];
  };

  useEffect(() => {
    let ethPriceUSD = 0;

    const fetchEthPrice = async () => {
      const raw = await pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!);
      return (typeof raw === "number" ? raw : Number(raw)) / 1e8;
    };

    const fetchTrendingData = async () => {
      setLoading(true);
      try {
        ethPriceUSD = await fetchEthPrice();
        const sinceTime = getTimeRangeMs(selectedRange);

        const [Logs] = await Promise.allSettled([
          base.get(`find-by-time`, { params: { timestamp: sinceTime } }),
          base.get(`message-count`, { params: { timestamp: sinceTime } }),
        ]);

        const logs = Logs.status === "fulfilled" ? Logs.value.data.data : [];

        const grouped: Record<string, typeof logs> = {};
        logs.forEach((tx: { tokenAddress: string | number }) => {
          if (!grouped[tx.tokenAddress]) grouped[tx.tokenAddress] = [];
          grouped[tx.tokenAddress].push(tx);
        });

        const tokens = await Promise.all(
          Object.entries(grouped).map(async ([tokenAddress, txs]) => {
            try {
              const info = await pureInfoDataRaw(tokenAddress);
              const rawAmt = await pureAmountOutMarketCap(tokenAddress);

              const supply = Number(info?.[6] ?? 0);
              const pricePerToken = rawAmt
                ? Number(rawAmt.toString()) / 1e18
                : 0;
              const marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;

              const volume =
                txs.reduce(
                  (acc: number, tx: { ethAmount: string }) =>
                    acc + parseFloat(tx.ethAmount),
                  0
                ) * ethPriceUSD;

              let priceChange = 0;
              const sorted = [...txs].sort(
                (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
              );
              const oldMarketCap = parseFloat(sorted[0].oldMarketCap || "0");
              if (oldMarketCap > 0) {
                priceChange = ((marketCap - oldMarketCap) / oldMarketCap) * 100;
              }

              const balanceMap: Record<string, number> = {};
              txs.forEach(
                (tx: { wallet: string; tokenAmount: string; type: string }) => {
                  const w = tx.wallet.toLowerCase();
                  const amt = parseFloat(tx.tokenAmount);
                  balanceMap[w] =
                    (balanceMap[w] ?? 0) + (tx.type === "buy" ? amt : -amt);
                }
              );
              const holders = Object.values(balanceMap).filter(
                (v) => v > 0
              ).length;

              return {
                token: txs[0].token,
                marketCap,
                volume,
                priceChange,
                holders,
              };
            } catch {
              return {
                token: txs[0].token,
                marketCap: 0,
                volume: 0,
                priceChange: 0,
                holders: 0,
              };
            }
          })
        );

        const mainValue = pureMetrics[0] ? Number(pureMetrics[0]) / 1e18 : 0;
        const usdValue = mainValue * ethPriceUSD;
        const volumeCrit = 0.04 * usdValue;

        const filtered = tokens.filter(
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
        const tier2 = filtered.filter((t) => !tier1.includes(t));

        const ranked = [
          ...tier1.sort((a, b) => b.volume - a.volume),
          ...tier2.sort((a, b) => b.volume - a.volume),
        ].slice(0, 10);

        setTrendingData(ranked);
      } catch (error) {
        console.error("Error loading trending tokens:", error);
        setTrendingData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, [selectedRange]);

  return { trendingData, loading };
};
