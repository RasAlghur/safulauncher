// safu-dapp/src/pages/Tokens.tsx
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import {
  pureInfoDataRaw,
  pureGetLatestETHPrice,
  pureAmountOutMarketCap,
} from "../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../web3/config";
import Navbar from "../components/launchintro/Navbar";
import Footer from "../components/generalcomponents/Footer";
import DustParticles from "../components/generalcomponents/DustParticles";

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

/**
 * Description placeholder
 *
 * @export
 * @returns {*}
 */
export default function Tokens() {
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [curveProgressMap, setCurveProgressMap] = useState<
    Record<string, number>
  >({});
  const [marketCapMap, setMarketCapMap] = useState<Record<string, number>>({});
  const [volume24hMap, setVolume24hMap] = useState<Record<string, number>>({});
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);

  // Filter & sort state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchField, setSearchField] = useState<
    "all" | "address" | "creator" | "name"
  >("all");
  const [sortField, setSortField] = useState<
    "volume" | "createdAt" | "progress"
  >("volume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const API = import.meta.env.VITE_API_BASE_URL;

  // Fetch list of tokens
  useEffect(() => {
    fetch(`${API}/api/tokens`)
      .then((res) => res.json())
      .then((data: TokenMetadata[]) => setTokens(data))
      .catch(console.error);
  }, []);

  // Fetch on-chain and API data for each token when list updates
  useEffect(() => {
    if (tokens.length === 0) return;

    async function fetchTokenMetrics() {
      // Get ETH price
      try {
        const raw = await pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!);
        const price = (typeof raw === "number" ? raw : Number(raw)) / 1e8;
        setEthPriceUSD(price);
      } catch {
        console.error("Failed to fetch ETH price");
      }

      const newCurve: Record<string, number> = {};
      const newMarketCap: Record<string, number> = {};
      const newVolume: Record<string, number> = {};
      const now = Date.now();
      const since24h = now - 24 * 60 * 60 * 1000;

      await Promise.all(
        tokens.map(async (token) => {
          try {
            // Fetch bonding curve data
            const info = await pureInfoDataRaw(token.tokenAddress);
            if (Array.isArray(info)) {
              const supply = Number(info[7]);
              const sold = Number(info[10]);
              const percent = (sold / (0.75 * supply)) * 100;
              newCurve[token.tokenAddress] = Math.min(
                Math.max(percent, 0),
                100
              );

              // Price per token in ETH
              const rawAmt = await pureAmountOutMarketCap(token.tokenAddress);
              const pricePerToken = rawAmt
                ? Number(rawAmt.toString()) / 1e18
                : 0;
              // Market cap USD
              newMarketCap[token.tokenAddress] =
                pricePerToken * (supply / 1e18) * ethPriceUSD;
            }

            // Fetch transaction logs
            const res = await fetch(
              `${API}/api/transactions/${token.tokenAddress}`
            );
            const logs: { ethAmount: string; timestamp: string }[] =
              await res.json();
            const volEth = logs
              .filter((tx) => new Date(tx.timestamp).getTime() >= since24h)
              .reduce((sum, tx) => sum + parseFloat(tx.ethAmount), 0);
            newVolume[token.tokenAddress] = volEth * ethPriceUSD;
          } catch (e) {
            console.error(`Error for ${token.tokenAddress}:`, e);
          }
        })
      );

      setCurveProgressMap(newCurve);
      setMarketCapMap(newMarketCap);
      setVolume24hMap(newVolume);
    }

    fetchTokenMetrics();
  }, [tokens, ethPriceUSD]);

  // Filter tokens based on search state
  const filtered = tokens.filter((token) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    switch (searchField) {
      case "address":
        return token.tokenAddress.toLowerCase().includes(term);
      case "creator":
        return token.tokenCreator.toLowerCase().includes(term);
      case "name":
        return (
          token.name.toLowerCase().includes(term) ||
          token.symbol.toLowerCase().includes(term)
        );
      case "all":
      default:
        return [
          token.tokenAddress,
          token.tokenCreator,
          token.name,
          token.symbol,
        ].some((field) => field.toLowerCase().includes(term));
    }
  });

  // Sort filtered tokens
  const sortedTokens = [...filtered].sort((a, b) => {
    let aVal: number | Date = 0;
    let bVal: number | Date = 0;
    if (sortField === "volume") {
      aVal = volume24hMap[a.tokenAddress] || 0;
      bVal = volume24hMap[b.tokenAddress] || 0;
    } else if (sortField === "progress") {
      aVal = curveProgressMap[a.tokenAddress] || 0;
      bVal = curveProgressMap[b.tokenAddress] || 0;
    } else if (sortField === "createdAt") {
      aVal = a.createdAt ? new Date(a.createdAt) : new Date(0);
      bVal = b.createdAt ? new Date(b.createdAt) : new Date(0);
    }
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortOrder === "asc"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }
    return sortOrder === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  return (
    <div className=" text-white">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="pt-40 mb-20 px-4 lg:px-0 relative max-w-6xl mx-auto ">
        {/* Background Glow */}
        <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl z-0 hidden dark:block"></div>

        <h2 className="text-3xl font-bold dark:text-white text-[#01061C] text-center mb-10 z-10 relative">
          Launched Tokens
        </h2>

        <input
          type="text"
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="bg-white text-[#101B3B] placeholder:text-[#6B7280] relative z-20 
             border border-[#E5E7EB] flex justify-center
             px-4 py-2 rounded-full 
             w-full max-w-4xl mx-auto mb-[34px] 
             focus:outline-none focus:ring-2 focus:ring-[#0C8CE0] 
             transition-all duration-200"
        />

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center mb-10 z-10 relative">
          <select
            value={searchField}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSearchField(
                e.target.value as "name" | "address" | "creator" | "all"
              )
            }
            className="dark:bg-[#101B3B] bg-[#141313]/4 dark:text-white text-[#141313]  px-4 py-2 rounded-md border border-white/10 w-full sm:w-[200px]"
          >
            <option value="all">All</option>
            <option value="address">Address</option>
            <option value="creator">Creator</option>
            <option value="name">Name/Symbol</option>
          </select>
          <select
            value={sortField}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSortField(
                e.target.value as "volume" | "createdAt" | "progress"
              )
            }
            className="dark:bg-[#101B3B] bg-[#141313]/4 dark:text-white text-[#141313] px-4 py-2 rounded-md border border-white/10 w-full sm:w-[200px]"
          >
            <option value="volume">24h Volume (USD)</option>
            <option value="progress">Curve Progress</option>
            <option value="createdAt">Date Created</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setSortOrder(e.target.value as "asc" | "desc")
            }
            className="dark:bg-[#101B3B] bg-[#141313]/4 dark:text-white text-[#141313] px-4 py-2 rounded-md border border-white/10 w-full sm:w-[200px]"
          >
            <option value="desc">High → Low / New → Old</option>
            <option value="asc">Low → High / Old → New</option>
          </select>
        </div>

        {/* Token Grid */}
        {sortedTokens.length === 0 ? (
          <p className="text-center text-gray-400">No tokens found.</p>
        ) : (
          <div
            className={`dark:bg-[#0B132B]/40 bg-[#141313]/5 rounded-xl ${
              sortedTokens.length === 1 ? "max-w-2xl mx-auto" : "w-full"
            } px-2 py-5 border border-white/10`}
          >
            <ul
              className={`grid gap-6 z-10 relative ${
                sortedTokens.length === 1 ? "grid-cols-1" : "md:grid-cols-2"
              }`}
            >
              {sortedTokens.map((t, idx) => (
                <div key={idx}>
                  <li className="rounded-xl lg:px-6 px-2 py-5 ">
                    <div className="grid grid-cols-[.7fr_.3fr] justify-between">
                      <Link
                        to={`/trade/${t.tokenAddress}`}
                        className="flex items-start gap-4"
                      >
                        {t.logoFilename && (
                          <img
                            src={`${API}/uploads/${t.logoFilename}`}
                            alt={`${t.symbol} logo`}
                            className="w-14 h-14 rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="dark:text-white text-black text-[20px] font-semibold mb-2.5">
                            {t.name} ({t.symbol})
                          </h3>
                          <p className="text-sm dark:text-gray-400 text-[#147ABD] mb-2.5">
                            Created by:{" "}
                            <span className="text-[#147ABD]">
                              {t.tokenCreator.slice(0, 6)}...
                              {t.tokenCreator.slice(-4)}
                            </span>
                          </p>
                          <p className="dark:text-gray-500 text-[#141313] mb-2.5">
                            Address: {t.tokenAddress.slice(0, 6)}...
                            {t.tokenAddress.slice(-4)}
                          </p>
                          {t.website && (
                            <p className="dark:text-white text-[#141313]/60">
                              Website:{" "}
                              <a
                                href={t.website}
                                className="underline break-all"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t.website}
                              </a>
                            </p>
                          )}

                          <div className="h-[3rem] w-[10rem] lg:w-[16rem] mb-2 overflow-hidden">
                            {t.description && (
                              <p className="mt-1 text-[14px] dark:text-white text-wrap text-[#141313] truncate">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                      {/* Stats */}
                      <div className="flex flex-col space-y-1 items-end">
                        <p className="text-[12px] lg:text-sm dark:text-white text-[#141313]">
                          <strong className="">24h Volume:</strong> $
                          {volume24hMap[t.tokenAddress]?.toFixed(2) ?? "0.00"}
                        </p>
                        <div className="w-fit flex space-x-1 text-[12px] lg:text-sm text-white/80 bg-[#147ABD] text-center rounded-3xl px-2 py-1">
                          <strong className="text-white">MC</strong> $
                          <p className="">
                            {marketCapMap[t.tokenAddress]?.toFixed(2) ?? "0.00"}
                          </p>
                        </div>
                        {/* Progress Bar */}
                      </div>
                    </div>

                    <div className="w-full max-w-[40rem] bg-[#040a1a] h-10 rounded-full overflow-hidden relative mt-5 p-1.5">
                      <p className="absolute inset-0 text-center text-white text-[13px] font-semibold z-10 flex items-center justify-center">
                        {curveProgressMap[t.tokenAddress]?.toFixed(2) ?? "0"}%
                      </p>

                      {(() => {
                        const progress = curveProgressMap[t.tokenAddress] || 0;

                        let gradientClass = "bg-orange-700";

                        if (progress >= 70) {
                          gradientClass =
                            "bg-gradient-to-r from-green-500 to-green-300";
                        } else if (progress >= 40) {
                          gradientClass =
                            "bg-gradient-to-r from-orange-700 via-yellow-400 to-green-500";
                        }

                        return (
                          <div
                            className={`h-full ${
                              progress < 100 ? "rounded-l-full" : "rounded-full"
                            }  relative transition-all duration-500 ease-in-out ${gradientClass}`}
                            style={{ width: `${progress}%` }}
                          >
                            {Array.from({ length: 20 }).map((_, i) => (
                              <div
                                key={i}
                                className="bg-[#040a1a] h-full w-[5px] -skew-x-[24deg] absolute top-0 "
                                style={{ left: `${31 * (i + 1)}px` }}
                              ></div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </li>
                </div>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
