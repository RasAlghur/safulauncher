// safu-dapp/src/hooks/useTrendingTokens.ts
import { useEffect, useState } from "react";
import { base } from "../lib/api";
import { pureInfoDataRaw, pureAmountOutMarketCap } from "../web3/readContracts";
import type { TokenMetadata } from "../pages/Tokens.tsx";

export interface TrendingTokenData {
  token: TokenMetadata;
  marketCap: number;
  volume: number;
  priceChange: number;
  holders: number;
}

export type TimeRange = "1h" | "6h" | "24h" | "7d";

function getTimeRangeMs(range: TimeRange): number {
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
}

export function useTrendingTokens(
  tokens: TokenMetadata[],
  ethPriceUSD: number,
  selectedRange: TimeRange = "24h"
): TrendingTokenData[] {
  const [trendingData, setTrendingData] = useState<TrendingTokenData[]>([]);

  useEffect(() => {
    if (tokens.length === 0 || ethPriceUSD === 0) return;

    async function fetchTrendingData() {
      const sinceTime = getTimeRangeMs(selectedRange);
      const trendingTokens: TrendingTokenData[] = [];

      await Promise.all(
        tokens.map(async (token) => {
          try {
            let marketCap = 0;

            const info = await pureInfoDataRaw(token.tokenAddress);
            if (Array.isArray(info)) {
              const supply = Number(info[7]);
              const rawAmt = await pureAmountOutMarketCap(token.tokenAddress);
              const pricePerToken = rawAmt
                ? Number(rawAmt.toString()) / 1e18
                : 0;
              marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;
            }

            const res = await base.get(`transaction/${token.tokenAddress}`);
            const logs = res.data?.data || [];

            if (!Array.isArray(logs) || logs.length === 0) {
              trendingTokens.push({
                token,
                marketCap,
                volume: 0,
                priceChange: 0,
                holders: 0,
              });
              return;
            }

            const windowLogs = logs
              .filter((tx) => new Date(tx.timestamp).getTime() >= sinceTime)
              .sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );

            const volumeEth = windowLogs.reduce(
              (sum, tx) => sum + parseFloat(tx.ethAmount),
              0
            );
            const volume = volumeEth * ethPriceUSD;

            let priceChange = 0;
            if (windowLogs.length > 0 && marketCap > 0) {
              const firstTx = windowLogs[0];
              const oldMC = parseFloat(firstTx.oldMarketCap);
              if (oldMC > 0) {
                priceChange = ((marketCap - oldMC) / oldMC) * 100;
              }
            }

            const balanceMap: Record<string, number> = {};
            logs.forEach((tx) => {
              const amt = parseFloat(tx.tokenAmount);
              const w = tx.wallet.toLowerCase();
              if (!balanceMap[w]) balanceMap[w] = 0;
              balanceMap[w] += tx.type === "buy" ? amt : -amt;
            });

            const holders = Object.values(balanceMap).filter(
              (net) => net > 0
            ).length;

            trendingTokens.push({
              token,
              marketCap,
              volume,
              priceChange,
              holders,
            });
          } catch (e) {
            console.error(
              `Error in trending hook for ${token.tokenAddress}:`,
              e
            );
            trendingTokens.push({
              token,
              marketCap: 0,
              volume: 0,
              priceChange: 0,
              holders: 0,
            });
          }
        })
      );

      const sorted = trendingTokens
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);
      setTrendingData(sorted);
    }

    fetchTrendingData();
  }, [tokens, ethPriceUSD, selectedRange]);

  return trendingData;
}
