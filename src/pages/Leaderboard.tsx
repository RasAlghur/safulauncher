import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/launchintro/Navbar";
import Footer from "../components/launchintro/Footer";
import DustParticles from "../components/generalcomponents/DustParticles";
import { getPureGetLatestETHPrice } from "../web3/readContracts";
import { ETH_USDT_PRICE_FEED_ADDRESSES } from "../web3/config";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useApiClient } from "../lib/api";
import { BsChevronDown } from "react-icons/bs";
import { Link } from "react-router-dom";
import CopyButton from "../components/generalcomponents/CopyButton";

const options = ["Volume", "Most Recent Trade"];

interface TxLog {
  tokenAddress: string;
  type: "buy" | "sell";
  ethAmount: string;
  tokenAmount: string;
  timestamp: string;
  txnHash: string;
  wallet: string;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  tokenAddress: string;
  tokenImageId?: string;
  image?: {
    name: string;
    path: string;
  };
}

interface LeaderboardEntry {
  wallet: string;
  volume: number;
  volumeUSD: number;
  lastTokenAddress: string;
  lastPurchaseTs: string;
}

const ITEMS_PER_PAGE = 25;

export default function Leaderboard() {
  const networkInfo = useNetworkEnvironment();
  const base = useApiClient();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tokensMap, setTokensMap] = useState<Record<string, TokenMetadata>>({});
  const [page, setPage] = useState(1);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const orderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
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
  }, [isOpen, orderDropdownOpen]);

  // Utility: retry wrapper
  async function retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 500
  ): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await fn();
      } catch (error) {
        if (
          axios.isCancel(error) ||
          (typeof error === "object" &&
            error !== null &&
            "name" in error &&
            (error as { name?: string }).name === "CanceledError")
        ) {
          throw error;
        }
        attempt++;
        if (attempt >= retries) throw error;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw new Error("Max retry attempts exceeded");
  }

  const priceFeedAddress = ETH_USDT_PRICE_FEED_ADDRESSES[networkInfo.chainId];

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch ETH price with retry
        const raw = await retry(() =>
          getPureGetLatestETHPrice(networkInfo.chainId, priceFeedAddress)
        );
        const price = (typeof raw === "number" ? raw : Number(raw)) / 1e8;
        setEthPriceUSD(price);

        // Fetch token metadata map with retry
        const tokensRes = await retry(() => base.get("tokens?include=image"));
        const tokens: TokenMetadata[] = tokensRes.data.data.data;

        const map: Record<string, TokenMetadata> = {};
        tokens.forEach((t) => {
          map[t.tokenAddress.toLowerCase()] = t;
        });
        setTokensMap(map);

        // Fetch transactions and build leaderboard with retry
        // const txRes = await retry(() => base.get("transactions?limit=100"));
        // // https://api.safulauncher.com/api/transactions?page=2&limit=100
        // const fPage = txRes.data.data.data;
        // console.log("firstPage", fPage);
        // const tPages = txRes.data.data.totalPages
        // console.log("totalPages", tPages);
        // // console.log("txRes", txRes);

        // const allTx: TxLog[] = fPage;


        // Fetch transactions and build leaderboard with retry
        const txRes = await retry(() => base.get("transactions?limit=100"));
        const firstPage = txRes.data.data.data;
        const totalPages = txRes.data.data.totalPages;

        console.log("firstPage", firstPage);
        console.log("totalPages", totalPages);

        let allTx: TxLog[] = [...firstPage]; // Start with first page

        // Fetch remaining pages if totalPages > 1
        if (totalPages > 1) {
          const remainingPagePromises = [];

          for (let page = 2; page <= totalPages; page++) {
            remainingPagePromises.push(
              retry(() => base.get(`transactions?page=${page}&limit=100`))
            );
          }

          // Wait for all remaining pages to complete
          const remainingPagesResponses = await Promise.all(remainingPagePromises);

          // Extract data from each page response and add to allTx
          remainingPagesResponses.forEach((response) => {
            const pageData = response.data.data.data;
            allTx = [...allTx, ...pageData];
          });
        }

        console.log("Total transactions fetched:", allTx.length);


        const walletMap: Record<
          string,
          { volume: number; lastTs: string; lastToken: string }
        > = {};

        allTx.forEach((tx) => {
          if (tx.type !== "buy" && tx.type !== "sell") return;

          const vol = parseFloat(tx.ethAmount);
          const key = tx.wallet.toLowerCase();
          const existing = walletMap[key] || {
            volume: 0,
            lastTs: "",
            lastToken: "",
          };
          existing.volume += vol;

          if (
            !existing.lastTs ||
            new Date(tx.timestamp) > new Date(existing.lastTs)
          ) {
            existing.lastTs = tx.timestamp;
            existing.lastToken = tx.tokenAddress.toLowerCase();
          }
          walletMap[key] = existing;
        });

        const arr = Object.entries(walletMap).map(
          ([wallet, { volume, lastTs, lastToken }]) => ({
            wallet,
            volume,
            volumeUSD: volume * price,
            lastTokenAddress: lastToken,
            lastPurchaseTs: lastTs,
          })
        );

        setEntries(arr);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data:", error);
        setLoading(false);
      }
    }

    loadData();
  }, [networkInfo.chainId, priceFeedAddress, base]);

  // Sorting logic
  const sortedEntries = [...entries].sort((a, b) => {
    if (selected === "Volume") {
      return sortOrder === "desc"
        ? b.volumeUSD - a.volumeUSD
        : a.volumeUSD - b.volumeUSD;
    } else if (selected === "Most Recent Trade") {
      return sortOrder === "desc"
        ? new Date(b.lastPurchaseTs).getTime() -
        new Date(a.lastPurchaseTs).getTime()
        : new Date(a.lastPurchaseTs).getTime() -
        new Date(b.lastPurchaseTs).getTime();
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedEntries.length / ITEMS_PER_PAGE);
  const display = sortedEntries.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  function formatUTC(isoString: string): string {
    const date = new Date(isoString);

    const formattedDate = date.toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return `${formattedDate}, ${formattedTime}`;
  }

  if (loading) {
    return (
      <div className="px-4 relative min-h-screen dark:text-white text-black flex items-center justify-center mountain">
        <Navbar />
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="dark:text-white/70 text-black">
            Loading leaderboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 relative min-h-screen mountain flex flex-col">
      {/* <div className="noise" /> */}
      <Navbar />
      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="w-full  pt-[85px] flex-grow">
        <div className="max-w-5xl mx-auto text-center mb-4">
          <h1 className="lg:text-4xl text-3xl font-bold font-raleway text-[#01061C] dark:text-white">
            Leaderboard
          </h1>
          <p className="dark:text-white/50 mt-[10px] text-[#141313]/50">
            Find the top trades & traders
          </p>
          {ethPriceUSD > 0 && (
            <p className="dark:text-white/40 text-[#141313]/40 text-sm mt-2">
              ETH Price: ${ethPriceUSD.toFixed(2)}
            </p>
          )}
        </div>

        {/* Sort Field Dropdown */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-x-6 mb-6">
            <div
              ref={sortDropdownRef}
              className="mb-[20px] relative w-full sm:w-[200px]"
            >
              <div
                onClick={() => setIsOpen((prev) => !prev)}
                className="dark:bg-[#d5f2f80a] bg-white dark:text-white text-black px-4 py-3 rounded-md cursor-pointer flex justify-between items-center border border-white/10"
              >
                <span className="text-sm capitalize">{selected}</span>
                <div className="w-8 h-8 rounded-md bg-Primary flex items-center justify-center">
                  <BsChevronDown className="text-white text-xl" />
                </div>
              </div>
              {isOpen && (
                <div className="absolute top-full mt-2 z-50 w-full search dark:text-white text-black rounded-xl shadow-md">
                  {options.map((option, idx) => (
                    <div
                      key={option}
                      onClick={() => {
                        setSelected(option);
                        setIsOpen(false);
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-[#147ABD]/20 ${idx === 0
                        ? "rounded-t-xl"
                        : idx === options.length - 1
                          ? "rounded-b-xl"
                          : ""
                        }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Sort Order Dropdown */}
            <div
              ref={orderDropdownRef}
              className="mb-[20px] relative w-full sm:w-[200px]"
            >
              <div
                onClick={() => setOrderDropdownOpen((prev) => !prev)}
                className="dark:bg-[#d5f2f80a] bg-white dark:text-white text-black px-4 py-3 rounded-md cursor-pointer flex justify-between items-center border border-white/10"
              >
                <span className="text-sm">
                  {sortOrder === "desc"
                    ? selected === "Volume"
                      ? "High → Low"
                      : "New → Old"
                    : selected === "Volume"
                      ? "Low → High"
                      : "Old → New"}
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
                    {selected === "Volume" ? "High → Low" : "New → Old"}
                  </div>
                  <div
                    onClick={() => {
                      setSortOrder("asc");
                      setOrderDropdownOpen(false);
                    }}
                    className="px-4 py-2 cursor-pointer hover:bg-[#147ABD]/20 rounded-b-xl"
                  >
                    {selected === "Volume" ? "Low → High" : "Old → New"}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className=" dark:bg-[#0B132B]/50 backdrop-blur-md border-[1px] dark:border-Primary border-[#01061C]/8 rounded-xl overflow-hidden shadow-xl ">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] sm:min-w-full text-sm text-left">
                <thead className="dark:bg-[#3BC3DB]/20 bg-[#01061C]/8 dark:text-white/70 text-black">
                  <tr className="uppercase lg:text-lg tracking-wider font-raleway font-semibold ">
                    <th className="px-6 py-3">S/N</th>
                    <th className="px-6 py-3">Wallet</th>
                    <th className="px-6 py-3">Volume</th>
                    <th className="px-6 py-3">Last Purchase (UTC)</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {display.map((entry, idx) => {
                    const tokenMeta = tokensMap[entry.lastTokenAddress];
                    return (
                      <tr
                        key={entry.wallet}
                        className="hover:bg-white/5 transition border-b dark:border-b-Primary border-b-[#01061C]/8"
                      >
                        <td className="px-6 py-4 font-medium text-black dark:text-white">
                          {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>
                        <td className="px-6 py-4 ">
                          <div className="flex items-center gap-2">
                            {/* Wallet hyperlink (dynamic explorer URL) */}
                            <a
                              href={`${networkInfo.explorerUrl}/address/${entry.wallet}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {entry.wallet.slice(0, 6)}…
                              {entry.wallet.slice(-4)}
                            </a>

                            {/* Copy button */}
                            <CopyButton value={entry.wallet} />
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-lg text-black dark:text-white">
                          <div className="flex flex-col">
                            <span>
                              $
                              {entry.volumeUSD.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-xs dark:text-white/60 text-black/60">
                              {entry.volume.toFixed(6)} ETH
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tokenMeta ? (
                            <Link
                              to={`/trade/${tokenMeta.tokenAddress}`}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              {tokenMeta.tokenImageId && (
                                <img
                                  src={`${networkInfo.apiBaseUrl}${tokenMeta.image?.path}`}
                                  alt={tokenMeta.symbol}
                                  className="w-6 h-6 rounded-full"
                                  crossOrigin="anonymous"
                                />
                              )}
                              <div className="text-lg flex items-center gap-1">
                                <div className="font-medium text-black dark:text-white">
                                  {tokenMeta.name}
                                  <span className="dark:text-white/80 ml-1 text-sm text-black">
                                    ({tokenMeta.symbol})
                                  </span>
                                </div>
                                <div className="dark:text-white/50 text-black/54 text-sm">
                                  {formatUTC(entry.lastPurchaseTs)}
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <span>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          <div className="flex justify-start items-center gap-2 py-4 border-t border-white/10">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition ${i + 1 === page
                  ? "bg-[#0C8CE0] text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
