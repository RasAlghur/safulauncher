/* eslint-disable @typescript-eslint/no-explicit-any */
// safu-dapp/src/pages/Tokens.tsx
import { useEffect, useState, useRef } from "react";
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
import { base } from "../lib/api";
import { BsChevronDown } from "react-icons/bs";
import Advertisement from "../components/generalcomponents/Advertisement";
import { useTrendingTokens } from "../hooks/useTrendingTokens";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

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

  // Loading states
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Filter & sort state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchField, setSearchField] = useState<
    "all" | "address" | "creator" | "name"
  >("all");
  const [sortField, setSortField] = useState<
    "volume" | "createdAt" | "progress"
  >("volume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    const scrollAmount = clientWidth * 0.8;
    sliderRef.current.scrollTo({
      left:
        direction === "left"
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  // const API = import.meta.env.VITE_API_BASE_URL;

  // Fetch list of tokens
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingTokens(true);
        const res = await await base.get("tokens", {
          params: { include: "image" },
        });
        console.log(res.data.data.data);
        setTokens(res.data.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoadingTokens(false);
      }
    })();
  }, []);

  // Fetch on-chain and API data for each token when list updates
  useEffect(() => {
    if (tokens.length === 0) return;

    async function fetchTokenMetrics() {
      setIsLoadingMetrics(true);

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

            const res = await base.get("transactions", {
              params: { tokenAddress: token.tokenAddress },
            });
            const logs: { ethAmount: string; timestamp: string }[] =
              res.data.data.data;

            console.log({ logs });

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
      setIsLoadingMetrics(false);
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

  const trendingData = useTrendingTokens(tokens, ethPriceUSD, "24h");

  // Loading skeleton component
  const TokenSkeleton = () => (
    <div className="rounded-xl lg:px-6 px-2 py-5 animate-pulse">
      <div className="grid grid-cols-[.7fr_.3fr] justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-lg bg-gray-300 dark:bg-gray-700"></div>
          <div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2.5 w-40"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2.5 w-32"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2.5 w-28"></div>
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded w-64"></div>
          </div>
        </div>
        <div className="flex flex-col space-y-1 items-end">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
      <div className="w-full max-w-[40rem] bg-gray-300 dark:bg-gray-700 h-10 rounded-full mt-5"></div>
    </div>
  );

  return (
    <div className="mountain ">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <div className="pt-24 mb-20 px-4 lg:px-0 relative max-w-6xl mx-auto ">
        <Advertisement />
        {/* Background Glow */}
        <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl z-0 hidden dark:block"></div>

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
             w-full max-w-4xl mx-auto my-[34px] 
             focus:outline-none focus:ring-2 focus:ring-[#0C8CE0] 
             transition-all duration-200"
          disabled={isLoadingTokens}
        />

        {/* Trending tokens */}
        <div className="flex justify-between items-center mt-10 mb-6">
          <h2 className="text-2xl lg:text-[30px] font-raleway font-bold text-center dark:text-white text-[#01061C] mb-6">
            Trending Tokens
          </h2>
          {/* Scroll Buttons */}
          <div className="flex items-center gap-2 md:gap-6 lg:gap-[34px]">
            <button
              className="p-2 bg-[#141313]/12 dark:bg-[#101B3B]/70 dark:hover:bg-[#101B3B] rounded-[5px]"
              onClick={() => scroll("left")}
            >
              <FaChevronLeft className="text-[#141313]/70 dark:text-white" />
            </button>
            <button
              className="p-2 bg-[#141313]/12 dark:bg-[#101B3B]/70 dark:hover:bg-[#101B3B] rounded-[5px]"
              onClick={() => scroll("right")}
            >
              <FaChevronRight className="text-[#141313]/70 dark:text-white" />
            </button>
          </div>
        </div>

        <div className="relative rounded-2xl border border-white/10 dark:bg-[#0B132B]/40 bg-[#141313]/5">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto no-scrollbar scroll-smooth px-2 py-4"
          >
            {trendingData.map((t, idx) => (
              <div
                key={idx}
                className="lg:w-[60%] sm:w-[80%] w-full px-6 py-5 flex-shrink-0 flex flex-col"
              >
                <div className="flex items-start justify-between mb-5">
                  <Link
                    to={`/trade/${t.token.tokenAddress}`}
                    className="flex items-start gap-4"
                  >
                    {t.token.tokenImageId && (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}${
                          t.token.image?.path
                        }`}
                        alt={`${t.token.symbol} logo`}
                        className="w-14 h-14 rounded-lg"
                        crossOrigin=""
                      />
                    )}
                    <div className="flex flex-col space-y-[10px]">
                      <h3 className="dark:text-white text-black text-lg lg:text-xl font-semibold">
                        {t.token.name} ({t.token.symbol})
                      </h3>
                      <p className="text-sm md:text-base text-[#147ABD]">
                        Created by: {t.token.tokenCreator.slice(0, 6)}...
                        {t.token.tokenCreator.slice(-4)}
                      </p>
                      <p className="text-sm md:text-base dark:text-[#B6B6B6] text-[#141313]">
                        Address: {t.token.tokenAddress.slice(0, 6)}...
                        {t.token.tokenAddress.slice(-4)}
                      </p>
                      {t.token.description && (
                        <p className="text-sm md:text-base dark:text-white text-black truncate">
                          {t.token.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="mt-4 flex flex-col space-y-2 items-end">
                    <div className="w-fit flex space-x-1 text-[12px] lg:text-sm text-white  bg-[#064C7A] text-center rounded-3xl px-2 py-1 h-fit">
                      MC ${t.marketCap.toFixed(2)}
                    </div>

                    <span className="dark:text-white text-black text-sm">
                      V ${t.volume.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress bar*/}

                <div className="w-full max-w-[40rem] bg-[#031E51] h-[35px] rounded-full overflow-hidden relative mt-auto p-1.5">
                  <p className="absolute right-4 text-white text-[13px] font-semibold z-10 flex items-center justify-end">
                    {isLoadingMetrics
                      ? "Loading..."
                      : `${
                          curveProgressMap[t.token.tokenAddress]?.toFixed(2) ??
                          "0"
                        }%`}
                  </p>

                  {(() => {
                    const progress =
                      curveProgressMap[t.token.tokenAddress] || 0;

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
                        } relative transition-all duration-500 ease-in-out ${
                          isLoadingMetrics ? "bg-gray-600" : gradientClass
                        }`}
                        style={{
                          width: `${isLoadingMetrics ? 0 : progress}%`,
                        }}
                      >
                        {!isLoadingMetrics &&
                          Array.from({ length: 20 }).map((_, i) => (
                            <div
                              key={i}
                              className="bg-[#031E51] h-full w-[5px] -skew-x-[24deg] absolute top-0 "
                              style={{ left: `${31 * (i + 1)}px` }}
                            ></div>
                          ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-3xl font-bold dark:text-white text-[#01061C] text-left my-10 z-10 relative">
          Launched Tokens
          {isLoadingMetrics && (
            <span className="ml-2 text-sm text-gray-500">
              (Loading metrics...)
            </span>
          )}
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-10 z-20 relative">
          {/* Search Field Dropdown */}
          <div className="relative w-full sm:w-[250px]">
            <div
              onClick={() => setSearchDropdownOpen((prev) => !prev)}
              className="dark:bg-[#d5f2f80a] bg-white dark:text-white text-black px-4 py-2 rounded-md cursor-pointer flex justify-between items-center border border-white/10"
            >
              <span className="text-sm capitalize">{searchField}</span>
              <div className="w-8 h-8 rounded-md bg-Primary flex items-center justify-center">
                <BsChevronDown className="text-white text-xl" />
              </div>
            </div>
            {searchDropdownOpen && (
              <div className="absolute top-full mt-2 z-50 w-full search dark:text-white text-black rounded-xl shadow-md">
                {["all", "address", "creator", "name"].map((field) => (
                  <div
                    key={field}
                    onClick={() => {
                      setSearchField(field as any);
                      setSearchDropdownOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-[#147ABD]/20 capitalize ${
                      field === "all"
                        ? "rounded-t-xl"
                        : field === "name"
                        ? "rounded-b-xl"
                        : ""
                    }`}
                  >
                    {field === "name" ? "Name/Symbol" : field}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sort Field Dropdown */}
          <div className="relative w-full sm:w-[250px]">
            <div
              onClick={() => setSortDropdownOpen((prev) => !prev)}
              className="dark:bg-[#d5f2f80a] bg-white dark:text-white text-black px-4 py-2 rounded-md cursor-pointer flex justify-between items-center border border-white/10"
            >
              <span className="text-sm capitalize">{sortField}</span>
              <div className="w-8 h-8 rounded-md bg-Primary flex items-center justify-center">
                <BsChevronDown className="text-white text-xl" />
              </div>
            </div>
            {sortDropdownOpen && (
              <div className="absolute top-full mt-2 z-50 w-full search dark:text-white text-black rounded-xl shadow-md">
                {[
                  { value: "volume", label: "24h Volume (USD)" },
                  { value: "progress", label: "Curve Progress" },
                  { value: "createdAt", label: "Date Created" },
                ].map(({ value, label }) => (
                  <div
                    key={value}
                    onClick={() => {
                      setSortField(value as any);
                      setSortDropdownOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-[#147ABD]/20 ${
                      value === "volume"
                        ? "rounded-t-xl"
                        : value === "createdAt"
                        ? "rounded-b-xl"
                        : ""
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sort Order Dropdown */}
          <div className="relative w-full sm:w-[250px]">
            <div
              onClick={() => setOrderDropdownOpen((prev) => !prev)}
              className="dark:bg-[#d5f2f80a] bg-white dark:text-white text-black px-4 py-2 rounded-md cursor-pointer flex justify-between items-center border border-white/10"
            >
              <span className="text-sm">
                {sortOrder === "desc"
                  ? "High → Low / New → Old"
                  : "Low → High / Old → New"}
              </span>
              <div className="w-8 h-8 rounded-md bg-Primary flex items-center justify-center">
                <BsChevronDown className="text-white text-xl" />
              </div>
            </div>
            {orderDropdownOpen && (
              <div className="absolute top-full mt-2 z-50 w-full search dark:text-white text-black rounded-xl shadow-md">
                <div
                  onClick={() => {
                    setSortOrder("desc");
                    setOrderDropdownOpen(false);
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-[#147ABD]/20 rounded-t-xl"
                >
                  High → Low / New → Old
                </div>
                <div
                  onClick={() => {
                    setSortOrder("asc");
                    setOrderDropdownOpen(false);
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-[#147ABD]/20 rounded-b-xl"
                >
                  Low → High / Old → New
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All Tokens */}
        {isLoadingTokens ? (
          <div className="dark:bg-[#0B132B]/40 bg-[#141313]/5 rounded-xl w-full px-2 py-5 border border-white/10">
            <div className="grid gap-6 z-10 relative md:grid-cols-2">
              {[...Array(4)].map((_, idx) => (
                <TokenSkeleton key={idx} />
              ))}
            </div>
          </div>
        ) : sortedTokens.length === 0 ? (
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
                <div key={idx} className="flex flex-col">
                  <li className="rounded-xl lg:px-6 px-2 py-5 ">
                    <div className="grid grid-cols-[.7fr_.3fr] justify-between">
                      <Link
                        to={`/trade/${t.tokenAddress}`}
                        className="flex items-start gap-4"
                      >
                        {t.tokenImageId && (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}${
                              t.image?.path
                            }`}
                            alt={`${t.symbol} logo`}
                            className="w-14 h-14 rounded-lg"
                            crossOrigin=""
                          />
                        )}
                        <div>
                          <h3 className="dark:text-white text-black text-[20px] font-semibold mb-2.5">
                            {t.name} ({t.symbol})
                          </h3>
                          <p className="text-sm md:text-base dark:text-[#B6B6B6] text-[#147ABD] mb-2.5">
                            Created by:{" "}
                            <span className="text-[#147ABD]">
                              {t.tokenCreator.slice(0, 6)}...
                              {t.tokenCreator.slice(-4)}
                            </span>
                          </p>
                          <p className="text-sm md:text-base dark:text-[#B6B6B6] text-[#141313] mb-2.5">
                            Address: {t.tokenAddress.slice(0, 6)}...
                            {t.tokenAddress.slice(-4)}
                          </p>
                          {t.website && (
                            <p className="text-sm md:text-base dark:text-[#B6B6B6] text-[#141313]/60">
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
                          <strong className="">24h Volume:</strong>
                          {isLoadingMetrics ? (
                            <span className="ml-1 text-gray-500">
                              Loading...
                            </span>
                          ) : (
                            ` $${
                              volume24hMap[t.tokenAddress]?.toFixed(2) ?? "0.00"
                            }`
                          )}
                        </p>
                        <div className="w-fit flex space-x-1 text-[12px] lg:text-sm text-white/80 bg-[#147ABD] text-center rounded-3xl px-2 py-1">
                          <strong className="text-white">MC</strong>
                          {isLoadingMetrics ? (
                            <span className="text-gray-300">Loading...</span>
                          ) : (
                            <p className="">
                              $
                              {marketCapMap[t.tokenAddress]?.toFixed(2) ??
                                "0.00"}
                            </p>
                          )}
                        </div>
                        {/* Progress Bar */}
                      </div>
                    </div>
                  </li>

                  <div className="w-full max-w-[40rem] bg-[#031E51] h-[35px] rounded-full overflow-hidden relative mt-auto p-1.5">
                    <p className="absolute right-4 text-white text-[13px] font-semibold z-10 flex items-center">
                      {isLoadingMetrics
                        ? "Loading..."
                        : `${
                            curveProgressMap[t.tokenAddress]?.toFixed(2) ?? "0"
                          }%`}
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
                          } relative transition-all duration-500 ease-in-out ${
                            isLoadingMetrics ? "bg-gray-600" : gradientClass
                          }`}
                          style={{
                            width: `${isLoadingMetrics ? 0 : progress}%`,
                          }}
                        >
                          {!isLoadingMetrics &&
                            Array.from({ length: 20 }).map((_, i) => (
                              <div
                                key={i}
                                className="bg-[#031E51] h-full w-[5px] -skew-x-[24deg] absolute top-0 "
                                style={{ left: `${31 * (i + 1)}px` }}
                              ></div>
                            ))}
                        </div>
                      );
                    })()}
                  </div>
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
