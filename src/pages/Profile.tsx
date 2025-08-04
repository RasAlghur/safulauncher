// safulauncher/src/pages/Profile.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { FaEdit, FaTimes } from "react-icons/fa";
import { useAccount, useReadContract } from "wagmi";
import DustParticles from "../components/generalcomponents/DustParticles";
import Footer from "../components/launchintro/Footer";
import Navbar from "../components/launchintro/Navbar";
import { useUser } from "../context/user.context";
import { base } from "../lib/api";
import { AlchemyTokenDiscovery } from "../web3/tokenholding";
import axios from "axios";
import { debounce } from "lodash";
import {
  getPureAmountOutMarketCap,
} from "../web3/readContracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ETH_USDT_PRICE_FEED_ADDRESSES, PRICE_GETTER_ABI, PRICE_GETTER_ADDRESSES } from "../web3/config";
import { processUsername } from "../lib/username";
import RocketLoader from "../components/generalcomponents/Loader";
import { Link } from "react-router-dom";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";

interface launchedToken {
  name: string;
  symbol: string;
  createdAt: string;
  tokenAddress: string;
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

type tokenAll = {
  tokenAddress: string;
};

type Form = {
  website: string;
  description: string;
  twitter: string;
  telegram: string;
  logo: File;
};
const Profile = () => {
  const networkInfo = useNetworkEnvironment();
  const { address, isConnected } = useAccount();
  const [balanceChange, setBalanceChange] = useState<{
    amount: number;
    percentage: number;
  }>({ amount: 0, percentage: 0 });

  const [hasNext, setHasNext] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [tokenHoldingsLoading, setTokenHoldingsLoading] =
    useState<boolean>(false);
  const [launchedTokens, setLaunchedTokens] = useState<launchedToken[]>([]);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [page, setPage] = useState<number>(1);
  const [username, setUsername] = useState<string>();
  const [enableChange, setEnableChange] = useState<boolean>(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [activeTab, setActiveTab] = useState<"holdings" | "launched">(
    "holdings"
  );
  const [showEditCard, setShowEditCard] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [allToken, setAllToken] = useState<tokenAll[]>([]);
  const [editToken, setEditToken] = useState<Form>({} as Form);

  // const isV2 = token?.tokenVersion === "token_v2";

  const { user, saveOrFetchUser, updateUser } = useUser();

  // Get ETH price
  const { data: latestETHPrice, isLoading: isLoadingLatestETHPrice } =
    useReadContract({
      address: PRICE_GETTER_ADDRESSES[networkInfo.chainId],
      ...PRICE_GETTER_ABI.abi,
      functionName: "getLatestETHPrice",
      args: [ETH_USDT_PRICE_FEED_ADDRESSES[networkInfo.chainId]!],
    });

  const ethPriceUSD = useMemo(() => {
    return isConnected && !isLoadingLatestETHPrice
      ? Number(latestETHPrice) / 1e8
      : 0;
  }, [isConnected, isLoadingLatestETHPrice, latestETHPrice]);

  // Fetch all tokens from database
  const fetchAllTokens = useCallback(async () => {
    try {
      const request = await base.get("token-all");
      console.log("request", request);
      const request2 = await base.get("tokens");
      console.log("As from DB:", request2);
      const response = request.data.data;
      setAllToken(response || []);
      console.log("All tokens from DB:", response);
    } catch (error) {
      console.error("Error fetching all tokens:", error);
      setAllToken([]);
    }
  }, []);

  // Initialize - fetch all tokens from database
  useEffect(() => {
    fetchAllTokens();
  }, [fetchAllTokens]);

  // Fetch token price in ETH for a specific token
  const fetchTokenPrice = useCallback(
    async (tokenAddress: string): Promise<number> => {
      try {
        // const fn = isV2 ? getPureV2AmountOutMarketCap : getPureAmountOutMarketCap;
        const fn = getPureAmountOutMarketCap;
        const raw = await fn(networkInfo.chainId, tokenAddress);
        console.log(`raw for token address ${tokenAddress}: ${raw}`);
        if (raw !== undefined && raw !== null) {
          return Number(raw.toString()) / 1e18;
        }
        return 0;
      } catch (error) {
        console.error(
          `Failed to fetch price for token ${tokenAddress}:`,
          error
        );
        return 0;
      }
    },
    []
  );

  // Fetch token holdings and their prices
  const fetchTokenHoldings = useCallback(
    async (silent = false) => {
      if (!address) return;

      if (!silent) setTokenHoldingsLoading(true);
      try {
        // Get all user's token holdings
        const holdings = await AlchemyTokenDiscovery.getAllTokenBalances(
          address
        );

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
        if (!silent) setTokenHoldingsLoading(false);
      }
    },
    [address, fetchTokenPrice, ethPriceUSD]
  );

  // Filter holdings to only show tokens that exist in the database
  const filteredHoldings = useMemo(() => {
    if (!allToken.length || !tokenHoldings.length) return [];

    // Create a Set of lowercase addresses from database for efficient lookup
    const dbTokenAddresses = new Set(
      allToken.map((token) => token.tokenAddress.toLowerCase())
    );

    // Filter user holdings to only include tokens that exist in database
    const filtered = tokenHoldings.filter((holding) => {
      const isInDb = dbTokenAddresses.has(
        holding.contractAddress.toLowerCase()
      );
      return isInDb;
    });
    return filtered;
  }, [allToken, tokenHoldings]);

  // Calculate total balance in USD (for filtered holdings only)
  const totalBalance = useMemo(() => {
    return filteredHoldings.reduce((sum, token) => {
      return sum + (token.usdValue || 0);
    }, 0);
  }, [filteredHoldings]);

  console.log("Current total balance at 1 index:", totalBalance);

  // track balance
  const trackBalance = useCallback(async () => {
    try {
      console.log("Tracking balance for user:", address);
      console.log("Current total balance:", totalBalance);
      const request = await base.post("track-balance", {
        currentBalance: totalBalance.toString(),
        wallet: String(address),
      });
      const { balanceChange: apiAmount, percentageChange: apiPct } =
        request.data.data;
      console.log("API response:", request.data.data);
      // update state from API
      setBalanceChange({ amount: apiAmount, percentage: apiPct });
      return request.data;
    } catch (error) {
      console.log(error);
    }
  }, [address, totalBalance]);

  // Days left calculation
  useEffect(() => {
    const findDayLast = () => {
      const today = new Date();
      const lastChange = new Date(String(user?.updatedAt));
      const diffMs = today.getTime() - lastChange.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const daysLeft = 30 - diffDays;

      if (daysLeft <= 0) {
        setEnableChange(false);
      } else if (user?.username === undefined || user?.username === null) {
        setEnableChange(false);
      } else {
        console.log("username", user?.username);
        setEnableChange(true);
        console.log(`There are ${daysLeft} day(s) left to reach 30 days.`);
      }
    };

    if (totalBalance > 0) {
      trackBalance();
    }

    findDayLast();
  }, [user?.updatedAt, user?.username, totalBalance, trackBalance]);

  // Initialize when wallet connects and set up real-time fetches
  useEffect(() => {
    let isMounted = true;
    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
      fetchTokenHoldings();
    }

    // Real-time update every N seconds, but silently (no loader)
    const AUTO_REFRESH_MS = 15 * 1000; // ← change this to your desired interval
    let intervalId: NodeJS.Timeout;
    if (isConnected && address) {
      intervalId = setInterval(() => {
        fetchTokenHoldings(/* silent= */ true);
        fetchAllTokens();
      }, AUTO_REFRESH_MS);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isConnected,
    address,
    saveOrFetchUser,
    fetchTokenHoldings,
    fetchAllTokens,
  ]);

  // Username search logic
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

  // Change username
  const handleSubmitting = async () => {
    if (!user?.id || !username?.trim()) return;
    setIsSubmitting(true);
    try {
      const request = await base.patch(`user/${user.id}`, { username });
      const response = await request.data.data;
      updateUser(response);
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
    console.log("Edit button clicked"); // Debug log
    setShowEditCard(true);
    setUsername(user?.username || "");
  };

  const handleCloseCard = () => {
    setShowEditCard(false);
    setUsername("");
    setIsUsernameAvailable(null);
  };

  // Launched tokens logic
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
          { signal: controller.signal }
        );

        const apiData = res.data.data;
        console.log({ tokenDeloyment: apiData });
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

  // Initial fetch for launched tokens
  useEffect(() => {
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

  function formatUTCDate(timestamp: string): string {
    const date = new Date(timestamp);

    const year = date.getUTCFullYear();
    const month = date.toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
    });
    const day = date.getUTCDate().toString().padStart(2, "0");
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    return `${month} ${day} ${year} ${hours}:${minutes} UTC`;
  }
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isConnected && isMounted) {
        await saveOrFetchUser(String(address));
        await fetchTokenHoldings();
        setPageLoading(false); // Done loading
      } else {
        setPageLoading(false); // No wallet connected, but still done "loading"
      }
    };

    loadData();

    const AUTO_REFRESH_MS = 15 * 1000;
    let intervalId: NodeJS.Timeout;
    if (isConnected && address) {
      intervalId = setInterval(() => {
        fetchTokenHoldings(true); // silent fetch
        fetchAllTokens();
      }, AUTO_REFRESH_MS);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isConnected,
    address,
    saveOrFetchUser,
    fetchTokenHoldings,
    fetchAllTokens,
  ]);

  console.log(filteredHoldings);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditToken((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditToken((prev) => ({ ...prev, logo: file }));
    }
  };

  const onEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { description, website, twitter, telegram, logo } = editToken;
    const formData = new FormData();
    if (address) formData.append("wallet", address);
    if (description) formData.append("description", description);
    if (website) formData.append("website", website);
    if (twitter) formData.append("twitter", twitter);
    if (telegram) formData.append("telegram", telegram);
    if (logo) formData.append("logo", logo);

    const req: Response = await fetch(
      `http://localhost:4000/api/update-token/af0049da-1d43-4efc-a744-579b6102e162`,
      {
        method: "PATCH",
        body: formData,
      }
    );

    const res: unknown = await req.json();
    console.log(res);
  };

  return (
    <div className="px-4 relative mountain ">
      <Navbar />

      {/* Background Glow */}
      <div className="lg:size-[30rem] lg:w-[55rem] rounded-full bg-[#3BC3DB]/10 absolute top-[50px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>

      {pageLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-[#050A1E]/90 backdrop-blur-sm">
          <RocketLoader />
        </div>
      )}
      <div className="min-h-screen">
        <h1 className="lg:text-3xl font-bold text-center dark:text-white text-black mb-10 font-raleway pt-28 relative z-20">
          My Profile
        </h1>
        <div className="max-w-3xl mx-auto mb-40 dark:bg-[#050A1E]/80 bg-[#141313]/3 border border-white/10 px-6 py-10 lg:px-[20px] lg:py-[60px] rounded-[20px] text-white relative z-20">
          {/* Wallet & Notification */}
          <div className="flex justify-center items-center gap-6 mb-10 relative z-30">
            <div className="dark:bg-white/4 bg-[#141313]/2 text-[#141313]/90 dark:text-white px-4 py-4 rounded-xl text-sm font-mono">
              {address ? (
                user?.username && user.username.trim() !== "" ? (
                  `@${processUsername(user.username)}`
                ) : (
                  `${address.slice(0, 4)}...${address.slice(-4)}`
                )
              ) : (
                <ConnectButton />
              )}
            </div>
            <div className="flex items-center gap-3 relative z-30">
              <button
                onClick={handleEditClick}
                className="w-8 h-8 dark:bg-white/10 bg-[#141313]/5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer relative z-40"
                style={{ pointerEvents: "auto" }}
              >
                <FaEdit className="dark:text-white/70 text-[#141313] text-sm" />
              </button>
            </div>
          </div>
          {/* Edit Username Card */}
          {showEditCard && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
              <div className="dark:bg-[#050A1E] bg-white border border-white/10 rounded-xl p-6 max-w-md w-full relative z-[10000]">
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
                        maxLength={10}
                        className="w-full pl-8 pr-4 py-3 dark:bg-white/5 bg-[#141313]/5 border border-white/10 rounded-lg dark:text-white text-black placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#3BC3DB] disabled:opacity-50"
                      />
                    </div>
                    {isUsernameAvailable !== null && (
                      <p
                        className={`${isUsernameAvailable
                          ? "text-green-500"
                          : "text-red-500"
                          } text-xs mt-2`}
                      >
                        {isUsernameAvailable
                          ? "Username available"
                          : "Username not available"}
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
                      disabled={
                        enableChange ||
                        !username?.trim() ||
                        isUsernameAvailable === false ||
                        isSubmitting
                      }
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
            <div className="absolute inset-0 bg-gradient-to-l from-[#3BC3DB] to-[#0C8CE0] dark:opacity-[0.2] opacity-[0.08] pointer-events-none rounded-xl" />
            <div className="relative z-10 text-black dark:text-white">
              <h2 className="dark:text-white/80 text-[#0C8CE0] lg:text-[20px] mb-2 text-center font-raleway font-semibold">
                Total Balance (Platform Tokens Only)
              </h2>
              <div className="lg:text-[50px] text-[24px] font-bold mb-2 font-raleway text-center">
                ${formatCurrency(totalBalance)}
              </div>
              <div
                className={`text-sm text-center ${balanceChange.amount >= 0 ? "text-green-400" : "text-red-400"
                  }`}
              >
                {balanceChange.amount >= 0 ? "▲" : "▼"}{" "}
                {balanceChange.percentage >= 0 ? "+" : ""}
                {balanceChange.percentage.toFixed(2)}% [$
                {balanceChange.amount >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(balanceChange.amount))}]
              </div>
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
              Platform Token Holdings ({filteredHoldings.length})
            </button>
            <button
              className={`pb-1 transition cursor-pointer ${activeTab === "launched"
                ? "border-white dark:text-white text-[#141313]/75"
                : "border-transparent dark:text-white/30 text-black/60"
                }`}
              onClick={() => setActiveTab("launched")}
            >
              Tokens Deployed
            </button>
          </div>
          {/* Tab Content */}
          {activeTab === "holdings" ? (
            <div className="space-y-4">
              {tokenHoldingsLoading ? (
                <div className="text-center py-8">
                  <p className="dark:text-white/70 text-[#141313]/75">
                    Loading token holdings...
                  </p>
                </div>
              ) : filteredHoldings.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-start">
                  <p className="dark:text-white/70 text-[#141313]/75">
                    No platform token holdings found
                  </p>
                  <p className="dark:text-white/50 text-[#141313]/50 text-sm mt-2">
                    Only tokens launched on this platform are displayed here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHoldings.map((token, i) => (
                    <div
                      key={i}
                      className="dark:bg-[#0B132B] bg-[#141313]/5 rounded-xl px-5 py-4 flex justify-between items-center"
                    >
                      <Link
                        className="flex items-center gap-3"
                        to={`/trade/${token.contractAddress}`}
                      >
                        {token.logo ? (
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ${token.logo ? "hidden" : ""
                            }`}
                        />
                        <div>
                          <span className="font-bold text-sm text-black dark:text-white block">
                            {token.symbol}
                          </span>
                          <span className="text-xs text-black/60 dark:text-white/60">
                            {token.name}
                          </span>
                        </div>
                      </Link>
                      <div className="text-sm dark:text-white/70 text-[#141313]/75 text-right">
                        <div>
                          {Number(token.formattedBalance).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </div>

                        <div className="text-xs opacity-60">
                          {token.isLoadingPrice
                            ? "Loading..."
                            : token.usdValue && token.usdValue > 0
                              ? `$${formatCurrency(token.usdValue)}`
                              : "$0.00"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div ref={containerRef} className="space-y-4">
                {launchedTokens.map(
                  ({ name, symbol, createdAt, tokenAddress }, i) => (
                    <div
                      key={i}
                      className="dark:bg-[#0B132B] bg-[#141313]/5 rounded-xl px-5 py-4 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                        <Link
                          to={`/trade/${tokenAddress}`}
                          className="font-bold text-sm text-black dark:text-white"
                        >
                          {name} ({symbol})
                        </Link>
                      </div>
                      <div className="text-sm dark:text-white/70 text-[#141313]/75">
                        Deployed: {formatUTCDate(createdAt)}
                      </div>
                    </div>
                  )
                )}
                <p>{loading && "Please wait...."}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={onEdit} className="bg-red-500 flex flex-col">
        <input
          type="text"
          inputMode="url"
          name="website"
          id=""
          placeholder="enter here website"
          onChange={handleChange}
          className="p-2 border"
        />
        <input
          type="text"
          name="description"
          id=""
          placeholder="enter here description"
          className="p-2 border"
          onChange={handleChange}
        />
        <input
          type="text"
          inputMode="url"
          name="twitter"
          id=""
          placeholder="enter here twitter"
          className="p-2 border"
          onChange={handleChange}
        />
        <input
          type="text"
          inputMode="url"
          name="telegram"
          id=""
          placeholder="enter here enter telegram"
          className="p-2 border"
          onChange={handleChange}
        />

        <input
          type="file"
          name="logo"
          id=""
          onChange={handleFile}
          className="p-2 border"
        />

        <button type="submit" className="p-2">
          Submit
        </button>
      </form>
      <Footer />
    </div>
  );
};

export default Profile;
