// I want to add icon effects to the top of the top to switch chains from BNB to ETH, The active chain should also be highlighted

// safu-dapp/src/pages/Launch.tsx
import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  type FormEvent,
  type JSX,
} from "react";
import * as XLSX from "xlsx";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  type BaseError,
  useAccount,
} from "wagmi";
import { LAUNCHER_ABI_V4, SAFU_LAUNCHER_ADDRESSES_V4, ROUTER_ADDRESSES_LIST, SAFU_TOKEN_ADDRESSES, TOKEN_ABI } from "../web3/config";
import { ethers } from "ethers";
// import { verifyContract } from "../web3/etherscan";
import Navbar from "../components/launchintro/Navbar";
import DustParticles from "../components/generalcomponents/DustParticles";
import Footer from "../components/launchintro/Footer";
// import rocket from "../assets/rocket.png";
import { CircleCheckBig, Upload, UploadCloud } from "lucide-react";
import { X } from "lucide-react";
import { BsChevronDown } from "react-icons/bs";
import { IoMdAddCircleOutline } from "react-icons/io";
import { useUser } from "../context/user.context";
import RocketLoader from "../components/generalcomponents/Loader";
import { v4 as uuidv4 } from "uuid";
import RocketSpinner from "../components/generalcomponents/RocketSpinner";
import RocketSpinner2 from "../components/generalcomponents/RocketSpinner2";
import { getPureMetrics } from "../web3/readContracts";
import { useNavigate } from "react-router-dom";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { formatRawAmount } from "../lib/formatting";
import ChainSwitcher from "../components/generalcomponents/ChainSwitcher";

/**
 * Description placeholder
 *
 * @interface ValidationError
 * @typedef {ValidationError}
 */
interface ValidationError {
  field: string;
  message: string;
}



/**
 * Description placeholder
 *
 * @export
 * @returns {*}
 */
export default function Launch(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { saveOrFetchUser } = useUser();
  const networkInfo = useNetworkEnvironment();
  const safuLauncherAddress = SAFU_LAUNCHER_ADDRESSES_V4[networkInfo.chainId];

  // Basic fields
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState<number>(0);
  const [supplyInput, setSupplyInput] = useState("");
  const [website, setWebsite] = useState<string>("");
  const [telegram, setTelegram] = useState<string>("");
  const [twitter, setTwitter] = useState<string>("");
  const [bundleMaxAmount, setBundleMaxAmount] = useState<number>(0);
  const [combinedMetrics, setCombinedMetrics] = useState<bigint[] | null>(null);

  const [description, setDescription] = useState<string>("");
  const [logo, setLogo] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [isLogoLoading, setIsLogoLoading] = useState(false);

  const navigate = useNavigate();
  const [wlCsvText, setWlCsvText] = useState("");

  const [whitelistUpload, setWhitelistUpload] = useState<
    { address: string; cap: number }[]
  >([]);

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

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const openFilePicker = () => inputRef.current?.click();

  const increase = () =>
    setSupply((prev) => {
      const newVal = prev + 1;
      setSupplyInput(formatNumberWithCommas(newVal));
      return newVal;
    });

  const decrease = () =>
    setSupply((prev) => {
      const newVal = Math.max(1, prev - 1);
      setSupplyInput(formatNumberWithCommas(newVal));
      return newVal;
    });

  function formatNumberWithCommas(value: number | string) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function removeCommas(value: string) {
    return value.replace(/,/g, "");
  }

  const parseWlCsv = (text: string) => {
    const rawLines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l);

    // strip header if present
    if (rawLines.length > 0) {
      const hdr = rawLines[0].split(",").map((s) => s.trim().toLowerCase());
      if (
        (hdr[0] === "address" || hdr[0] === "addr") &&
        hdr[1]?.startsWith("cap")
      ) {
        rawLines.shift();
      }
    }

    const parsed: { address: string; cap: number }[] = [];
    const errs: ValidationError[] = [];

    rawLines.forEach((line, idx) => {
      const [addr, capStr] = line.split(",").map((s) => s.trim());
      if (!ethers.isAddress(addr)) {
        errs.push({
          field: "whitelist",
          message: `Line ${idx + 1}: bad address`,
        });
        return;
      }
      const pct = parseFloat(capStr);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        errs.push({
          field: "whitelist",
          message: `Line ${idx + 1}: cap must be (0,100]`,
        });
        return;
      }
      parsed.push({ address: addr, cap: pct });
    });

    if (errs.length > 0) {
      setValidationErrors(errs);
    } else {
      // Replace existing entries instead of appending
      setWhitelistUpload(parsed);
      setValidationErrors((prev) =>
        prev.filter((e) => e.field !== "whitelist")
      );
    }
  };

  // Updated file upload handler with Excel support
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      // Handle CSV files
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setWlCsvText(text);
        parseWlCsv(text);
      };
      reader.readAsText(file);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert to CSV format
          const csvData = XLSX.utils.sheet_to_csv(worksheet);

          setWlCsvText(csvData);
          parseWlCsv(csvData);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          setValidationErrors([
            {
              field: "whitelist",
              message:
                "Error parsing Excel file. Please check the file format.",
            },
          ]);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setValidationErrors([
        {
          field: "whitelist",
          message: "Unsupported file format. Please upload CSV or Excel files.",
        },
      ]);
    }

    // Reset the input so the same file can be uploaded again
    e.target.value = "";
  };

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

  // const [statusMessage, setStatusMessage] = useState("");
  const [myStringIndex, setMyStringIndex] = useState(`token_${uuidv4()}`);
  const [dexRouter, setDexRouter] = useState("");
  // const [waitingForVerification, setWaitingForVerification] = useState(false); // State for waiting message

  // Toggles
  const [enableTaxOnDex, setEnableTaxOnDex] = useState(false);
  const [enableWhitelist, setEnableWhitelist] = useState(false);
  const [startNow, setStartNow] = useState(true);
  const [isMaxWalletAmountOnSafu, setIsMaxWalletAmountOnSafu] = useState(false);
  const [maxWalletAmountOnSafuInput, setMaxWalletAmountOnSafuInput] =
    useState(""); // raw input
  const [maxWalletAmountOnSafu, setMaxWalletAmountOnSafu] = useState<number>(0);
  const [maxWhitelist, setMaxWhitelist] = useState<number>(0);
  const [initialPool, setInitialPool] = useState<number>(0);
  const [creationFeeETH, setCreationFeeETH] = useState<number>(0);
  const [creationHolderThresholdBps, setCreationHolderThresholdBps] = useState<number>(0);
  const [lpOption, setLpOption] = useState<"lock" | "burn">("lock");
  const [enableBundle, setEnableBundle] = useState(false);
  const [enableTaxOnSafu, setEnableTaxOnSafu] = useState(false);
  const walletInputRef = useRef<HTMLInputElement>(null);
  const [deployError, setDeployError] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");

  // Dynamic groups...
  const [taxList, setTaxList] = useState<{ addr: string; bps: number }[]>([]);
  const [bundleList, setBundleList] = useState<
    { addr: string; pct: number; pctInput: string }[]
  >([]);
  const [bundleEthInput, setBundleEthInput] = useState(""); // raw input
  const [bundleEth, setBundleEth] = useState<number>(0);
  const [platformFeeList, setPlatformFeeList] = useState([
    { addr: "", pct: 0, pctInput: "" },
  ]);
  const [platformFeeInput, setPlatformFeeInput] = useState("");
  const [platformFeeBps, setPlatformFeeBps] = useState<number>(0);
  const [dexFeeInput, setDexFeeInput] = useState("");
  const [dexFeeBps, setDexFeeBps] = useState<number>(0);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isFormValid, setIsFormValid] = useState(false);

  const { data: txHash, isPending, error, writeContract } = useWriteContract();
  const {
    data: result,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // Handlers to add/remove entries
  const addItem = <T,>(
    arr: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    item: T,
    max: number
  ) => {
    if (arr.length >= max) return;
    setter([...arr, item]);
  };

  const removeItem = <T,>(
    arr: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    idx: number
  ) => {
    setter(arr.filter((_, i) => i !== idx));
  };

  const [newAddr, setNewAddr] = useState("");
  const [newBps, setNewBps] = useState(0);

  const addTaxRecipient = () => {
    if (taxList.length >= 5 || !newAddr || newBps <= 0) return;
    setTaxList([...taxList, { addr: newAddr, bps: newBps * 100 }]);
    setNewAddr("");
    setNewBps(0);

    // Refocus on wallet input
    setTimeout(() => {
      walletInputRef.current?.focus();
    }, 0);
  };

  const removeTaxRecipient = (index: number) => {
    setTaxList(taxList.filter((_, i) => i !== index));
  };

  // Address validation helper
  const isValidAddress = (addr: string): boolean => {
    try {
      return ethers.isAddress(addr) && addr !== ethers.ZeroAddress;
    } catch {
      return false;
    }
  };

  const findDuplicateAddresses = (
    addresses: string[]
  ): { duplicates: string[]; positions: number[][] } => {
    const addressCount = new Map<string, number[]>();
    const duplicates: string[] = [];
    const positions: number[][] = [];

    // Count occurrences and track positions
    addresses.forEach((addr, index) => {
      if (!addr || !addr.trim()) return; // Skip empty addresses

      const normalizedAddr = addr.toLowerCase().trim();
      if (!addressCount.has(normalizedAddr)) {
        addressCount.set(normalizedAddr, []);
      }
      addressCount.get(normalizedAddr)!.push(index);
    });

    // Find duplicates
    addressCount.forEach((indices, addr) => {
      if (indices.length > 1) {
        duplicates.push(addr);
        positions.push(indices);
      }
    });

    return { duplicates, positions };
  };

  const {
    data: safuBalance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract(
    SAFU_TOKEN_ADDRESSES && address
      ? {
        ...TOKEN_ABI,
        address: SAFU_TOKEN_ADDRESSES[networkInfo.chainId] as `0x${string}`,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }
      : undefined
  );

  const {
    data: safuSupply,
    isLoading: isLoadingSupply,
    refetch: refetchSupply,
  } = useReadContract(
    SAFU_TOKEN_ADDRESSES && address
      ? {
        ...TOKEN_ABI,
        address: SAFU_TOKEN_ADDRESSES[networkInfo.chainId] as `0x${string}`,
        functionName: "totalSupply",
      }
      : undefined
  );

  // Comprehensive validation function
  const validateForm = useCallback(async (): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    if (!isConnected) {
      errors.push({
        field: "connection",
        message: "Please connect your wallet to launch a token.",
      });
    }
    // Basic field validation
    if (!name.trim()) {
      errors.push({ field: "name", message: "Token name is required" });
    }
    if (!symbol.trim()) {
      errors.push({ field: "symbol", message: "Token symbol is required" });
    }
    if (supply <= 0) {
      errors.push({
        field: "supply-basic",
        message: "Supply must be greater than 0",
      });
    }

    if (logo) {
      const logoError = await validateLogo(logo);
      if (logoError) {
        errors.push({
          field: "logo",
          message: logoError,
        });
      }
    }

    // Max wallet amount validation
    if (isMaxWalletAmountOnSafu) {
      if (maxWalletAmountOnSafu > maxWhitelist) {
        errors.push({
          field: "maxWalletAmountOnSafu",
          message: `Max wallet amount on Safu must be less than ${maxWhitelist}%`,
        });
      }

      if (maxWalletAmountOnSafu <= 0) {
        errors.push({
          field: "maxWalletAmountOnSafu",
          message: "Max wallet amount on Safu must be greater than 0",
        });
      }
    }

    // Tax validation
    if (enableTaxOnDex) {
      if (dexFeeBps > 10) {
        errors.push({
          field: "dexFee",
          message: "Dex fee cannot exceed 10%",
        });
      }

      if (dexFeeBps < 0) {
        errors.push({
          field: "dexFee",
          message: "Dex fee cannot be negative",
        });
      }

      if (taxList.length > 5) {
        errors.push({
          field: "tax",
          message: "Maximum 5 tax recipients allowed",
        });
      }

      // Validate tax addresses and percentages
      taxList.forEach((tax, index) => {
        if (tax.addr && !isValidAddress(tax.addr)) {
          errors.push({
            field: "tax",
            message: `Tax recipient ${index + 1}: Invalid address`,
          });
        }
        if (tax.bps < 0 || tax.bps > 10000) {
          errors.push({
            field: "tax",
            message: `Tax recipient ${index + 1
              }: percentage must be between 0-100`,
          });
        }
      });

      const totalTaxDistBps = taxList.reduce((sum, t) => sum + t.bps, 0);
      if (totalTaxDistBps !== 10000) {
        errors.push({
          field: "tax",
          message: "Tax recipients’ total percentage must sum to 100%",
        });
      }

      // Check for incomplete tax entries
      const incompleteTaxEntries = taxList.some(
        (tax) => !tax.addr || tax.bps <= 0
      );
      if (incompleteTaxEntries) {
        errors.push({
          field: "tax",
          message:
            "All tax recipients must have valid addresses and percentages > 0",
        });
      }

      // Check for duplicate tax addresses
      const taxAddresses = taxList
        .map((tax) => tax.addr)
        .filter((addr) => addr && addr.trim());
      if (taxAddresses.length > 0) {
        const { duplicates, positions } = findDuplicateAddresses(taxAddresses);
        duplicates.forEach((duplicateAddr, index) => {
          const duplicatePositions = positions[index]
            .map((pos) => pos + 1)
            .join(", ");
          errors.push({
            field: "tax",
            message: `Duplicate tax recipient address found at positions: ${duplicatePositions} (${duplicateAddr.slice(
              0,
              6
            )}...${duplicateAddr.slice(-4)})`,
          });
        });
      }
    }

    // Whitelist validation
    if (enableWhitelist) {
      if (whitelistUpload.length > 200) {
        errors.push({
          field: "whitelist",
          message: "Maximum 200 whitelist addresses allowed",
        });
      }

      // Validate whitelist addresses
      whitelistUpload.forEach((addr, index) => {
        if (addr && !isValidAddress(addr.address)) {
          errors.push({
            field: "whitelist",
            message: `Whitelist address ${index + 1}: Invalid address`,
          });
        }
        if (isMaxWalletAmountOnSafu) {
          if (addr.cap > maxWalletAmountOnSafu) {
            errors.push({
              field: "whitelist",
              message: `Entry ${index + 1
                }: max cap for whitelisted addrs must not be greater than max Wallet Amount On Safu: ${maxWalletAmountOnSafu}%.`,
            });
          }
        }

        if (addr.cap <= 0 || addr.cap > maxWhitelist) {
          errors.push({
            field: "whitelist",
            message: `Entry ${index + 1
              }: max cap for whitelisted addrs is ${maxWhitelist}%.`,
          });
        }
      });

      // Check for empty whitelist entries
      const emptyWhitelistEntries = whitelistUpload.some(
        (addr) => !addr.address.trim()
      );
      if (emptyWhitelistEntries) {
        errors.push({
          field: "whitelist",
          message: "All whitelist entries must have valid addresses",
        });
      }

      // Check for duplicate whitelist addresses
      const validWhitelistAddresses = whitelistUpload
        .filter((addr) => addr && addr.address.trim())
        .map((addr) => addr.address);
      if (validWhitelistAddresses.length > 0) {
        const { duplicates, positions } = findDuplicateAddresses(
          validWhitelistAddresses
        );
        duplicates.forEach((duplicateAddr, index) => {
          const duplicatePositions = positions[index]
            .map((pos) => pos + 1)
            .join(", ");
          errors.push({
            field: "whitelist",
            message: `Duplicate whitelist address found at positions: ${duplicatePositions} (${duplicateAddr.slice(
              0,
              6
            )}...${duplicateAddr.slice(-4)})`,
          });
        });
      }
    }

    const calculateBundleTokens = (
      bundleEth: number,
      supply: number
    ): number => {
      // Simulate the smart contract calculation
      // These values should match your smart contract constants
      // const TRADE_FEE_BPS = Number(getTradeFeeBps); // 0.3% - adjust to match your contract
      const TRADE_FEE_BPS = Number(combinedMetrics?.[9]); // 0.3% - adjust to match your contract
      const virtualEthReserve = initialPool; // 2 ETH - from your contract

      if (bundleEth <= 0) return 0;

      // Calculate fees (you'll need to include platform fee if enabled)
      const tradeFee = (bundleEth * TRADE_FEE_BPS) / 10000;
      const netEth = bundleEth - tradeFee; // Note: platform fee would also be subtracted

      // Simplified bonding curve calculation
      // This is a rough approximation - you may need to adjust based on your exact curve
      const virtualTokenReserve = supply;
      const k = virtualEthReserve * virtualTokenReserve;

      // Calculate tokens out using the bonding curve formula
      const newEthReserve = virtualEthReserve + netEth;
      const newTokenReserve = k / newEthReserve;
      const tokensOut = virtualTokenReserve - newTokenReserve;

      return tokensOut;
    };

    // Bundle validation
    if (enableBundle) {
      if (bundleList.length > 30) {
        errors.push({
          field: "bundle",
          message: "Maximum 30 bundle entries allowed",
        });
      }

      if (bundleEth <= 0) {
        errors.push({
          field: "bundle",
          message: "Bundle ETH amount must be greater than 0",
        });
      }

      if (bundleEth > 0 && supply <= 0) {
        errors.push({
          field: "supply-bundle",
          message:
            "Please enter the total supply before adding ETH for bundling.",
        });
      }

      if (bundleList.length === 0) {
        errors.push({
          field: "bundle",
          message:
            "At least one bundle recipient is required when bundle is enabled",
        });
      }

      // Calculate estimated tokens that would be purchased
      if (bundleEth > 0 && supply > 0) {
        const estimatedTokens = calculateBundleTokens(bundleEth, supply);
        const maxAllowedTokens = (supply * Number(bundleMaxAmount)) / 100; // 25% of supply

        if (estimatedTokens > maxAllowedTokens) {
          const maxEthForTokens =
            bundleEth * (maxAllowedTokens / estimatedTokens);
          errors.push({
            field: "bundle",
            message: `Bundle would exceed ${bundleMaxAmount}% of supply. Maximum ETH for this supply: ~${maxEthForTokens.toFixed(
              4
            )} ETH`,
          });
        }
      }

      const capPercent = isMaxWalletAmountOnSafu
        ? maxWalletAmountOnSafu
        : maxWhitelist; // default 2% when custom cap is off

      // Precompute total tokens from the bundle
      const totalBundleTokens = calculateBundleTokens(bundleEth, supply);

      // Validate bundle addresses and percentages
      let totalBundlePercent = 0;
      bundleList.forEach((bundle, index) => {
        const isCreator = bundle.addr.toLowerCase() === address?.toLowerCase();

        // Compute how many tokens this wallet would get:
        const recipientTokens = (totalBundleTokens * bundle.pct) / 100;
        const maxAllowedTokens = (supply * capPercent) / 100;

        // If they’re *not* the creator and exceed the cap → error
        if (!isCreator && recipientTokens > maxAllowedTokens) {
          errors.push({
            field: "bundle",
            message: `Bundle recipient ${index + 1} (${bundle.addr
              }) would receive ${recipientTokens.toFixed(
                0
              )} tokens, exceeding the per‑wallet cap of ${maxAllowedTokens.toFixed(
                0
              )} tokens (${capPercent}% of total supply). Only the creator (${address}) may exceed this limit.`,
          });
        }

        if (bundle.addr && !isValidAddress(bundle.addr)) {
          errors.push({
            field: "bundle",
            message: `Bundle recipient ${index + 1}: Invalid address`,
          });
        }
        if (bundle.pct <= 0 || bundle.pct > 100) {
          errors.push({
            field: "bundle",
            message: `Bundle recipient ${index + 1
              }: Percentage must be between 0-100%`,
          });
        }
        totalBundlePercent += bundle.pct || 0;
      });

      // Check if bundle percentages sum to 100%
      if (bundleList.length > 0 && Math.abs(totalBundlePercent - 100) > 0.01) {
        errors.push({
          field: "bundle",
          message: "Bundle percentages must sum to exactly 100%",
        });
      }

      // Check for incomplete bundle entries
      const incompleteBundleEntries = bundleList.some(
        (bundle) => !bundle.addr || bundle.pct <= 0
      );
      if (incompleteBundleEntries) {
        errors.push({
          field: "bundle",
          message:
            "All bundle recipients must have valid addresses and percentages > 0",
        });
      }

      // Check for duplicate bundle addresses
      const bundleAddresses = bundleList
        .map((bundle) => bundle.addr)
        .filter((addr) => addr && addr.trim());
      if (bundleAddresses.length > 0) {
        const { duplicates, positions } =
          findDuplicateAddresses(bundleAddresses);
        duplicates.forEach((duplicateAddr, index) => {
          const duplicatePositions = positions[index]
            .map((pos) => pos + 1)
            .join(", ");
          errors.push({
            field: "bundle",
            message: `Duplicate bundle recipient address found at positions: ${duplicatePositions} (${duplicateAddr.slice(
              0,
              6
            )}...${duplicateAddr.slice(-4)})`,
          });
        });
      }
    }

    // Platform fee validation
    if (enableTaxOnSafu) {
      if (platformFeeBps > 5) {
        errors.push({
          field: "platformFee",
          message: "Platform fee cannot exceed 5%",
        });
      }

      if (platformFeeBps < 0) {
        errors.push({
          field: "platformFee",
          message: "Platform fee BPS cannot be negative",
        });
      }

      if (platformFeeList.length > 5) {
        errors.push({
          field: "platformFee",
          message: "Maximum 5 platform fee recipients allowed",
        });
      }

      if (platformFeeList.length === 0) {
        errors.push({
          field: "platformFee",
          message:
            "At least one platform fee recipient is required when platform fee is enabled",
        });
      }

      // Validate platform fee addresses and percentages
      let totalPlatformPercent = 0;
      platformFeeList.forEach((fee, index) => {
        if (fee.addr && !isValidAddress(fee.addr)) {
          errors.push({
            field: "platformFee",
            message: `Platform fee recipient ${index + 1}: Invalid address`,
          });
        }
        if (fee.pct <= 0 || fee.pct > 100) {
          errors.push({
            field: "platformFee",
            message: `Platform fee recipient ${index + 1
              }: Percentage must be between 0-100%`,
          });
        }
        totalPlatformPercent += fee.pct || 0;
      });

      // Check if platform fee percentages sum to 100%
      if (
        platformFeeList.length > 0 &&
        Math.abs(totalPlatformPercent - 100) > 0.01
      ) {
        errors.push({
          field: "platformFee",
          message: "Platform fee percentages must sum to exactly 100%",
        });
      }

      // Check for incomplete platform fee entries
      const incompletePlatformEntries = platformFeeList.some(
        (fee) => !fee.addr || fee.pct <= 0
      );
      if (incompletePlatformEntries) {
        errors.push({
          field: "platformFee",
          message:
            "All platform fee recipients must have valid addresses and percentages > 0",
        });
      }

      // Check for duplicate platform fee addresses
      const platformFeeAddresses = platformFeeList
        .map((fee) => fee.addr)
        .filter((addr) => addr && addr.trim());
      if (platformFeeAddresses.length > 0) {
        const { duplicates, positions } =
          findDuplicateAddresses(platformFeeAddresses);
        duplicates.forEach((duplicateAddr, index) => {
          const duplicatePositions = positions[index]
            .map((pos) => pos + 1)
            .join(", ");
          errors.push({
            field: "platformFee",
            message: `Duplicate platform fee recipient address found at positions: ${duplicatePositions} (${duplicateAddr.slice(
              0,
              6
            )}...${duplicateAddr.slice(-4)})`,
          });
        });
      }
    }

    return errors;
  }, [isConnected, name, symbol, supply, logo, isMaxWalletAmountOnSafu, enableTaxOnDex, enableWhitelist, enableBundle, enableTaxOnSafu, maxWalletAmountOnSafu, maxWhitelist, dexFeeBps, taxList, whitelistUpload, combinedMetrics, initialPool, bundleList, bundleEth, bundleMaxAmount, address, platformFeeBps, platformFeeList]);

  // Run validation whenever form data changes
  useEffect(() => {
    const runValidation = async () => {
      const errors = await validateForm();
      setValidationErrors(errors);
      setIsFormValid(errors.length === 0);
    };

    runValidation();
  }, [validateForm]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await getPureMetrics(networkInfo.chainId);
      setCombinedMetrics(metrics);
    };

    fetchMetrics();
    refetchBalance();
    refetchSupply();

    // <p>totalVolumeETH: {Number(combinedMetrics?.[0] || 0) / 1e18} ETH</p>
  }, [networkInfo.chainId, refetchBalance, refetchSupply]);

  useEffect(() => {
    if (isConfirmed && result) {
      const lastLog = result.logs[result.logs.length - 1];
      if (lastLog) {
        const topic1 = lastLog.topics[1] ?? "";
        const address = topic1.length
          ? ethers.getAddress("0x" + topic1.slice(-40))
          : "";
        setTokenAddress(address);
      }
    }
  }, [isConfirmed, result]);

  // With this (to convert percentage to BPS, handling decimals):
  const taxOnSafuBps = enableTaxOnSafu ? Math.round(platformFeeBps * 100) : 0;
  const taxOnDexBps = enableTaxOnDex ? Math.floor(dexFeeBps * 100) : 0;
  const maxWalletAmountOnSafuBps = isMaxWalletAmountOnSafu
    ? Math.floor(maxWalletAmountOnSafu * 100)
    : 0;

  const dexRouterOptions = React.useMemo(() => {
    const routers = ROUTER_ADDRESSES_LIST[networkInfo.chainId] ?? [];
    return [
      { value: "", label: "Select DEX Router" },
      ...routers.map((r) => ({ value: r.address, label: r.label })),
    ];
  }, [networkInfo.chainId]);

  console.log("dexRouterOptions", dexRouterOptions)

  // 4. Add an input handler for decimal validation (optional)
  const handlePlatformFeeBpsChange = (value: string) => {
    setPlatformFeeInput(value); // Always update the visible input

    if (value === "") {
      setPlatformFeeBps(0); // Optional: interpret empty input as 0
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setPlatformFeeBps(numValue);
    }
  };

  const handleDexFeeBpsChange = (value: string) => {
    setDexFeeInput(value); // Always update what the user types

    if (value === "") {
      setDexFeeBps(0); // Optional fallback for empty input
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setDexFeeBps(numValue);
    }
  };

  const handleMaxWalletBpsChange = (value: string) => {
    setMaxWalletAmountOnSafuInput(value);

    // Attempt parsing
    const parsed = parseFloat(value);

    if (!isNaN(parsed) && parsed >= 0) {
      setMaxWalletAmountOnSafu(parsed);
    }
  };

  const handleBundleEthChange = (value: string) => {
    setBundleEthInput(value);

    const parsed = parseFloat(value);

    if (!isNaN(parsed) && parsed >= 0) {
      setBundleEth(parsed);
    }
  };

  const taxOnSafuRecipientsAddrs = React.useMemo(
    () =>
      enableTaxOnSafu
        ? (platformFeeList.map((p) => p.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [enableTaxOnSafu, platformFeeList]
  );

  const taxOnSafuPercentArray = React.useMemo(
    () =>
      enableTaxOnSafu
        ? (platformFeeList.map((p) =>
          Math.floor(p.pct * 100)
        ) as readonly number[])
        : ([] as readonly number[]),
    [enableTaxOnSafu, platformFeeList]
  );

  const taxOnDexRecipientsAddrs = React.useMemo(
    () =>
      enableTaxOnDex
        ? (taxList.map((t) => t.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [enableTaxOnDex, taxList]
  );

  const initialCapsBps = React.useMemo(
    () =>
      enableWhitelist
        ? (whitelistUpload.map((e) =>
          Math.round(e.cap * 100)
        ) as readonly number[])
        : // Default to 100% for each whitelist entry
        ([] as readonly number[]),
    [enableWhitelist, whitelistUpload]
  );

  const taxOnDexPercentsArray = React.useMemo(
    () =>
      enableTaxOnDex
        ? (taxList.map((t) => t.bps) as readonly number[])
        : ([] as readonly number[]),
    [enableTaxOnDex, taxList]
  );

  const bundleAddrs = React.useMemo(
    () =>
      enableBundle
        ? (bundleList.map((b) => b.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [enableBundle, bundleList]
  );

  const bundleShares = React.useMemo(
    () =>
      enableBundle
        ? (bundleList.map((b) => Math.floor(b.pct * 100)) as readonly number[])
        : ([] as readonly number[]),
    [enableBundle, bundleList]
  );

  const deploymentFee = !isLoadingBalance || !isLoadingSupply ? (safuBalance! >= (creationHolderThresholdBps * (Number(safuSupply)) / 10000) ? 0 : creationFeeETH) : 0;
  const ethValue = enableBundle ? (ethers.parseEther(bundleEth.toString()) + BigInt(deploymentFee)) : BigInt(deploymentFee);

  console.log('deploymentFee', deploymentFee);
  console.log('ethValue', ethValue);

  const wlArray = React.useMemo(
    () =>
      enableWhitelist
        ? (whitelistUpload.map((e) => e.address) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [enableWhitelist, whitelistUpload]
  );

  // Build args
  const argArray = React.useMemo(
    () =>
      [
        name,
        symbol,
        ethers.parseUnits(supply.toString(), 18),
        lpOption === "lock",
        startNow,
        isMaxWalletAmountOnSafu,
        maxWalletAmountOnSafuBps,
        bundleAddrs,
        bundleShares,
        taxOnDexBps,
        taxOnDexRecipientsAddrs,
        taxOnDexPercentsArray,
        taxOnSafuBps,
        taxOnSafuRecipientsAddrs,
        taxOnSafuPercentArray,
        enableWhitelist,
        wlArray,
        initialCapsBps,
        dexRouter as `0x${string}`,
        myStringIndex
      ] as unknown as [
        string,
        string,
        bigint,
        boolean,
        boolean,
        boolean,
        bigint,
        readonly `0x${string}`[],
        readonly bigint[],
        bigint,
        readonly `0x${string}`[],
        readonly bigint[],
        bigint,
        readonly `0x${string}`[],
        readonly bigint[],
        boolean,
        readonly `0x${string}`[],
        readonly bigint[],
        `0x${string}`,
        string
      ],
    [
      name,
      symbol,
      supply,
      lpOption,
      startNow,
      isMaxWalletAmountOnSafu,
      maxWalletAmountOnSafuBps,
      bundleAddrs,
      bundleShares,
      taxOnDexBps,
      taxOnDexRecipientsAddrs,
      taxOnDexPercentsArray,
      taxOnSafuBps,
      taxOnSafuRecipientsAddrs,
      taxOnSafuPercentArray,
      enableWhitelist,
      wlArray,
      initialCapsBps,
      dexRouter,
      myStringIndex
    ]
  );

  const percentBundled = (
    (calculateBundleTokens(bundleEth, supply) / supply) *
    100
  ).toFixed(2);

  const { data: uniV2WETH } = useReadContract({
    ...LAUNCHER_ABI_V4,
    address: safuLauncherAddress,
    functionName: "WETH",
  });

  console.log("dexRouter", dexRouter)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Final validation check before submission
      const errors = await validateForm();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("symbol", symbol);
        formData.append("website", website);
        formData.append("description", description);
        formData.append("identifier", myStringIndex);
        formData.append("twitter", twitter);
        formData.append("telegram", telegram);

        // Add percentBundled to FormData
        if (enableBundle && bundleAddrs.length > 0) {
          formData.append("percentBundled", percentBundled.toString());
        }

        if (logo) formData.append("logo", logo);

        const message = [
          name,
          symbol,
          ethers.parseUnits(supply.toString(), 18),
          dexRouter,
          uniV2WETH,
          taxOnDexRecipientsAddrs,
          taxOnDexPercentsArray,
          taxOnDexBps,
          safuLauncherAddress,
        ];

        console.log("message", message);
        const abiCoder = new ethers.AbiCoder();

        const encodedMessage = abiCoder.encode(
          [
            "string",
            "string",
            "uint256",
            "address",
            "address",
            "address[]",
            "uint16[]",
            "uint16",
            "address",
          ],
          [...message]
        );
        const encodedMessageWithoutPrefix = encodedMessage.slice(2); // Remove "0x" prefix

        console.log(
          "Encoded message at deployToken Func:",
          encodedMessageWithoutPrefix
        );

        formData.append("verifyparameter", encodedMessageWithoutPrefix);

        console.log("apiBaseUrl", networkInfo.apiBaseUrl);
        const request = await fetch(
          `${networkInfo.apiBaseUrl}token`, // Now has guaranteed trailing slash
          {
            method: "POST",
            body: formData,
          }
        );
        const response = await request.json();

        if (!response || response.error || !response.success) {
          throw new Error(
            response?.message || "Server returned an invalid response."
          );
        }

        setDeployError("");
        writeContract({
          ...LAUNCHER_ABI_V4,
          address: safuLauncherAddress,
          functionName: "createToken",
          args: argArray,
          value: enableBundle ? ethValue : BigInt(deploymentFee),
        });
      } catch (err) {
        console.error(err);
        let errorMessage = "An unexpected error occurred while launching.";

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        }

        setDeployError(errorMessage);
      } finally {
        setMyStringIndex(`token_${uuidv4()}`);
      }
    },
    [validateForm, name, symbol, website, description, myStringIndex, twitter, telegram, enableBundle, bundleAddrs.length, logo, supply, dexRouter, uniV2WETH, taxOnDexRecipientsAddrs, taxOnDexPercentsArray, taxOnDexBps, safuLauncherAddress, networkInfo.apiBaseUrl, writeContract, argArray, ethValue, deploymentFee, percentBundled]
  );

  useEffect(() => {
    console.log("at combined 13, 21")
    if (combinedMetrics?.[13] == null) return;
    if ((combinedMetrics?.[20]) == null) return;
    if ((combinedMetrics?.[21]) == null) return;
    if ((combinedMetrics?.[22]) == null) return;
    if ((combinedMetrics?.[23]) == null) return;
    try {
      const ethStr = formatRawAmount(combinedMetrics[13], 18);
      console.log("ethStr", ethStr)
      setInitialPool(parseFloat(ethStr)); // or setInitialPool(ethStr)
      const mwlStr = Number(combinedMetrics?.[21]) / 100
      const cFETHStr = Number(combinedMetrics?.[22])
      const cHTBpsStr = Number(combinedMetrics?.[23])
      const bMAmtStr = Number(combinedMetrics?.[20])

      console.log("mwlStr", mwlStr)
      console.log("cFETHStr", cFETHStr)
      console.log("cHTBpsStr", cHTBpsStr)
      setMaxWhitelist(mwlStr);
      setCreationFeeETH(cFETHStr);
      setCreationHolderThresholdBps(cHTBpsStr);
      setBundleMaxAmount(bMAmtStr);
    } catch (e) {
      console.error(e);
    }
  }, [combinedMetrics]);

  useEffect(() => {
    let isMounted = true;
    if (isConnected && isMounted) {
      saveOrFetchUser(String(address));
    }

    if (!isConnected) {
      setInitialPool(0);
      setMaxWhitelist(0);
      setCreationFeeETH(0);
      setCreationHolderThresholdBps(0);
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, address, saveOrFetchUser]);

  function calculateBundleTokens(bundleEth: number, supply: number): number {
    // Simulate the smart contract calculation
    // These values should match your smart contract constants
    // const TRADE_FEE_BPS = Number(getTradeFeeBps); // 0.3% - adjust to match your contract
    const TRADE_FEE_BPS = Number(combinedMetrics?.[9]); // 0.3% - adjust to match your contract
    const virtualEthReserve = initialPool; // 2 ETH - from your contract

    if (bundleEth <= 0 || supply <= 0) return 0;

    // Calculate fees (you'll need to include platform fee if enabled)
    const tradeFee = (bundleEth * TRADE_FEE_BPS) / 10000;
    const netEth = bundleEth - tradeFee; // Note: platform fee would also be subtracted

    // Simplified bonding curve calculation
    // This is a rough approximation - you may need to adjust based on your exact curve
    const virtualTokenReserve = supply;
    const k = virtualEthReserve * virtualTokenReserve;

    // Calculate tokens out using the bonding curve formula
    const newEthReserve = virtualEthReserve + netEth;
    const newTokenReserve = k / newEthReserve;
    const tokensOut = virtualTokenReserve - newTokenReserve;

    return Math.floor(tokensOut);
  }

  type LPOption = "lock" | "burn";

  const options: { value: LPOption; label: string }[] = [
    { value: "lock", label: "Lock LP (3 months)" },
    { value: "burn", label: "Burn" },
  ];

  const selectedOption = options.find((opt) => opt.value === lpOption)?.label;

  const getErrorMessage = (fieldName: string) => {
    const error = validationErrors.find((err) => err.field === fieldName);
    return error ? error.message : "";
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) return <RocketLoader />;

  return (
    <>
      <div className="px-4 relative flex flex-col justify-center min-h-screen mountain">
        {txHash && !isConfirmed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-white">
              <RocketSpinner2 />
              <p className="text-lg md:text-xl lg:text-2xlfont-semibold animate-pulse">
                Finalizing token deployment, please wait...
              </p>
            </div>
          </div>
        )}

        <Navbar />
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {[...Array(2)].map((_, i) => (
            <DustParticles key={i} />
          ))}
        </div>
        <h1 className="mb-4 mt-28 dark:text-white text-[#01061C] text-center text-2xl lg:text-[30px] font-raleway font-medium">
          Launch Your Token
        </h1>
        <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
        <div className=" bg-[#01061C]/2 max-w-5xl mx-auto py-10 mb-20  dark:bg-[#050A1E]/50 border border-white/10 px-4 lg:px-[90px] lg:pb-20 rounded-[10px] ">
          <div className="">
            <p className="font-raleway dark:text-white/70 text-[#141313] text-center">
              Launch your token effortlessly — earn 0.2 ETH instantly when it
              reaches the bonding curve
            </p>
          </div>

          <ChainSwitcher/>

          <form
            id="launch-form"
            className=" mt-[40px] relative z-40"
            onSubmit={handleSubmit}
          >
            {/* Name */}
            {getErrorMessage("connection") && (
              <p className="text-red-500 text-sm my-1 text-center">
                {getErrorMessage("connection")}
              </p>
            )}
            <div className="flex flex-col gap-[10px]">
              <label htmlFor="tokenName">
                <span className="mandatory text-[20px] dark:text-white text-black font-semibold font-raleway">
                  Token Name
                </span>
              </label>
              <input
                id="tokenName"
                type="text"
                placeholder="Enter your Token Name, e.g “SafuLauncher”"
                className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[13px] sm:placeholder:text-base placeholder:text-[#141313]/42 w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {getErrorMessage("name") && (
                <p className="text-red-600 text-sm mt-1 font-medium">
                  {getErrorMessage("name")}
                </p>
              )}
            </div>

            {/* <div className="help">Token name (e.g. "MoonCat")</div> */}
            {/* Symbol */}
            <div className="flex flex-col gap-[10px] mt-[34px]">
              <label>
                <span className="mandatory text-[20px] dark:text-white text-black font-semibold font-raleway">
                  Symbol
                </span>
              </label>
              <input
                type="text"
                placeholder="Enter your Ticker Symbol, e.g SAFU"
                className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[13px] sm:placeholder:text-base placeholder:text-[#141313]/42] w-full"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
              />
              {getErrorMessage("symbol") && (
                <p className="text-red-600 text-sm mt-1 font-medium">
                  {getErrorMessage("symbol")}
                </p>
              )}
            </div>

            {/* <div className="help">Ticker symbol (e.g. "MCAT")</div> */}
            {/* Supply */}
            {/* Supply */}
            <div className="flex flex-col gap-[10px] mt-[34px] w-full ">
              <label>
                <span className="mandatory text-[20px] dark:text-white text-black font-semibold font-raleway">
                  Supply
                </span>
              </label>

              <div className="relative flex w-full">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="E.g “1,000,000”"
                  value={supplyInput}
                  onChange={(e) => {
                    const raw = removeCommas(e.target.value);
                    const parsed = parseInt(raw, 10);

                    if (!isNaN(parsed)) {
                      setSupply(parsed); // raw number for backend / logic
                      setSupplyInput(formatNumberWithCommas(parsed)); // formatted input
                    } else {
                      setSupply(0);
                      setSupplyInput("");
                    }
                  }}
                  required
                  className="py-[14px] px-4 pr-[90px] rounded-lg dark:bg-[#0c1223] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/60 font-medium outline-none w-full"
                />

                {/* Buttons container */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center h-[30px] bg-[#0C8CE0] rounded-full overflow-hidden">
                  <button
                    type="button"
                    onClick={decrease}
                    className="text-white px-4 text-lg cursor-pointer transition"
                  >
                    –
                  </button>
                  <div className="w-[1px] h-[60%] bg-white/50"></div>
                  <button
                    type="button"
                    onClick={increase}
                    className="text-white px-4 text-lg cursor-pointer transition"
                  >
                    +
                  </button>
                </div>
              </div>
              {getErrorMessage("supply-basic") && (
                <p className="text-red-500 text-sm mt-1 font-medium">
                  {getErrorMessage("supply-basic")}
                </p>
              )}
            </div>

            {/* <div className="help">Total supply (e.g. 1,000,000,000)</div> */}
            <div className="flex flex-col gap-[10px] mt-[34px]">
              <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
                Website
                <span className="mandatory text-Primary"> (Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-[10px] mt-[34px]">
              <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
                Social Links
                <span className="mandatory text-Primary"> (Optional)</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="url"
                  placeholder="Telegram (https://t.me/username)"
                  className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                />
                <input
                  type="url"
                  placeholder="X (https://X.com/username)"
                  className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-[10px] mt-[34px]">
              <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
                Description
                <span className="mandatory text-Primary">
                  {" "}
                  (Optional, max 200 chars)
                </span>
              </label>
              <textarea
                placeholder="Enter a short description"
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
                className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black placeholder:text-[13px] sm:placeholder:text-base dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 self-end">
                {description.length}/200
              </span>
            </div>

            {/* Input file and tax toggle */}
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
                      <span className="">Click to upload</span> or drag and drop
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
                onChange={handleChange}
              />
              {logoError && (
                <p className="text-red-500 text-sm mt-1">{logoError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* enable tax, whitelist only and enable platform fees */}
              <div className="">
                {/* Enable Tax Toggle Styled Similarly */}
                <div className="flex flex-col gap-2 mt-8">
                  <div className="flex justify-between items-center">
                    <label className="text-lg font-semibold dark:text-white text-black">
                      Enable Tax on DEX
                    </label>
                    <div className="relative group">
                      <div
                        onClick={() => setEnableTaxOnDex(!enableTaxOnDex)}
                        className={`w-16 h-8 rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300 ${enableTaxOnDex ? "bg-Primary" : "bg-white"
                          } shadow-inner relative`}
                      >
                        <div
                          className={`absolute z-20 left-1 pt-[2px] w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 ease-in-out ${enableTaxOnDex
                            ? "translate-x-[30px] bg-white"
                            : "translate-x-0 bg-[#D9D9D9]"
                            }`}
                        >
                          {enableTaxOnDex ? (
                            <CircleCheckBig className="text-Primary w-3 h-3" />
                          ) : (
                            <div className="flex items-center justify-center size-3 border border-Primary rounded-full">
                              <X className="text-Primary w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="absolute left-[10px] flex items-center justify-center size-3 z-10 border border-white rounded-full">
                          <X className="text-white w-3 h-3" />
                        </div>
                        <div className="absolute right-[10px] z-10">
                          <CircleCheckBig className="text-black w-3 h-3" />
                        </div>
                      </div>

                      <div className="z-50 absolute top-full -left-[12rem] mt-2 bg-white dark:bg-black/80 border border-gray-300 dark:border-none rounded-lg px-2 py-2 text-xs text-black dark:text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                        Amount is the tax on buy and sell e.g 10/10 tax
                      </div>
                    </div>
                  </div>

                  {enableTaxOnDex && (
                    <div className="space-y-4 bg-[#01061c0d] dark:bg-[#060920] p-6 rounded-xl shadow-md mt-4">
                      <label
                        htmlFor=""
                        className="dark:text-white font-raleway text-xl font-semibold"
                      >
                        Amount
                      </label>

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={dexFeeInput}
                        onChange={(e) => handleDexFeeBpsChange(e.target.value)}
                        placeholder="Enter enter Tax on DEX e.g 5"
                        className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                      />

                      <div className="flex flex-col gap-4">
                        <label
                          htmlFor=""
                          className="dark:text-white font-raleway text-xl font-semibold"
                        >
                          Wallet
                        </label>
                        <input
                          type="text"
                          ref={walletInputRef}
                          placeholder="0x.."
                          value={newAddr}
                          onChange={(e) => setNewAddr(e.target.value)}
                          className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                        />

                        <label
                          htmlFor=""
                          className="dark:text-white font-raleway text-xl font-semibold"
                        >
                          Percentage
                        </label>
                        <input
                          type="number"
                          placeholder="%"
                          min="0"
                          max="100"
                          value={newBps || ""}
                          onChange={(e) =>
                            setNewBps(parseFloat(e.target.value))
                          }
                          className="fw-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                        />
                        {getErrorMessage("tax") && (
                          <p className="text-red-500 text-sm mt-1 font-medium">
                            {getErrorMessage("tax")}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={addTaxRecipient}
                          className="bg-Primary px-3 py-4  rounded-full w-full flex items-center justify-center gap-1"
                        >
                          <IoMdAddCircleOutline className="text-xl text-white" />{" "}
                          <p className="font-raleway font-medium text-white">
                            Add Recipient
                          </p>
                        </button>
                      </div>

                      {/* Tax List */}
                      <div className="space-y-2">
                        {taxList.map((t, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-white/5 dark:bg-white/5 border dark:border-white/10 border-gray-900 dark:text-white text-black px-4 py-3 rounded-md"
                          >
                            <span className="truncate w-[60%]">{t.addr}</span>
                            <span>{(t.bps / 100).toFixed(1)}%</span>
                            <button
                              type="button"
                              onClick={() => removeTaxRecipient(i)}
                              className="text-red-500 hover:bg-red-500/10 p-2 rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Help Text */}
                      <div className="text-xs dark:text-gray-400 text-black/80 mt-2">
                        <p>• Maximum 5 tax recipients allowed</p>
                        <p>• Total tax cannot exceed 10%</p>
                        {/* <p>• BPS = Basis Points (100 BPS = 1%)</p> */}
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Fee Toggle */}
                <div className="flex flex-col gap-2 mt-[34px] md:mt-[80px] lg:mt-[100px]">
                  <div className="flex justify-between items-center">
                    <label className="text-[18px] font-semibold dark:text-white text-black font-raleway max-w-[11rem]">
                      Enable Tax on SafuLauncher
                    </label>

                    {/* Toggle + Tooltip Group */}
                    <div className="relative group">
                      <div
                        onClick={() => setEnableTaxOnSafu(!enableTaxOnSafu)}
                        className={`w-[66px] h-[32px] rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300
          ${enableTaxOnSafu ? "bg-Primary" : "bg-white"} shadow-inner relative`}
                      >
                        <div
                          className={`absolute z-20 left-1 pt-[2px] size-[28px] rounded-full flex items-center justify-center
            transition-transform duration-300 ease-in-out dark:shadow-[2px_-4px_24px_0px_rgba(71,_71,_77,_0.5)]
            ${enableTaxOnSafu
                              ? "translate-x-[32px] bg-white"
                              : "translate-x-0 bg-[#D9D9D9]"
                            }`}
                        >
                          {enableTaxOnSafu ? (
                            <CircleCheckBig className="text-Primary w-3 h-3" />
                          ) : (
                            <div className="flex items-center justify-center size-3 border border-Primary rounded-full">
                              <X className="text-Primary w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Static icons */}
                        <div className="absolute left-[10px] flex items-center justify-center size-3 z-10 border border-white rounded-full">
                          <X className="text-white w-3 h-3" />
                        </div>
                        <div className="absolute right-[10px] z-10">
                          <CircleCheckBig className="text-black w-3 h-3" />
                        </div>
                      </div>

                      {/* Tooltip shown on hover */}
                      <div className="z-50 absolute top-full -left-[12rem] mt-2 bg-white dark:bg-black/80 border border-gray-300 dark:border-none rounded-lg px-2 py-2 text-xs text-black dark:text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                        Dev/platform fee (max 5%, max 5 recipients).
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Fee Section */}
                {enableTaxOnSafu && (
                  <div
                    id="pf-section"
                    className="space-y-4 bg-[#01061c0d] dark:bg-[#060920] p-6 rounded-xl shadow-md mt-4"
                  >
                    <label className="flex flex-col gap-1 font-medium">
                      <span className="dark:text-white font-raleway text-xl font-semibold">
                        Tax on SafuLauncher
                      </span>

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={platformFeeInput}
                        onChange={(e) =>
                          handlePlatformFeeBpsChange(e.target.value)
                        }
                        placeholder="Enter Tax on SafuLauncher percentage (e.g. 0.5)"
                        className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base placeholder:whitespace-normal leading-tight pb-7 p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                      />
                    </label>
                    <div className="dark:text-gray-400 text-gray-700 text-sm">
                      Max Fee is 5%.
                    </div>
                    <div className="dark:text-gray-400 text-gray-700 text-sm mb-2">
                      Current total:{" "}
                      {platformFeeList
                        .reduce((sum, p) => sum + (p.pct || 0), 0)
                        .toFixed(2)}
                      %
                    </div>
                    {platformFeeList.map((p, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-4 "
                      >
                        <input
                          placeholder="0x..."
                          value={p.addr}
                          onChange={(e) => {
                            const list = [...platformFeeList];
                            list[i].addr = e.target.value;
                            setPlatformFeeList(list);
                          }}
                          className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none]"
                        />
                        <input
                          placeholder="Percentage (e.g. 50)"
                          type="number"
                          value={p.pctInput}
                          onChange={(e) => {
                            const input = e.target.value;
                            const list = [...platformFeeList];

                            list[i].pctInput = input; // always reflect what the user typed

                            const parsed = parseFloat(input);
                            if (!isNaN(parsed)) {
                              list[i].pct = parsed;
                            } else if (input === "") {
                              list[i].pct = 0; // optional: reset to 0 if empty
                            }

                            setPlatformFeeList(list);
                          }}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(platformFeeList, setPlatformFeeList, i)
                          }
                          className="text-red-400 hover:text-red-500 text-sm font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          platformFeeList,
                          setPlatformFeeList,
                          { addr: "", pct: 0, pctInput: "" },
                          5
                        )
                      }
                      disabled={platformFeeList.length >= 5}
                      className="bg-Primary px-3 py-4 rounded-full w-full flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IoMdAddCircleOutline className="text-xl text-white" />
                      <p className="font-raleway font-medium text-white ">
                        Add Recipient ({platformFeeList.length}/5)
                      </p>
                    </button>
                    {getErrorMessage("platformFee") && (
                      <p className="text-red-500 text-sm mt-1 font-medium">
                        {getErrorMessage("platformFee")}
                      </p>
                    )}
                  </div>
                )}

                {/* Whitelist Toggle */}
                <div className="flex flex-col gap-2 mt-[34px] md:mt-[100px] lg:mt-[115px]">
                  <div className="flex justify-between items-center">
                    <label className="text-[18px] font-semibold dark:text-white text-black font-raleway">
                      Whitelist Only
                    </label>

                    {/* Hover group for toggle + tooltip */}
                    <div className="relative group">
                      <div
                        onClick={() => setEnableWhitelist(!enableWhitelist)}
                        className={`w-[66px] h-[32px] rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300
          ${enableWhitelist ? "bg-Primary" : "bg-white"} shadow-inner relative`}
                      >
                        <div
                          className={`absolute z-20 left-1 pt-[2px] w-[28px] h-[28px] rounded-full flex items-center justify-center
            transition-transform duration-300 ease-in-out dark:shadow-[2px_-4px_24px_0px_rgba(71,_71,_77,_0.5)]
            ${enableWhitelist
                              ? "translate-x-[32px] bg-white"
                              : "translate-x-0 bg-[#D9D9D9]"
                            }`}
                        >
                          {enableWhitelist ? (
                            <CircleCheckBig className="text-Primary w-3 h-3" />
                          ) : (
                            <div className="flex items-center justify-center size-3 border border-Primary rounded-full">
                              <X className="text-Primary w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Static x icon on left */}
                        <div className="absolute left-[10px] flex items-center justify-center size-3 z-10 border border-white rounded-full">
                          <X className="text-white w-3 h-3" />
                        </div>
                        {/* Static check icon on right */}
                        <div className="absolute right-[10px] z-10">
                          <CircleCheckBig className="text-black w-3 h-3" />
                        </div>
                      </div>

                      {/* Tooltip shown on hover */}
                      <div className="z-50 absolute top-full -left-[12rem] mt-2 bg-white dark:bg-black/80 border border-gray-300 dark:border-none rounded-lg px-2 py-2 text-xs text-black dark:text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                        Only whitelisted addresses can buy initially. (Max 200
                        addresses)
                      </div>
                    </div>
                  </div>
                </div>
                {/* Whitelist Section */}
                {/* Whitelist Section */}
                {enableWhitelist && (
                  <div className=" bg-[#01061c0d] dark:bg-[#060920] p-6 rounded-xl shadow-md mt-4">
                    <div className="dark:text-white text-black font-medium mb-4 font-raleway">
                      Whitelisted Addresses:{" "}
                      <span className="text-green-400">
                        {whitelistUpload.length} / 200
                      </span>
                    </div>

                    {/* CSV Text Input */}
                    <div className="relative">
                      <textarea
                        rows={6}
                        value={wlCsvText}
                        onChange={(e) => setWlCsvText(e.target.value)}
                        placeholder="Address, percentage of the total supply for each wallet"
                        className="w-full h-full p-3 dark:text-white text-black dark:bg-[#071129] border border-Primary rounded-t-2xl  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />

                      {/* Upload Button */}
                      <div className="flex space-x-2 absolute -bottom-8 right-0">
                        <div className="relative">
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleCSVUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button
                            type="button"
                            className="bg-Primary/25 hover:bg-slate-600 text-gray-300 border-Primary hover:text-white py-2 px-4 rounded-b-2xl font-medium transition-all duration-200 flex items-center space-x-2"
                          >
                            <span className="dark:text-white text-black text-sm">
                              Upload CSV/Excel
                            </span>
                            <Upload className="w-4 h-4 text-black dark:text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => parseWlCsv(wlCsvText)}
                      className="bg-Primary px-3 py-4  rounded-full w-full flex items-center justify-center gap-1 mt-14"
                    >
                      <IoMdAddCircleOutline className="text-xl text-white" />
                      <p className="font-raleway font-medium text-white ">
                        Add Whitelist
                      </p>
                    </button>

                    {/* Whitelist Entries Table */}
                    <div className="dark:bg-[#071129] rounded-xl border border-slate-600 overflow-hidden mt-4">
                      {whitelistUpload.length === 0 && (
                        <div className="p-8 text-center dark:text-gray-400 text-black">
                          No whitelist entries yet. Add some using the buttons
                          above.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* LP option, start trading and enable bundle */}
              <div>
                {/* LP Option */}
                <div className="flex flex-col gap-2 mt-[34px] relative w-full group">
                  <label className="text-[18px] font-semibold dark:text-white text-black font-ralewaye">
                    LP Option <span className="text-white">*</span>
                  </label>

                  {/* Trigger */}
                  <div
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="dark:bg-[#d5f2f80a] bg-white dark:text-white text-black px-3 py-3 rounded-md cursor-pointer flex justify-between items-center"
                  >
                    <span className="text-lg">{selectedOption}</span>
                    <div className="w-8 h-8 rounded-md bg-Primary flex items-center justify-center">
                      <BsChevronDown className="text-white text-2xl" />
                    </div>
                  </div>

                  {/* Dropdown */}
                  {isOpen && (
                    <div className="absolute top-[110px] z-60 w-full dark:bg-[#1a2a7f] bg-white dark:text-white rounded-xl shadow-md">
                      {options.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => {
                            setLpOption(option.value);
                            setIsOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-Primary ${option.value === "lock"
                            ? "rounded-t-xl"
                            : "rounded-b-xl"
                            }`}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tooltip on hover */}
                  <div className="z-50 absolute top-full left-0 mt-2 bg-white dark:bg-black/80 border border-gray-300 dark:border-none rounded-lg px-2 py-2 text-xs text-black dark:text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                    Lock or burn liquidity after bonding.
                  </div>
                </div>

                {/* Start Now Toggle */}
                <div className="flex justify-between items-center mt-[34px] md:mt-[42px] group relative">
                  <label className="text-[18px] font-semibold dark:text-white text-black font-raleway">
                    Start Trading Now
                  </label>

                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => setStartNow(!startNow)}
                      className={`w-[66px] h-[32px] rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300
        ${startNow ? " bg-Primary" : "bg-white"} shadow-inner relative`}
                    >
                      <div
                        className={`absolute z-20 left-1 pt-[2px] size-[28px] rounded-full flex items-center justify-center
          transition-transform duration-300 ease-in-out dark:shadow-[2px_-4px_24px_0px_rgba(71,_71,_77,_0.5)]
          ${startNow
                            ? "translate-x-[32px] bg-white"
                            : "translate-x-0 bg-[#D9D9D9]"
                          }`}
                      >
                        {startNow ? (
                          <CircleCheckBig className="text-Primary w-3 h-3" />
                        ) : (
                          <div className="flex items-center justify-center size-3 border border-Primary rounded-full">
                            <X className="text-Primary w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Static check icon on right */}
                      <div className="absolute left-[10px] flex items-center justify-center size-3 z-10 border border-white rounded-full">
                        <X className="text-white w-3 h-3" />
                      </div>

                      {/* Static x icon on left */}
                      <div className="absolute right-[10px] z-10">
                        <CircleCheckBig className="text-black w-3 h-3" />
                      </div>
                    </div>

                    {/* Hover-only tooltip */}
                    <div className="z-50 absolute top-full left-0 mt-2 bg-white dark:bg-black/80 border border-gray-300 dark:border-none rounded-lg px-2 py-2 text-xs text-black dark:text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                      ON = live immediately; OFF = start later.
                    </div>
                  </div>
                </div>

                {/* Max Wallet Amount on Safu Toggle */}
                <div className="grid grid-cols-[.6fr_.4fr]  lg:flex justify-between lg:gap-3 items-center mt-6 lg:mt-[60px]">
                  <label className="text-lg font-semibold dark:text-white text-black text-wrap">
                    Enable Max wallet size on SafuLauncher
                  </label>
                  <div
                    onClick={() =>
                      setIsMaxWalletAmountOnSafu(!isMaxWalletAmountOnSafu)
                    }
                    className={`w-[66px] h-[32px] rounded-full p-1 cursor-pointer flex items-center ml-auto transition-colors duration-300
          ${isMaxWalletAmountOnSafu ? "bg-Primary" : "bg-white"
                      } shadow-inner relative`}
                  >
                    <div
                      className={`absolute z-20 left-1 pt-[2px] size-[28px] rounded-full flex items-center justify-center
            transition-transform duration-300 ease-in-out dark:shadow-[2px_-4px_24px_0px_rgba(71,_71,_77,_0.5)]
            ${isMaxWalletAmountOnSafu
                          ? "translate-x-[31px] bg-white"
                          : "translate-x-0 bg-[#D9D9D9]"
                        }`}
                    >
                      {isMaxWalletAmountOnSafu ? (
                        <CircleCheckBig className="text-Primary w-3 h-3" />
                      ) : (
                        <div className="flex items-center justify-center size-3 border border-Primary rounded-full">
                          <X className="text-Primary w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Static icons */}
                    <div className="absolute left-[10px] flex items-center justify-center size-3 z-10 border border-white rounded-full">
                      <X className="text-white w-3 h-3" />
                    </div>
                    <div className="absolute right-[10px] z-10">
                      <CircleCheckBig className="text-black w-3 h-3" />
                    </div>
                  </div>
                </div>

                {isMaxWalletAmountOnSafu && (
                  <div className="space-y-4 bg-[#01061c0d] dark:bg-[#060920] p-6 rounded-xl shadow-md mt-4">
                    <label className="block mb-1 text-sm font-medium dark:text-white text-black">
                      Max Wallet Amount (% of total supply)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      placeholder="e.g. 0.5 for 0.5%"
                      value={maxWalletAmountOnSafuInput}
                      onChange={(e) => handleMaxWalletBpsChange(e.target.value)}
                      className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                    />

                    <p className="text-xs dark:text-gray-400 text-black/80 mt-1">
                      Must be between 0 and 2% of total supply.
                    </p>
                    {getErrorMessage("maxWalletAmountOnSafu") && (
                      <p className="text-red-500 text-sm mt-1">
                        {getErrorMessage("maxWalletAmountOnSafu")}
                      </p>
                    )}
                  </div>
                )}

                {/*

              {/* Bundle Toggle */}
                <div className="flex justify-between items-center mt-[34px] md:mt-[20px] lg:mt-[40px] group relative">
                  <label className="text-[18px] font-semibold dark:text-white text-black font-raleway">
                    Enable Bundle
                  </label>

                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => setEnableBundle(!enableBundle)}
                      className={`w-[66px] h-[32px] rounded-full p-1 cursor-pointer flex items-center transition-colors duration-300
        ${enableBundle ? " bg-Primary" : "bg-white"} shadow-inner relative`}
                    >
                      <div
                        className={`absolute z-20 left-1 pt-[2px] size-[28px] rounded-full flex items-center justify-center
          transition-transform duration-300 ease-in-out dark:shadow-[2px_-4px_24px_0px_rgba(71,_71,_77,_0.5)]
          ${enableBundle
                            ? "translate-x-[32px] bg-white"
                            : "translate-x-0 bg-[#D9D9D9]"
                          }`}
                      >
                        {enableBundle ? (
                          <CircleCheckBig className="text-Primary w-3 h-3" />
                        ) : (
                          <div className="flex items-center justify-center size-3 border border-Primary rounded-full">
                            <X className="text-Primary w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Static check icon on right */}
                      <div className="absolute left-[10px] flex items-center justify-center size-3 z-10 border border-white rounded-full">
                        <X className="text-white w-3 h-3" />
                      </div>

                      {/* Static x icon on left */}
                      <div className="absolute right-[10px] z-10">
                        <CircleCheckBig className="text-black w-3 h-3" />
                      </div>
                    </div>

                    {/* Hover-only explanation */}
                    <div className="z-50 absolute top-full left-0 mt-2 bg-white dark:bg-black/80 border border-gray-300 dark:border-none rounded-lg px-2 py-2 text-xs text-black dark:text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                      Dev pre-buy (max 15% of supply, max 30 recipients).
                    </div>
                  </div>
                </div>

                {/* Bundle Section */}
                {enableBundle && (
                  <div
                    id="bundle-section"
                    className="space-y-4 bg-[#01061c0d] dark:bg-[#060920] p-6 rounded-xl shadow-md mt-4"
                  >
                    <label className="flex flex-col gap-1 font-medium">
                      <span className="dark:text-white text-black font-raleway">
                        Bundle ETH
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={bundleEthInput}
                        onChange={(e) => handleBundleEthChange(e.target.value)}
                        placeholder="10"
                        className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                      />
                    </label>
                    <div className="dark:text-gray-400 text-gray-700 text-sm">
                      ETH to spend on initial pre-buy.
                    </div>
                    {getErrorMessage("supply-bundle") && (
                      <p className="text-red-600 text-sm mt-1 font-medium">
                        {getErrorMessage("supply-bundle")}
                      </p>
                    )}
                    {getErrorMessage("bundle") && (
                      <p className="text-red-500 text-sm mt-1 font-medium">
                        {getErrorMessage("bundle")}
                      </p>
                    )}
                    {bundleEth > 0 && supply > 0 && (
                      <div className="space-y-1 dark:bg-[#d5f2f80a] bg-[#01061c0d] p-4 rounded-md dark:border border-gray-700">
                        <div className="dark:text-white text-black">
                          Estimated tokens: ~{" "}
                          {calculateBundleTokens(
                            bundleEth,
                            supply
                          ).toLocaleString()}
                        </div>
                        <div className="dark:text-white text-black">
                          Percentage of supply: ~ {percentBundled}%
                        </div>
                        <div className="dark:text-white text-black">
                          Max allowed ({Number(bundleMaxAmount)}%):{" "}
                          {(
                            (supply * Number(bundleMaxAmount)) /
                            100
                          ).toLocaleString()}
                        </div>
                        {calculateBundleTokens(bundleEth, supply) >
                          (supply * Number(bundleMaxAmount)) / 100 && (
                            <div className="text-red-400 font-semibold">
                              ⚠️ Exceeds {Number(bundleMaxAmount)}% limit!
                            </div>
                          )}
                      </div>
                    )}

                    <div className="text-gray-400 text-sm mb-2">
                      Current total:{" "}
                      {bundleList
                        .reduce((sum, b) => sum + (b.pct || 0), 0)
                        .toFixed(2)}
                      %
                    </div>
                    {bundleList.map((b, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-start md:items-center gap-4 bg-[#01061c0d] dark:bg-[#060920]"
                      >
                        <input
                          placeholder="0x..."
                          value={b.addr}
                          onChange={(e) => {
                            const list = [...bundleList];
                            list[i].addr = e.target.value;
                            setBundleList(list);
                          }}
                          className="w-full text-black p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                        />
                        <input
                          type="number"
                          value={b.pctInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            const list = [...bundleList];

                            list[i].pctInput = value;

                            const parsed = parseFloat(value);
                            list[i].pct = !isNaN(parsed) ? parsed : 0;

                            setBundleList(list);
                          }}
                          placeholder="Percentage (e.g. 50)"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full text-black placeholder:text-[13px] sm:placeholder:text-base p-3 rounded-md dark:text-white dark:bg-[#071129] border border-gray-900 dark:border-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(bundleList, setBundleList, i)
                          }
                          className="text-red-400 hover:text-red-500 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          bundleList,
                          setBundleList,
                          { addr: "", pct: 0, pctInput: "" },
                          30
                        )
                      }
                      disabled={bundleList.length >= 30}
                      className="bg-Primary px-3 py-4 rounded-full w-full flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IoMdAddCircleOutline className="text-xl text-white" />
                      <p className="font-raleway font-medium text-white">
                        Add Bundle Entry ({bundleList.length}/30)
                      </p>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dex Router Dropdown */}
            <div className="flex flex-col gap-[10px] mt-[34px]">
              <label htmlFor="dexRouter">
                <span className="mandatory text-[20px] dark:text-white text-black font-semibold font-raleway">
                  DEX Router
                </span>
              </label>
              <select
                id="dexRouter"
                value={dexRouter}
                onChange={(e) => setDexRouter(e.target.value)}
                className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[13px] sm:placeholder:text-base placeholder:text-[#141313]/42 w-full"
                required
              >
                {dexRouterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`w-full rounded-xl px-6 py-4 text-white font-semibold mt-10 transition-opacity
    ${isPending || isConfirming || !isFormValid
                  ? "opacity-50 cursor-not-allowed bg-gradient-to-r from-[#3BC3DB] to-[#0C8CE0]"
                  : "bg-gradient-to-r from-[#3BC3DB] to-[#0C8CE0] cursor-pointer"
                }`}
              disabled={isPending || isConfirming || !isFormValid}
            >
              {isFormValid ? (
                <>
                  <span>
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2 ">
                        <RocketSpinner />
                        <span>Pending...</span>
                      </span>
                    ) : (
                      <p className="text-[17px]">Create Token</p>
                    )}
                  </span>
                </>
              ) : (
                "Fix Validation Errors"
              )}
            </button>
            {deployError && (
              <p className="mt-4 text-sm text-red-500 bg-red-100 border border-red-300 rounded-md p-3">
                {deployError}
              </p>
            )}
            {/* {validationErrors.length > 0 && (
              <div className=" dark:bg-[#2c0b0e] border border-red-300 dark:border-red-600 text-red-800 dark:text-red-300 rounded-md px-4 py-3 mb-5 mt-4">
                <h3 className="font-semibold mb-2 text-sm md:text-base font-raleway">
                  Please fix the following issues:
                </h3>
                <ul className="space-y-1 text-sm md:text-base">
                  {validationErrors.map((error, index) => (
                    <li key={index}>
                      <span className="font-semibold">{error.field}:</span>{" "}
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
          </form>

          {error && (
            <p className="text-red-500">
              Error: {(error as BaseError).shortMessage}
            </p>
          )}

          <div>
            {isConfirmed && result?.transactionHash && (
              <p className="text-white mt-2 text-center">
                <span className="text-green-400">Token launched!</span> Deployed
                Hash:{" "}
                <a
                  href={`${networkInfo.explorerUrl}/tx/${result.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-800"
                >
                  Click Here
                </a>
              </p>
            )}
          </div>
          {/* <div>
            {tokenAddress && (
              <div>
                <span className="font-medium">Token Address: </span>
                <a
                  href={`https://sepolia.etherscan.io/address/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline"
                >
                  {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                </a>
              </div>
            )}
          </div> */}
          {tokenAddress && (
            <div className="mt-3 p-3 bg-white dark:bg-black/20 rounded-md">
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => navigate(`/trade/${tokenAddress}`)}
                  className="w-[200px] text-[1rem] font-bold px-[24px] py-[13px] text-white cursor-pointer hero-cta dark:bg-[#0C8CE0] rounded-full"
                >
                  Trade <span>{argArray[1]}</span> now!
                </button>

                {/* <button
                  onClick={() => navigator.clipboard.writeText(tokenAddress)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Copy Address
                </button> */}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </>
  );
}
