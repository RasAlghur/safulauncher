/* eslint-disable @typescript-eslint/no-explicit-any */
// safu-dapp/src/pages/Tokens.tsx
import axios from "axios";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import DustParticles from "../components/generalcomponents/DustParticles";
import Footer from "../components/launchintro/Footer";
import Navbar from "../components/launchintro/Navbar";
import { base } from "../lib/api";
import { ETH_USDT_PRICE_FEED } from "../web3/config";
import {
  pureAmountOutMarketCap,
  pureV2AmountOutMarketCap,
  pureGetLatestETHPrice,
  pureInfoDataRaw,
  pureInfoV2DataRaw,
  listingMilestone,
} from "../web3/readContracts";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { BsChevronDown } from "react-icons/bs";
import { FaTelegram } from "react-icons/fa6";
import { socket } from "../lib/socket";
import { useTrendingTokens } from "../lib/useTrendingTokens";

const gradientSteps = [
  { threshold: 9, color: "#dc2626" }, // Red
  { threshold: 13, color: "#f87171" }, // Light Red
  { threshold: 20, color: "#f97316" }, // Orange
  { threshold: 28, color: "#fb923c" }, // Another Orange
  { threshold: 38, color: "#60a5fa" }, // Light Blue
  { threshold: 49, color: "#3b82f6" }, // Darker Blue
  { threshold: 65, color: "#eab308" }, // Lemon
  { threshold: 73, color: "#86efac" }, // Light Green
  { threshold: 85, color: "#22c55e" }, // Medium Green
  { threshold: 94, color: "#16a34a" }, // Deeper Green
  { threshold: 100, color: "#14532d" }, // Dark Green
];

function getProgressGradient(progress: number): string {
  const activeStops = gradientSteps
    .filter((step) => progress >= step.threshold)
    .map((step) => step.color);

  // Always start with the first color, even if progress is 0
  if (activeStops.length === 0) {
    activeStops.push(gradientSteps[0].color);
  }

  return `linear-gradient(to right, ${activeStops.join(", ")})`;
}

interface transaction {
  id: string;
  bundleIndex: number;
  createdAt: Date;
  ethAmount: string | number;
  isBundleTransaction: boolean;
  oldMarketCap: number;
  originalTxnHash: string;
  timestamp: Date;
  tokenAddress: string;
  tokenAmount: string | number;
  txnHash: string;
  type: string;
  updatedAt: Date;
  wallet: string;
}
export interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  transactions: transaction[];
  tokenImageId?: string;
  tokenVersion?: string;
  twitter?: string;
  telegram?: string;
  image?: {
    name: string;
    path: string;
  };
  createdAt?: string;
  expiresAt?: string;
}

type searchField = "all" | "address" | "creator" | "name";
/**
 * Description placeholder
 *
 * @export
 * @returns {*}
 */
export default function Tokens() {
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [featuredTokens, setFeaturedTokens] = useState<TokenMetadata[]>([]);
  const [hasSetFeatured, setHasSetFeatured] = useState(false);

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
  const [searchField, setSearchField] = useState<searchField>("all");
  const [sortField, setSortField] = useState<
    "volume" | "Date Created" | "progress" | "bonded"
  >("volume");

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);

  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const orderDropdownRef = useRef<HTMLDivElement>(null);

  const sliderRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = sliderRef.current;
    const scrollAmount = clientWidth * 0.8;

    const newScrollLeft =
      direction === "left"
        ? scrollLeft - scrollAmount
        : scrollLeft + scrollAmount;

    sliderRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });

    // Reset after last item
    if (
      direction === "right" &&
      scrollLeft + clientWidth >= scrollWidth - 10 // small buffer
    ) {
      setTimeout(() => {
        sliderRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      }, 800); // slight delay before reset
    }
  };

  // Autoplay effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) scroll("right");
    }, 4000); // autoplay every 4s

    return () => clearInterval(interval);
  }, [isHovered]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchDropdownOpen &&
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setSearchDropdownOpen(false);
      }
      if (
        sortDropdownOpen &&
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
      if (
        orderDropdownOpen &&
        orderDropdownRef.current &&
        !orderDropdownRef.current.contains(event.target as Node)
      ) {
        setOrderDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchDropdownOpen, sortDropdownOpen, orderDropdownOpen]);

  const navigate = useNavigate();

  // Fetch list of tokens
  const fetchTokenList = useCallback(
    async (pageNum = 1, query = "", searchTerm = "all", append = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const withRetry = async (retries = 3, delay = 1000) => {
        let lastError;
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const res = await base.get(
              `tokens?include=image&include=transaction&search=${query}&searchTerm=${searchTerm}&page=${pageNum}`,
              { signal: controller.signal }
            );

            console.log("res", res);
            return res;
          } catch (err) {
            lastError = err;

            // Cancelled manually — do not retry
            if (axios.isCancel(err)) {
              throw err;
            }

            if (attempt < retries) {
              await new Promise((res) => setTimeout(res, delay));
            }
          }
        }
        throw lastError;
      };

      try {
        setIsLoadingTokens(true);
        const res = await withRetry();
        const apiData = res.data.data;

        setHasNext(apiData.hasNextPage);
        setPage(pageNum);
        setTokens((prev) => {
          const newTokens = append ? [...prev, ...apiData.data] : apiData.data;

          return newTokens;
        });
      } catch (error) {
        if (
          axios.isCancel(error) ||
          (typeof error === "object" &&
            error !== null &&
            "name" in error &&
            (error as { name?: string }).name === "CanceledError")
        ) {
          // Request canceled — do nothing
        } else {
          console.error("API Error after retries:", error);
        }
      } finally {
        setIsLoadingTokens(false);
      }
    },
    []
  );

  const debouncedFetch = useMemo(
    () =>
      debounce((query: string, searchTerm: searchField) => {
        fetchTokenList(1, query, searchTerm, false);
      }, 300),
    [fetchTokenList]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    inputRef.current?.focus();
    debouncedFetch(value, searchField);
  };

  const searchChange = (field: searchField) => {
    setSearchField(field);
    setSearchDropdownOpen(false);
    debouncedFetch(searchTerm, field);
  };

  // Initial fetch or search
  useEffect(() => {
    fetchTokenList(1, searchTerm, searchField, false);
    // Reset page and hasNext on new search
    setPage(1);
    setHasNext(true);
  }, [fetchTokenList, searchField, searchTerm]);

  useEffect(() => {
    if (!hasSetFeatured && tokens.length > 0) {
      setFeaturedTokens(tokens.slice(0, 10));
      setHasSetFeatured(true);
    }
  }, [tokens, hasSetFeatured]);

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
            const isV2 = token.tokenVersion === "token_v2";

            // Fetch bonding curve data
            const info = isV2
              ? await pureInfoV2DataRaw(token.tokenAddress)
              : await pureInfoDataRaw(token.tokenAddress);
            if (Array.isArray(info)) {
              const supply = Number(info[6]);
              const sold = Number(info[8]);
              const percent = isV2
                ? (sold / ((Number(listingMilestone) / 1e2) * supply)) * 100
                : (sold / (0.75 * supply)) * 100;
              newCurve[token.tokenAddress] = Math.min(
                Math.max(percent, 0),
                100
              );

              const rawAmt = isV2
                ? await pureV2AmountOutMarketCap(token.tokenAddress)
                : await pureAmountOutMarketCap(token.tokenAddress);

              // Price per token in ETH
              const pricePerToken = rawAmt
                ? Number(rawAmt.toString()) / 1e18
                : 0;
              // Market cap USD
              newMarketCap[token.tokenAddress] =
                pricePerToken * (supply / 1e18) * ethPriceUSD;
            }

            // Fetch transaction logs
            const logs = token.transactions;

            const volEth = logs
              .filter((tx) => new Date(tx.timestamp).getTime() >= since24h)
              .reduce((sum, tx) => sum + parseFloat(String(tx.ethAmount)), 0);
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

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (
        container &&
        hasNext &&
        container.scrollTop + container.clientHeight >=
          container.scrollHeight - 100
      ) {
        fetchTokenList(page + 1, searchTerm, searchField, true);
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [fetchTokenList, hasNext, page, searchField, searchTerm]);

  // Sort filtered tokens
  const filteredTokens =
    sortField === "bonded"
      ? tokens.filter(
          (t) => Math.round(curveProgressMap[t.tokenAddress] ?? 0) >= 100
        )
      : tokens;

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    let aVal: number | Date = 0;
    let bVal: number | Date = 0;

    if (sortField === "volume") {
      aVal = volume24hMap[a.tokenAddress] || 0;
      bVal = volume24hMap[b.tokenAddress] || 0;
    } else if (sortField === "progress") {
      aVal = curveProgressMap[a.tokenAddress] || 0;
      bVal = curveProgressMap[b.tokenAddress] || 0;
    } else if (sortField === "Date Created") {
      aVal = a.createdAt ? new Date(a.createdAt) : new Date(0);
      bVal = b.createdAt ? new Date(b.createdAt) : new Date(0);
    } else if (sortField === "bonded") {
      // Optional: add sort logic among bonded tokens
      aVal = volume24hMap[a.tokenAddress] || 0; // or curveProgressMap, etc.
      bVal = volume24hMap[b.tokenAddress] || 0;
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

  // socket to listen to new deloplyed token
  useEffect(() => {
    if (!socket.connected) {
      console.log("socket connected");
      socket.connect();
    }

    const handleReceiveNewDeployment = (data: TokenMetadata) => {
      console.log("called", data);
      if (tokens.some((t) => t.tokenAddress === data.tokenAddress)) return;
      setFeaturedTokens((prev) => {
        const newTokens = [data, ...prev];
        return newTokens;
      });

      setTokens((prev) => {
        const newTokens = [data, ...prev];
        return newTokens;
      });
    };

    socket.on("token_deployment", handleReceiveNewDeployment);

    return () => {
      socket.off("token_deployment", handleReceiveNewDeployment);
      socket.disconnect();
    };
  }, [tokens]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle click events to prevent nested anchor navigation
  // const handleWebsiteClick = (e: React.MouseEvent, url: string) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   window.open(url, "_blank", "noopener,noreferrer");
  // };

  console.log("sortedTokens", sortedTokens);

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

  const { trendingData } = useTrendingTokens("7d");

  console.log("sortedTokens", sortedTokens);
  return (
    <div className="mountain ">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      <div className=" mb-20 px-4 lg:px-0 relative ">
        {isLoadingTokens || isLoadingMetrics || featuredTokens.length === 0 ? (
          <section className="fixed top-0 left-0 right-0 z-30 dark:bg-transparent bg-transparent backdrop-blur-md">
            <div className="pt-20 max-w-6xl mx-auto">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-xl font-bold text-[#01061C] dark:text-white">
                  Featured Tokens
                </h2>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                  <div className="h-8 w-8 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
                </div>
              </div>

              <div className="relative rounded-xl">
                <div className="flex overflow-x-auto no-scrollbar px-4 py-5 gap-4">
                  {[...Array(5)].map((_, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-[260px] sm:w-[300px] bg-white/90 dark:bg-[#101B3B]/80 border border-white/10 rounded-xl p-4 animate-pulse space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-300 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="h-6 w-16 rounded-full bg-gray-400 dark:bg-gray-600" />
                        <div className="h-4 w-20 rounded bg-gray-300 dark:bg-gray-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="fixed top-0 left-0 right-0 z-40 dark:bg-transparent bg-transparent backdrop-blur-md ">
            <div className="pt-20 max-w-6xl mx-auto">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-xl font-bold text-[#01061C] dark:text-white">
                  Featured Tokens
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded"
                    onClick={() => scroll("left")}
                  >
                    <FaChevronLeft className="text-[#141313] dark:text-white text-sm" />
                  </button>
                  <button
                    className="p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded"
                    onClick={() => scroll("right")}
                  >
                    <FaChevronRight className="text-[#141313] dark:text-white text-sm" />
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl">
                <div
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  ref={sliderRef}
                  className="flex overflow-x-auto no-scrollbar scroll-smooth px-4 py-2 gap-4 touch-pan-x cursor-grab active:cursor-grabbing relative z-10"
                >
                  {trendingData.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-[260px] sm:w-[300px] bg-white/90 dark:bg-[#101B3B]/80 border border-white/10 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 relative z-10"
                    >
                      <Link
                        to={`/trade/${t.token.tokenAddress}`}
                        className="flex flex-col"
                      >
                        <div className="flex items-center gap-3">
                          {t.token.tokenImageId && (
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL}${
                                t.token.image?.path
                              }`}
                              alt={`${t.token.symbol} logo`}
                              className="w-10 h-10 rounded-md"
                              crossOrigin=""
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-[#01061C] dark:text-white truncate">
                              {t.token.name} ({t.token.symbol})
                            </h3>
                            <p className="text-xs text-[#147ABD] truncate">
                              by {t.token.tokenCreator.slice(0, 6)}...
                              {t.token.tokenCreator.slice(-4)}
                            </p>
                            <p className="text-sm md:text-base dark:text-[#B6B6B6] text-[#141313] mb-1">
                              Address: {t.token.tokenAddress.slice(0, 6)}...
                              {t.token.tokenAddress.slice(-4)}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-white">
                          <div className="bg-[#064C7A] text-xs px-2 py-1 rounded-full">
                            $
                            {marketCapMap[t.token.tokenAddress]?.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) ?? "0.00"}
                          </div>
                          <div className="text-xs text-right dark:text-gray-400 text-black/80">
                            24h Vol:{" "}
                            {isLoadingMetrics ? (
                              <span className="">Loading...</span>
                            ) : (
                              `$${
                                volume24hMap[
                                  t.token.tokenAddress
                                ]?.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) ?? "0.00"
                              }`
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Background Glow */}
        <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl z-0 hidden dark:block"></div>

        <div className="max-w-6xl mx-auto pt-[14.3rem]">
          <h2 className="text-3xl font-bold dark:text-white text-[#01061C] text-center my-10 z-10 relative">
            Launched Tokens
            {isLoadingMetrics && (
              <span className="ml-2 text-sm text-gray-500">
                (Loading metrics...)
              </span>
            )}
          </h2>
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchTerm}
            ref={inputRef}
            onChange={handleChange}
            className="bg-white text-[#101B3B] placeholder:text-[#6B7280] relative z-20
               border border-[#E5E7EB] flex justify-center
               px-4 py-2 rounded-full
               w-full max-w-4xl mx-auto mb-[34px]
               focus:outline-none focus:ring-2 focus:ring-[#0C8CE0]
               transition-all duration-200"
          />
          {/* Controls */}
          <div className="flex flex-wrap gap-4 justify-center mb-10 z-20 relative">
            {/* Search Field Dropdown */}
            <div className="relative w-full sm:w-[250px] hidden">
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
                <div className="absolute top-full mt-2 z-50 w-full dark:bg-[#1a2a7f] bg-white dark:text-white text-black rounded-xl shadow-md">
                  {(["all", "address", "creator", "name"] as searchField[]).map(
                    (field) => (
                      <div
                        key={field}
                        onClick={() => searchChange(field)}
                        className={`px-4 py-2 cursor-pointer hover:bg-Primary capitalize ${
                          field === "all"
                            ? "rounded-t-xl"
                            : field === "name"
                            ? "rounded-b-xl"
                            : ""
                        }`}
                      >
                        {field === "name" ? "Name/Symbol" : field}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            {/* Sort Field Dropdown */}
            <div ref={sortDropdownRef} className="relative w-full sm:w-[250px]">
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
                    { value: "Volume", label: "24h Volume (USD)" },
                    { value: "progress", label: "Curve Progress" },
                    { value: "Date Created", label: "Date Created" },
                    { value: "bonded", label: "Bonded" },
                  ].map(({ value, label }, idx, arr) => (
                    <div
                      key={value}
                      onClick={() => {
                        setSortField(value as any);
                        setSortDropdownOpen(false);
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-[#147ABD]/20 ${
                        idx === 0
                          ? "rounded-t-xl"
                          : idx === arr.length - 1
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
            <div
              ref={orderDropdownRef}
              className="relative w-full sm:w-[250px]"
            >
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
          {/* Token Grid */}
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
              ref={containerRef}
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
                    <li
                      onClick={() => navigate(`/trade/${t.tokenAddress}`)}
                      className="rounded-xl lg:px-6 px-2 py-5 cursor-pointer"
                    >
                      <div className="grid grid-cols-[.7fr_.3fr] justify-between">
                        <div className="flex items-start gap-4 ">
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
                        </div>
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
                                volume24hMap[t.tokenAddress]?.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) ?? "0.00"
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
                                {marketCapMap[t.tokenAddress]?.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                ) ?? "0.00"}
                              </p>
                            )}
                          </div>

                          {/* Social Links */}
                          <div className="flex justify-end items-center gap-2 mt-1">
                            {t.twitter && (
                              <a
                                href={t.twitter}
                                className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {/* Twitter SVG */}
                                <FaXTwitter className="text-black dark:text-white text-[15px]" />
                              </a>
                            )}
                            {t.telegram && (
                              <a
                                href={t.telegram}
                                className=""
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FaTelegram className="text-black dark:text-white text-[32px]" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                    {/* Progress Bar */}
                    <div className="w-full max-w-[40rem] bg-[#031E51]/95 h-[30px] border-2 border-[#031E51] rounded-full overflow-hidden relative mt-auto p-1.5">
                      {/* Percentage Label */}
                      <p className="absolute right-4 text-white text-[13px] font-semibold z-50 flex items-center">
                        {isLoadingMetrics
                          ? "Loading..."
                          : `${
                              curveProgressMap[t.tokenAddress]?.toFixed(2) ??
                              "0"
                            }%`}
                      </p>

                      {!isLoadingMetrics &&
                        Array.from({ length: 50 }).map((_, i) => {
                          if (i === 0) return null; // 👈 Skip the first stripe
                          const stripeWidth = 4;
                          const spacing = 100 / 50;
                          return (
                            <div
                              key={i}
                              className="bg-[#031E51] h-full absolute top-0 -skew-x-[24deg] z-40"
                              style={{
                                width: `${stripeWidth}px`,
                                left: `calc(${(i * spacing).toFixed(2)}% - ${
                                  stripeWidth / 2
                                }px)`,
                              }}
                            />
                          );
                        })}

                      {/* Progress Fill */}
                      {(() => {
                        const progress = curveProgressMap[t.tokenAddress] || 0;
                        const gradientStyle: React.CSSProperties = {};

                        if (!isLoadingMetrics) {
                          gradientStyle.backgroundImage =
                            getProgressGradient(progress);
                        }

                        return (
                          <div
                            className={`h-full absolute top-0 left-0 z-10 transition-all duration-500 ease-in-out ${
                              progress < 100 ? "rounded-l-full" : "rounded-full"
                            } ${isLoadingMetrics ? "bg-gray-600" : ""}`}
                            style={{
                              width: `${isLoadingMetrics ? 0 : progress}%`,
                              ...gradientStyle,
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
