import { useEffect, useState } from "react";
import Navbar from "../components/launchintro/Navbar";
import Footer from "../components/generalcomponents/Footer";
import DustParticles from "../components/generalcomponents/DustParticles";
import { pureGetLatestETHPrice } from "../web3/readContracts";
import { ETH_USDT_PRICE_FEED } from "../web3/config";
import { base } from "../lib/api";
import { BsChevronDown } from "react-icons/bs";

const options = ["Featured", "Trending", "New", "Top Rated"];

/**
 * Description placeholder
 *
 * @interface TxLog
 * @typedef {TxLog}
 */
interface TxLog {
  tokenAddress: string;
  type: "buy" | "sell";
  ethAmount: string;
  tokenAmount: string;
  timestamp: string;
  txnHash: string;
  wallet: string;
}

/**
 * Description placeholder
 *
 * @interface TokenMetadata
 * @typedef {TokenMetadata}
 */
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

/**
 * Description placeholder
 *
 * @interface LeaderboardEntry
 * @typedef {LeaderboardEntry}
 */
interface LeaderboardEntry {
  wallet: string;
  volume: number;
  volumeUSD: number;
  lastTokenAddress: string;
  lastPurchaseTs: string;
}

/**
 * Description placeholder
 *
 * @type {25}
 */
const ITEMS_PER_PAGE = 25;

/**
 * Description placeholder
 *
 * @export
 * @returns {*}
 */
export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tokensMap, setTokensMap] = useState<Record<string, TokenMetadata>>({});
  const [page, setPage] = useState(1);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);

  useEffect(() => {
    async function loadData() {
      try {
        // First, fetch ETH price
        const raw = await pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!);
        const price = (typeof raw === "number" ? raw : Number(raw)) / 1e8;
        setEthPriceUSD(price);

        // Fetch token metadata map
        const tokensRes = await base.get("tokens", {
          params: { include: "image" },
        });

        const tokens: TokenMetadata[] = await tokensRes.data.data.data;
        const map: Record<string, TokenMetadata> = {};
        tokens.forEach((t) => {
          map[t.tokenAddress.toLowerCase()] = t;
        });
        setTokensMap(map);

        // Fetch all transactions and build leaderboard
        const txRes = await base.get("transactions");
        const allTx: TxLog[] = await txRes.data.data.data;

        const walletMap: Record<
          string,
          { volume: number; lastTs: string; lastToken: string }
        > = {};

        allTx.forEach((tx) => {
          // Only process buy and sell transactions
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

        const arr = Object.entries(walletMap)
          .map(([wallet, { volume, lastTs, lastToken }]) => ({
            wallet,
            volume,
            volumeUSD: volume * price,
            lastTokenAddress: lastToken,
            lastPurchaseTs: lastTs,
          }))
          .sort((a, b) => b.volumeUSD - a.volumeUSD);

        setEntries(arr);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data:", error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  const display = entries.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  function formatUTC(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "UTC",
      hour12: true,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
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
    <div className="px-4 relative min-h-screen mountain">
      {/* <div className="noise" /> */}
      <Navbar />
      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <div className="max-w-5xl mx-auto pt-40">
        <div className="text-center  mb-10">
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

        <div className="mb-[34px] relative w-full sm:w-[200px]">
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
            <div className="absolute top-full mt-2 z-50 w-full dark:bg-[#1a2a7f] bg-white dark:text-white text-black rounded-xl shadow-md">
              {options.map((option, idx) => (
                <div
                  key={option}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-Primary ${
                    idx === 0
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

        <div className=" dark:bg-[#0B132B]/50 backdrop-blur-md border-[1px] dark:border-Primary border-[#01061C]/8 rounded-xl overflow-hidden shadow-xl ">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="dark:bg-[#3BC3DB]/20 bg-[#01061C]/8 dark:text-white/70 text-black">
                <tr className="uppercase lg:text-lg tracking-wider font-raleway font-semibold ">
                  <th className="px-6 py-3">S/N</th>
                  <th className="px-6 py-3">Wallet</th>
                  <th className="px-6 py-3">Volume</th>
                  <th className="px-6 py-3">Last Purchase</th>
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
                      <td className="px-6 py-4">
                        <a
                          href="#"
                          className=" hover:underline text-black dark:text-white"
                        >
                          {entry.wallet.slice(0, 4)}...{entry.wallet.slice(-4)}
                        </a>
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
                          <div className="flex items-center gap-3">
                            {tokenMeta.tokenImageId && (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL}${
                                  tokenMeta.image?.path
                                }`}
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
                          </div>
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
        <div className="flex justify-start items-center gap-2 py-6 border-t border-white/10">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition ${
                i + 1 === page
                  ? "bg-[#0C8CE0] text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
