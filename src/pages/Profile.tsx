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
import { useApiClient } from "../lib/api";
import { AlchemyTokenDiscovery } from "../web3/tokenholding";
import axios from "axios";
import { debounce } from "lodash";
import { getPureAmountOutMarketCap, getPureV2AmountOutMarketCap } from "../web3/readContracts";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  ETH_USDT_PRICE_FEED_ADDRESSES,
  PRICE_GETTER_ABI,
  PRICE_GETTER_ADDRESSES,
} from "../web3/config";
import { processUsername } from "../lib/username";
import RocketLoader from "../components/generalcomponents/Loader";
import { Link } from "react-router-dom";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { FaXTwitter } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa6";
import { UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import CopyButton from "../components/generalcomponents/CopyButton";

interface launchedToken {
  id: string;
  name: string;
  symbol: string;
  createdAt: string;
  tokenAddress: string;
  website?: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  image?: {
    name: string;
    path: string;
  };
  tokenVersion?: "token_v1" | "token_v2";
  tokenImageId?: string;
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
  logo: File | null;
};
const Profile = () => {
  const networkInfo = useNetworkEnvironment();
  const base = useApiClient();
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
  const [showEditTokenModal, setShowEditTokenModal] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      const response = request.data.data;
      setAllToken(response || []);
      // console.log("All tokens from DB:", response);
    } catch (error) {
      console.error("Error fetching all tokens:", error);
      setAllToken([]);
    }
  }, [base]);

  // Initialize - fetch all tokens from database
  useEffect(() => {
    fetchAllTokens();
  }, [fetchAllTokens]);

  // Fetch token price in ETH for a specific token
  const fetchTokenPrice = useCallback(
    async (tokenAddress: string): Promise<number> => {
      try {
        const token = launchedTokens.find(t => t.tokenAddress === tokenAddress);
        const isV2 = token?.tokenVersion === "token_v2";

        const fn = isV2 ? getPureV2AmountOutMarketCap : getPureAmountOutMarketCap;
        // const fn = getPureAmountOutMarketCap;
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
    [networkInfo.chainId]
  );

  // Fetch token holdings and their prices
  const fetchTokenHoldings = useCallback(
    async (silent = false) => {
      if (!address) return;

      if (!silent) setTokenHoldingsLoading(true);
      try {
        // Get all user's token holdings
        const holdings = await AlchemyTokenDiscovery.getAllTokenBalances(
          address,
          networkInfo.chainId
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
    [address, fetchTokenPrice, ethPriceUSD, networkInfo.chainId]
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

  // console.log("Current total balance at 1 index:", totalBalance);

  // track balance
  const trackBalance = useCallback(async () => {
    try {
      // console.log("Tracking balance for user:", address);
      // console.log("Current total balance:", totalBalance);
      const request = await base.post("track-balance", {
        currentBalance: totalBalance.toString(),
        wallet: String(address),
      });
      const { balanceChange: apiAmount, percentageChange: apiPct } =
        request.data.data;
      // console.log("API response:", request.data.data);
      // update state from API
      setBalanceChange({ amount: apiAmount, percentage: apiPct });
      return request.data;
    } catch (error) {
      console.log(error);
    }
  }, [address, totalBalance, base]);

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
  const findUsername = useCallback(
    async (query = "") => {
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
    },
    [base]
  );

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
          )}&page=${pageNum}&include=image`,
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
    [base]
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

  const validateLogo = async (file: File): Promise<string | null> => {
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    const maxSizeMB = 4.5;
    const minWidth = 100;

    if (!validTypes.includes(file.type)) {
      return "Unsupported file format. Only PNG, JPG, WEBP are allowed.";
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return "File size exceeds 4.5MB.";
    }

    const image = new Image();
    const imageURL = URL.createObjectURL(file);

    return new Promise((resolve) => {
      image.onload = () => {
        if (image.width < minWidth || image.height < minWidth) {
          resolve("Image dimensions must be at least 100x100px.");
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(imageURL);
      };
      image.onerror = () => {
        resolve("Unable to read the image file.");
        URL.revokeObjectURL(imageURL);
      };
      image.src = imageURL;
    });
  };

  const forceSquareImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) return reject("Failed to read image file.");
        img.src = e.target.result as string;
      };

      img.onload = () => {
        const size = Math.min(img.width, img.height); // crop to center square
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context error");

        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

        canvas.toBlob((blob) => {
          if (!blob) return reject("Failed to convert canvas to blob.");
          const squareFile = new File([blob], file.name, { type: file.type });
          resolve(squareFile);
        }, file.type);
      };

      img.onerror = () => reject("Unable to load image.");
      reader.readAsDataURL(file);
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditToken((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsLogoLoading(true);
      const error = await validateLogo(file);
      if (error) {
        setLogoError(error);
        setLogo(null);
      } else {
        const squareFile = await forceSquareImage(file);
        setLogo(squareFile);
        setLogoError("");
      }
      setIsLogoLoading(false);
    }
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setIsLogoLoading(true);

    const error = await validateLogo(file);
    if (error) {
      setLogoError(error);
      setLogo(null);
      setEditToken((prev) => ({ ...prev, logo: null }));
    } else {
      const squareFile = await forceSquareImage(file);
      setLogo(squareFile); // for preview
      setLogoError("");
      setEditToken((prev) => ({ ...prev, logo: squareFile }));
    }

    setIsLogoLoading(false);
  };
  const openFilePicker = () => inputRef.current?.click();

  const onEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTokenId) {
      toast.error("No token selected for editing.");
      return;
    }

    const { description, website, twitter, telegram, logo } = editToken;
    const formData = new FormData();
    if (address) formData.append("wallet", address);
    if (description) formData.append("description", description);
    if (website) formData.append("website", website);
    if (twitter) formData.append("twitter", twitter);
    if (telegram) formData.append("telegram", telegram);
    if (logo) formData.append("logo", logo);

    try {
      const req = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}update-token/${editingTokenId}`,
        {
          method: "PATCH",
          body: formData,
        }
      );
      const res = await req.json();

      if (!req.ok) {
        const errorMessage = res?.message || res?.error || JSON.stringify(res);
        console.error("Update failed:", errorMessage);
        toast.error(`Update failed: ${errorMessage}`);
        return;
      }

      toast.success("Token information updated successfully.");
      setShowEditTokenModal(false);
      findHolderToken(1, address!, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Unexpected error:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred while updating.";
      toast.error(`Error: ${message}`);
    }
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
                {launchedTokens.map((token, i) => (
                  <div
                    key={i}
                    className="dark:bg-[#0B132B] bg-[#141313]/5 rounded-xl px-5 py-4 flex flex-col sm:flex-row justify-between items-start"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        {token.image?.path && (
                          <div className="flex items-center mb-1">
                            {token.tokenImageId && (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL}${token.image?.path
                                  }`}
                                alt={`${token.symbol} logo`}
                                className="w-10 h-10 rounded-md mt-2"
                                crossOrigin=""
                              />
                            )}
                          </div>
                        )}
                        <Link
                          to={`/trade/${token.tokenAddress}`}
                          className="font-bold text-sm text-black dark:text-white"
                        >
                          {token.name} ({token.symbol})
                        </Link>
                        <div className="flex justify-end items-center gap-2 mt-1">
                          {token.twitter && (
                            <a
                              href={token.twitter}
                              className="p-2 rounded-full border border-black/50 dark:border-white/50 dark:text-white"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {/* Twitter SVG */}
                              <FaXTwitter className="text-black dark:text-white text-[10px]" />
                            </a>
                          )}
                          {token.telegram && (
                            <a
                              href={token.telegram}
                              className=""
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaTelegram className="text-black dark:text-white text-[27px]" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        {token.description && (
                          <p className="text-sm dark:text-white/70 text-[#141313]/75 lg:max-w-[280px]">
                            {token.description}
                          </p>
                        )}
                        <div className="flex items-center">
                          <p className="text-sm md:text-base dark:text-[#B6B6B6] text-[#141313] ">
                            Address: {token.tokenAddress.slice(0, 6)}...
                            {token.tokenAddress.slice(-4)}
                          </p>
                          <CopyButton value={token.tokenAddress} />
                        </div>
                        {token.website && (
                          <p className="text-sm dark:text-white/70 text-[#141313]/75 lg:max-w-[280px]">
                            <a
                              href={
                                token.website.startsWith("http")
                                  ? token.website
                                  : `https://${token.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {token.website}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col justify-start">
                      <p className="text-sm dark:text-white/70 text-[#141313]/75">
                        Deployed: {formatUTCDate(token.createdAt)}
                      </p>
                      {token.website && (
                        <a
                          href={token.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] dark:text-white text-black truncate max-w-[250px] cursor-pointer"
                        >
                          {token.website.startsWith("http")}
                        </a>
                      )}
                      <div
                        onClick={() => {
                          setEditToken({
                            website: token.website || "",
                            description: token.description || "",
                            twitter: token.twitter || "",
                            telegram: token.telegram || "",
                            logo: {} as File,
                          });
                          setEditingTokenId(token.id);
                          setShowEditTokenModal(true);
                        }}
                        className="flex items-center justify-end gap-2 mt-2 cursor-pointer"
                      >
                        <p className="text-black dark:text-white">Edit Info</p>
                        <button className="w-8 h-8 dark:bg-white/10 bg-[#141313]/5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                          <FaEdit className="dark:text-white/70 text-[#141313] text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <p>{loading && "Please wait...."}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
      {showEditTokenModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={onEdit}
            className="dark:bg-[#050A1E] bg-white border border-white/10 rounded-xl p-6 w-full max-w-lg relative max-h-[70vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white text-black">
              Edit Token Info
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm dark:text-white/70 text-black mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={editToken.website}
                  onChange={handleChange}
                  className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
                />
              </div>

              <div>
                <label className="block text-sm dark:text-white/70 text-black mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Update with a short description"
                  maxLength={200}
                  name="description"
                  value={editToken.description}
                  onChange={handleChange}
                  className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
                />
              </div>

              <div>
                <label className="block text-sm dark:text-white/70 text-black mb-1">
                  X (Twitter)
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={editToken.twitter}
                  onChange={handleChange}
                  className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
                />
              </div>

              <div>
                <label className="block text-sm dark:text-white/70 text-black mb-1">
                  Telegram
                </label>
                <input
                  type="url"
                  name="telegram"
                  value={editToken.telegram}
                  onChange={handleChange}
                  className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
                />
              </div>

              <div className="flex flex-col gap-[10px] mt-[34px]">
                <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
                  Add Logo{" "}
                  <span className="text-Primary font-medium">(Optional)</span>
                </label>

                <div
                  className={`border-2 border-dashed ${dragActive ? "border-[#3BC3DB]" : "border-Primary"
                    } rounded-xl dark:bg-[#ffffff0a] bg-[#01061c0d]
                      flex flex-col items-center justify-center py-10 px-4 text-center cursor-pointer
                      transition duration-200 hover:opacity-80 w-full relative`}
                  onClick={openFilePicker}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  {isLogoLoading ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 border-4 border-dashed border-gray-300 dark:border-white/20 rounded-full animate-spin"></div>
                      <p className="text-sm mt-2 text-black dark:text-white">
                        Processing image...
                      </p>
                    </div>
                  ) : !logo ? (
                    <>
                      <div className="bg-gray-600 p-4 rounded-lg mb-4">
                        <UploadCloud className="w-8 h-8 text-white" />
                      </div>
                      <p className="dark:text-white text-black font-medium">
                        <span className="">Click to upload</span> or drag and
                        drop
                      </p>
                      <p className="text-sm dark:text-white/60 text-black mt-1">
                        PNG, JPG, WEBP • Max 4.5MB • Min 100x100px
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={URL.createObjectURL(logo)}
                        alt="Selected Logo"
                        className="max-h-32 object-contain rounded-lg"
                      />
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[#3BC3DB] font-semibold truncate max-w-[180px]">
                          {logo.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => setLogo(null)}
                          className="text-red-400 hover:text-red-500 "
                          aria-label="Remove selected logo"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
                {logoError && (
                  <p className="text-red-500 text-sm mt-1">{logoError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-4">
              <button
                type="button"
                onClick={() => setShowEditTokenModal(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 dark:bg-white/10 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
            <button
              onClick={() => setShowEditTokenModal(false)} // or your close handler
              className="absolute top-4 right-4 w-8 h-8 dark:bg-white/10 bg-[#141313]/5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <FaTimes className="dark:text-white/70 text-[#141313] text-sm" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
