import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import logo from "../../assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ThemeToggle from "../../lib/ThemeToggle";
import { FiMenu, FiX } from "react-icons/fi";
import { useApiClient } from "../../lib/api";
import { debounce } from "lodash";
import axios from "axios";
import {
  getPureGetLatestETHPrice,
  getPureInfoV1DataRaw,
  getPureInfoV2DataRaw,
  getPureAmountOutMarketCapV1,
  getPureAmountOutMarketCapV2,
  getPureInfoV3DataRaw,
  getPureAmountOutMarketCapV3,
  getPureInfoV4DataRaw,
  getPureAmountOutMarketCapV4,
} from "../../web3/readContracts";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";
import { ETH_USDT_PRICE_FEED_ADDRESSES } from "../../web3/config";

interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: `0x${string}`;
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

const Navbar = () => {
  const networkInfo = useNetworkEnvironment();
  const base = useApiClient();
  const [showMenu, setShowMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navBg, setNavBg] = useState(false);

  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [marketCapMap, setMarketCapMap] = useState<Record<string, number>>({});
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState<TokenMetadata[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedMenu = (() => {
    switch (location.pathname) {
      case "/tokens":
        return "Token";
      case "/launch":
        return "Launch";
      case "/leaderboard":
        return "Leaderboard";
      case "/profile":
        return "Profile";
      default:
        return "Home";
    }
  })();

  useEffect(() => {
    const handler = () => setNavBg(window.scrollY >= 90);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const priceFeedAddress = ETH_USDT_PRICE_FEED_ADDRESSES[networkInfo.chainId];

  // Fetch ETH price
  useEffect(() => {
    (async () => {
      try {
        const raw = await getPureGetLatestETHPrice(
          networkInfo.chainId,
          priceFeedAddress!
        );
        const price = (typeof raw === "number" ? raw : Number(raw)) / 1e8;
        setEthPriceUSD(price);
      } catch (err) {
        console.error("Failed to fetch ETH price", err);
      }
    })();
  }, [networkInfo.chainId, priceFeedAddress]);

  // Fetch Market Cap per token
  useEffect(() => {
    if (!tokens.length || !ethPriceUSD) return;

    const fetchMarketCaps = async () => {
      const newMap: Record<string, number> = {};

      await Promise.all(
        tokens.map(async (token) => {
          try {
            if (token?.tokenVersion == "token_v1") {
              const info = await getPureInfoV1DataRaw(
                networkInfo.chainId,
                token.tokenAddress
              );
              const supply =
                Array.isArray(info) && typeof info[7] !== "undefined"
                  ? Number(info[6])
                  : 0;

              const rawAmt = await getPureAmountOutMarketCapV1(
                networkInfo.chainId,
                token.tokenAddress
              );
              const pricePerToken = rawAmt ? Number(rawAmt.toString()) / 1e18 : 0;

              const marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;
              newMap[token.tokenAddress] = marketCap;
            } else if (token?.tokenVersion == "token_v3") {
              const info = await getPureInfoV3DataRaw(
                networkInfo.chainId,
                token.tokenAddress
              );
              const supply =
                Array.isArray(info) && typeof info[7] !== "undefined"
                  ? Number(info[6])
                  : 0;

              const rawAmt = await getPureAmountOutMarketCapV3(
                networkInfo.chainId,
                token.tokenAddress
              );
              const pricePerToken = rawAmt ? Number(rawAmt.toString()) / 1e18 : 0;

              const marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;
              newMap[token.tokenAddress] = marketCap;
            } else if (token?.tokenVersion == "token_v4") {
              const info = await getPureInfoV4DataRaw(
                networkInfo.chainId,
                token.tokenAddress
              );
              const supply =
                Array.isArray(info) && typeof info[7] !== "undefined"
                  ? Number(info[6])
                  : 0;

              const rawAmt = await getPureAmountOutMarketCapV4(
                networkInfo.chainId,
                token.tokenAddress
              );
              const pricePerToken = rawAmt ? Number(rawAmt.toString()) / 1e18 : 0;

              const marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;
              newMap[token.tokenAddress] = marketCap;
            } else {
              const info = await getPureInfoV2DataRaw(
                networkInfo.chainId,
                token.tokenAddress
              );
              const supply =
                Array.isArray(info) && typeof info[7] !== "undefined"
                  ? Number(info[6])
                  : 0;

              const rawAmt = await getPureAmountOutMarketCapV2(
                networkInfo.chainId,
                token.tokenAddress
              );
              const pricePerToken = rawAmt ? Number(rawAmt.toString()) / 1e18 : 0;

              const marketCap = pricePerToken * (supply / 1e18) * ethPriceUSD;
              newMap[token.tokenAddress] = marketCap;
            }
          } catch (err) {
            console.error(`Market cap error for ${token.tokenAddress}`, err);
          }
        })
      );

      setMarketCapMap(newMap);
    };

    fetchMarketCaps();
  }, [tokens, ethPriceUSD, networkInfo.chainId]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchToken = useCallback(
    async (text: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (!text.trim()) return;

        const res = await base.get("tokens", {
          params: { includes: "image", search: text, limit: 5 },
          signal: controller.signal,
        });

        const { data } = res.data.data;
        console.log(data);
        setTokens(data);
        setFilteredResults(data);
        setShowSuggestions(true);
      } catch (error: unknown) {
        if (
          axios.isCancel(error) ||
          (typeof error === "object" &&
            error !== null &&
            "name" in error &&
            (error as { name?: string }).name === "CanceledError")
        ) {
          // Request canceled
        } else {
          console.error("API Error:", error);
        }
        setFilteredResults([]);
        setShowSuggestions(false);
      }
    },
    [base]
  );

  const debouncedFetch = useMemo(
    () =>
      debounce((query: string) => {
        searchToken(query);
      }, 300),
    [searchToken]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedFetch(value);
  };

  return (
    <>
      <header
        className={`py-3 lg:px-[40px]  px-3 md:px-[79px] ${navBg
          ? "bg-Dark-Purple"
          : "bg-[#ffffff0d] backdrop-blur-[40px] shadow"
          } fixed w-full top-0 left-0 z-[60] transition-all duration-300 backdrop-blur-[20px]`}
      >
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="Safu Logo" width={40} height={40} />
          </a>

          {/* Dropdown & Search */}
          <div className="flex items-center w-full max-w-[10rem] lg:max-w-[700px] mx-2 lg:mx-6">
            {/* Dropdown */}
            <div className="relative z-50" ref={dropdownRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center dark:bg-[#0C8CE0]/43 bg-[#0C8CE0] text-white px-2 py-3 lg:px-4 lg:py-3 rounded-l-lg text-sm font-medium cursor-pointer"
              >
                {selectedMenu} <FaChevronDown className="ml-2 text-xs" />
              </button>
              {showMenu && (
                <div className="absolute z-60 top-full search dark:shadow-2xl  mt-3 w-64  rounded-2xl space-y-1 text-black dark:bg-[#02071E]/95 dark:backdrop-blur-none dark:text-white overflow-hidden">
                  <div className="relative z-10">
                    {[
                      {
                        to: "/",
                        title: "Home",
                        desc: "Prep for liftoff — your mission starts here",
                      },
                      {
                        to: "/launch",
                        title: "Launch",
                        desc: "Deploy your token and ignite liftoff",
                      },
                      {
                        to: "/tokens",
                        title: "Tokens",
                        desc: "Explore tokens with moonshot potential",
                      },
                      {
                        to: "/leaderboard",
                        title: "Leaderboard",
                        desc: "See who’s leading the lunar race",
                      },
                      {
                        to: "/profile",
                        title: "Profile",
                        desc: "Keep track of your degeneracy!",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setShowMenu(false);
                          navigate(item.to);
                        }}
                        className="block px-5 py-3 transition duration-200 hover:bg-[#147ABD]/20  first-of-type:rounded-t-2xl last-of-type:rounded-b-2xl cursor-pointer"
                      >
                        <p className="text-base font-medium dark:text-white text-black">
                          {item.title}
                        </p>
                        <p className="text-sm dark:text-white/60 text-[#141313]/64">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search */}
            <div
              className="relative lg:flex-1 max-w-[10rem] lg:max-w-none"
              ref={suggestionsRef}
            >
              <div className="flex items-center dark:bg-[#071129] px-4 py-3 rounded-r-lg w-full bg-black/5">
                <FaSearch className="dark:text-gray-400 text-[#141313]/40" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for tokens & profiles"
                  value={searchTerm}
                  onChange={handleChange}
                  onFocus={() => setShowSuggestions(true)}
                  className="ml-2 bg-transparent text-sm dark:text-white text-black dark:placeholder-gray-400 placeholder-[#141313]/40 outline-none w-full"
                />
              </div>

              {showSuggestions && filteredResults.length > 0 && (
                <div className="absolute top-full -left-[5rem] mt-3 w-72 search text-white shadow-2xl rounded-2xl z-50 space-y-1">
                  {filteredResults.map((token) => (
                    <div
                      key={token.tokenAddress}
                      onClick={() => {
                        navigate(`/trade/${token.tokenAddress}`);
                        setSearchTerm("");
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-3 hover:bg-[#147ABD]/20 cursor-pointer flex items-center gap-3 first-of-type:rounded-t-2xl last-of-type:rounded-b-2xl"
                    >
                      {/* Token Image */}
                      {token.image?.path && (
                        <img
                          src={`${networkInfo.apiBaseUrl}${token.image.path}`}
                          alt={token.symbol}
                          className="w-8 h-8 rounded-md object-cover"
                          crossOrigin=""
                        />
                      )}

                      {/* Token Info */}
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate dark:text-white text-black">
                          {token.name} ({token.symbol})
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {token.tokenAddress.slice(0, 6)}...
                          {token.tokenAddress.slice(-4)}
                        </p>
                      </div>

                      {/* Market Cap */}
                      <p className="text-xs dark:text-white text-black text-right min-w-[80px]">
                        {marketCapMap[token.tokenAddress] !== undefined
                          ? `$${marketCapMap[token.tokenAddress].toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Connect & Theme */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <ConnectButton />
            </div>
            <ThemeToggle />
            <button className="xl:hidden z-[60]">
              {isOpen ? (
                <FiX
                  className="dark:text-white text-black text-4xl cursor-pointer"
                  onClick={() => setIsOpen(false)}
                />
              ) : (
                <FiMenu
                  className="dark:text-white text-black text-4xl cursor-pointer"
                  onClick={() => setIsOpen(true)}
                />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="block xl:hidden fixed inset-0 z-50 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`absolute z-10 sm:w-1/2 bg-white/2 backdrop-blur-2xl text-black right-0 top-0 h-screen w-[70%] transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-4">
              <FiX
                className="text-white text-2xl cursor-pointer"
                onClick={() => setIsOpen(false)}
              />
            </div>
            <div className="flex flex-col px-6 gap-6 mt-20">
              {[
                { to: "/", title: "Home" },
                { to: "/tokens", title: "Token" },
                { to: "/launch", title: "Launch" },
                { to: "/leaderboard", title: "Leaderboard" },
                { to: "/profile", title: "Profile" },
              ].map(({ to, title }) => (
                <a
                  key={title}
                  href={to}
                  className="text-lg uppercase tracking-widest dark:text-white text-black font-raleway"
                  onClick={() => {
                    setShowMenu(false);
                    navigate(to);
                  }}
                >
                  {title}
                </a>
              ))}
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
