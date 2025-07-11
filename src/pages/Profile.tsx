import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { FaBell, FaEdit, FaTimes } from "react-icons/fa";
import { useAccount, useReadContract } from "wagmi";
import DustParticles from "../components/generalcomponents/DustParticles";
import Footer from "../components/generalcomponents/Footer";
import Navbar from "../components/launchintro/Navbar";
import { useUser } from "../context/user.context";
import { base } from "../lib/api";
import { AlchemyTokenDiscovery } from "../web3/tokenholding";
import axios from "axios";
import { debounce } from "lodash";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ETH_USDT_PRICE_FEED, PRICE_GETTER_ABI } from "../web3/config";
import { pureAmountOutMarketCap } from "../web3/readContracts";

interface launchedToken {
  name: string;
  symbol: string;
  createdAt: string;
}

interface TokenHolding {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  formattedBalance: string;
  rawBalance: string;
  logo?: string;
  priceInETH?: number;
  usdValue?: number;
  isLoadingPrice?: boolean;
}

const Profile = () => {
  const { address, isConnected } = useAccount();
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tokenHoldingsLoading, setTokenHoldingsLoading] = useState<boolean>(false);
  const [launchedTokens, setLaunchedTokens] = useState<launchedToken[]>([]);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [page, setPage] = useState<number>(1);
  const [username, setUsername] = useState<string>();
  const [enableChange, setEnableChange] = useState<boolean>();
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [activeTab, setActiveTab] = useState<"holdings" | "launched">(
    "holdings"
  );
  const [showEditCard, setShowEditCard] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { user, saveOrFetchUser, updateUser } = useUser();

  // Get ETH price
  const { data: latestETHPrice, isLoading: isLoadingLatestETHPrice } =
    useReadContract({
      ...PRICE_GETTER_ABI,
      functionName: "getLatestETHPrice",
      args: [ETH_USDT_PRICE_FEED!],
    });

  const ethPriceUSD = useMemo(() => {
    return isConnected && !isLoadingLatestETHPrice ? Number(latestETHPrice) / 1e8 : 0;
  }, [isConnected, isLoadingLatestETHPrice, latestETHPrice]);

  // Fetch token price in ETH for a specific token
  const fetchTokenPrice = useCallback(async (tokenAddress: string): Promise<number> => {
    try {
      const raw = await pureAmountOutMarketCap(tokenAddress);
      if (raw !== undefined && raw !== null) {
        return Number(raw.toString()) / 1e18;
      }
      return 0;
    } catch (error) {
      console.error(`Failed to fetch price for token ${tokenAddress}:`, error);
      return 0;
    }
  }, []);

  // Fetch token holdings and their prices
  const fetchTokenHoldings = useCallback(async () => {
    if (!address) return;

    setTokenHoldingsLoading(true);
    try {
      const holdings = await AlchemyTokenDiscovery.getAllTokenBalances(address);
      const holdingsWithMetadata = holdings.map((token) => ({
        ...token,
        rawBalance: token.rawBalance ?? "",
        logo: token.logo ?? "",
        priceInETH: 0,
        usdValue: 0,
        isLoadingPrice: true,
      }));

      setTokenHoldings(holdingsWithMetadata);

      // Fetch prices for each token
      const updatedHoldings = await Promise.all(
        holdingsWithMetadata.map(async (token) => {
          const priceInETH = await fetchTokenPrice(token.contractAddress);
          const usdValue = token.balance * priceInETH * ethPriceUSD;
          
          return {
            ...token,
            priceInETH,
            usdValue,
            isLoadingPrice: false,
          };
        })
      );

      setTokenHoldings(updatedHoldings);
    } catch (error) {
      console.error("Error fetching token holdings:", error);
      setTokenHoldings([]);
    } finally {
      setTokenHoldingsLoading(false);
    }
  }, [address, fetchTokenPrice, ethPriceUSD]);

  // Calculate total balance in USD
  const totalBalance = useMemo(() => {
    return tokenHoldings.reduce((sum, token) => {
      return sum + (token.usdValue || 0);
    }, 0);
  }, [tokenHoldings]);

  // Previous day balance for percentage calculation (mock data - you might want to store this)
  const previousDayBalance = useMemo(() => {
    // This should come from your backend or local storage
    // For now, we'll calculate a mock previous balance
    return totalBalance * 0.9; // Assuming 10% increase
  }, [totalBalance]);

  const balanceChange = useMemo(() => {
    const change = totalBalance - previousDayBalance;
    const percentage = previousDayBalance > 0 ? (change / previousDayBalance) * 100 : 0;
    return { amount: change, percentage };
  }, [totalBalance, previousDayBalance]);

  // days left and disable and enable of the username form
  useEffect(() => {
    const findDayLast = () => {
      const today = new Date();
      const lastChange = new Date(String(user?.updatedAt));

      const diffMs = today.getTime() - lastChange.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const daysLeft = 30 - diffDays;

      if (daysLeft <= 0) {
        setEnableChange(false);
      } else if (user?.username === null || user?.username === "") {
        setEnableChange(false);
      } else {
        setEnableChange(true);
        console.log(`There are ${daysLeft} day(s) left to reach 30 days.`);
      }
    };

    findDayLast();
  }, [user?.updatedAt, user?.username]);

  useEffect(() => {
    let isMounted = true;
    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
      fetchTokenHoldings();
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, address, saveOrFetchUser, fetchTokenHoldings]);

  // handle username search so user will know available names
  const abortController = useRef<AbortController | null>(null);
  const findUsername = useCallback(async (query = "") => {
    if (abortController.current) {
      abortController.current.abort();
    }
    const controller = new AbortController();
    abortController.current = controller;
    try {
      const res = await base.get(`users?search=${query}`, {
        signal: controller.signal,
      });
      const response = res.data.data;
      const result = response.data.length > 0 ? false : true;
      setIsUsernameAvailable(result);
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: string }).name === "CanceledError")
      ) {
        console.log(error);
      } else {
        console.error("API Error:", error);
      }
    }
  }, []);

  const debouncedFetch = useMemo(
    () =>
      debounce((query: string) => {
        findUsername(query);
      }, 300),
    [findUsername]
  );

  // change username
  const handleSubmitting = async () => {
    if (!user?.id || !username?.trim()) return;
    setIsSubmitting(true);
    try {
      const request = await base.patch(`user/${user.id}`, { username });
      const response = await request.data.data;

      updateUser(response);

      console.log(response);
      setShowEditCard(false);
      setUsername("");
      setIsUsernameAvailable(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onchange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedFetch(value);
    setUsername(value);
  };

  const handleEditClick = () => {
    setShowEditCard(true);
    setUsername(user?.username || "");
  };

  const handleCloseCard = () => {
    setShowEditCard(false);
    setUsername("");
    setIsUsernameAvailable(null);
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const findHolderToken = useCallback(
    async (pageNum = 1, wallet = "", append = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setLoading(true);
        const res = await base.get(
          `tokens?tokenCreator=${encodeURIComponent(
            String(wallet)
          )}&page=${pageNum}`,
          {
            signal: controller.signal,
          }
        );

        const apiData = res.data.data;
        console.log({ apiData });
        setHasNext(apiData.hasNextPage);
        setPage(pageNum);
        setLaunchedTokens((prev) =>
          append ? [...prev, ...apiData.data] : apiData.data
        );
      } catch (error) {
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
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch or search
  useEffect(() => {
    console.log(address);
    if (address) {
      findHolderToken(1, address, false);
      setPage(1);
      setHasNext(true);
    }
  }, [address, findHolderToken]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;

      const condition =
        container &&
        hasNext &&
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 100 &&
        address;

      if (condition) {
        findHolderToken(page + 1, address, true);
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
  }, [address, findHolderToken, hasNext, page]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="px-4 relative mountain">
      <Navbar />

      {/* Background Glow */}
      <div className="lg:size-[30rem] lg:w-[55rem] rounded-full bg-[#3BC3DB]/10 absolute top-[50px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      <h1 className="lg:text-4xl font-bold text-center dark:text-white text-black mb-10 font-raleway pt-40">
        My Profile
      </h1>
      <div className="max-w-3xl mx-auto mb-40 dark:bg-[#050A1E]/80 bg-[#141313]/3 border border-white/10 px-6 py-10 lg:px-[20px] lg:py-[60px] rounded-[20px] text-white">
        {/* Wallet & Notification */}
        <div className="flex justify-center items-center gap-6 mb-10">
          <div className="dark:bg-white/4 bg-[#141313]/2 text-[#141313]/90 dark:text-white px-4 py-4 rounded-xl text-sm font-mono">
            {address
              ? (user?.username && user.username.trim() !== ""
                ? `@${user.username}`
                : `${address.slice(0, 4)}...${address.slice(-4)}`)
              : <ConnectButton />}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 dark:bg-white/10 bg-[#141313]/5 rounded-full flex items-center justify-center">
              <FaBell className="dark:text-white/70 text-[#141313] text-sm" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <button
              onClick={handleEditClick}
              className="w-8 h-8 dark:bg-white/10 bg-[#141313]/5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <FaEdit className="dark:text-white/70 text-[#141313] text-sm" />
            </button>
          </div>
        </div>

        {/* Edit Username Card */}
        {showEditCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="dark:bg-[#050A1E] bg-white border border-white/10 rounded-xl p-6 max-w-md w-full relative">
              <button
                onClick={handleCloseCard}
                className="absolute top-4 right-4 w-8 h-8 dark:bg-white/10 bg-[#141313]/5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <FaTimes className="dark:text-white/70 text-[#141313] text-sm" />
              </button>

              <h2 className="text-xl font-bold dark:text-white text-black mb-6 font-raleway">
                Edit Username
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-white/70 text-black/70 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 dark:text-white/70 text-black/70 text-sm font-mono">
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="Enter your preferred username"
                      value={username}
                      onChange={onchange}
                      disabled={enableChange}
                      className="w-full pl-8 pr-4 py-3 dark:bg-white/5 bg-[#141313]/5 border border-white/10 rounded-lg dark:text-white text-black placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#3BC3DB] disabled:opacity-50"
                    />
                  </div>
                  {isUsernameAvailable !== null && (
                    <p className={`${isUsernameAvailable ? "text-green-500" : "text-red-500"} text-xs mt-2`}>
                      {isUsernameAvailable ? "Username available" : "Username not available"}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseCard}
                    className="flex-1 px-4 py-3 dark:bg-white/10 bg-[#141313]/10 dark:text-white text-black rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitting}
                    disabled={enableChange || !username?.trim() || isUsernameAvailable === false || isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#3BC3DB] to-[#0C8CE0] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="relative rounded-xl p-6 mb-10 flex flex-col items-center justify-center overflow-hidden">
          {/* Gradient Background Layer */}
          <div className="absolute inset-0 bg-gradient-to-l from-[#3BC3DB] to-[#0C8CE0] dark:opacity-[0.2] opacity-[0.08] pointer-events-none rounded-xl" />

          {/* Content Layer */}
          <div className="relative z-10 text-black dark:text-white">
            <h2 className="dark:text-white/80 text-[#0C8CE0] lg:text-[20px] mb-2 text-center font-raleway font-semibold">
              Total Balance
            </h2>
            <div className="lg:text-[70px] font-bold mb-2 font-raleway">
              ${formatCurrency(totalBalance)}
            </div>
            <div className={`text-sm text-center ${balanceChange.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {balanceChange.amount >= 0 ? '▲' : '▼'} {balanceChange.percentage >= 0 ? '+' : ''}{balanceChange.percentage.toFixed(2)}% 
              [${balanceChange.amount >= 0 ? '+' : ''}${formatCurrency(Math.abs(balanceChange.amount))}]
            </div>
            <div className="mt-4">{/* Replace with chart component */}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 text-lg font-semibold mb-6">
          <button
            className={`pb-1 transition cursor-pointer ${activeTab === "holdings"
              ? "border-white dark:text-white text-black"
              : "border-transparent dark:text-white/30 text-black/60"
              }`}
            onClick={() => setActiveTab("holdings")}
          >
            Holdings
          </button>
          <button
            className={`pb-1 transition cursor-pointer ${activeTab === "launched"
              ? "border-white dark:text-white text-[#141313]/75"
              : "border-transparent dark:text-white/30 text-black/60"
              }`}
            onClick={() => setActiveTab("launched")}
          >
            Token Launched
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "holdings" ? (
          <div className="space-y-4">
            {tokenHoldingsLoading ? (
              <div className="text-center py-8">
                <p className="dark:text-white/70 text-[#141313]/75">Loading token holdings...</p>
              </div>
            ) : tokenHoldings.length === 0 ? (
              <div className="text-center py-8">
                <p className="dark:text-white/70 text-[#141313]/75">No token holdings found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tokenHoldings.map((token, i) => (
                  <div
                    key={i}
                    className="dark:bg-[#0B132B] bg-[#141313]/5 rounded-xl px-5 py-4 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      {token.logo ? (
                        <img
                          src={token.logo}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ${token.logo ? 'hidden' : ''}`} />
                      <div>
                        <span className="font-bold text-sm text-black dark:text-white block">
                          {token.symbol}
                        </span>
                        <span className="text-xs text-black/60 dark:text-white/60">
                          {token.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm dark:text-white/70 text-[#141313]/75 text-right">
                      <div>{token.formattedBalance}</div>
                      <div className="text-xs opacity-60">
                        {token.isLoadingPrice ? (
                          "Loading..."
                        ) : token.usdValue && token.usdValue > 0 ? (
                          `$${formatCurrency(token.usdValue)}`
                        ) : (
                          "$0.00"
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div ref={containerRef}>
              {launchedTokens.map(({ name, symbol, createdAt }, i) => (
                <div
                  key={i}
                  className="dark:bg-[#0B132B] bg-[#141313]/5 rounded-xl px-5 py-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <span className="font-bold text-sm text-black dark:text-white">
                      {name} ({symbol})
                    </span>
                  </div>
                  <div className="text-sm dark:text-white/70 text-[#141313]/75">
                    Deployed: {formatDate(createdAt)}
                  </div>
                </div>
              ))}

              <p>{loading && "Please wait...."}</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile;