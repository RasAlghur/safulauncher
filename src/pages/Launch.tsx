// safu-dapp/src/pages/Launch.tsx
import React, {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type JSX,
} from "react";
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  type BaseError,
  useAccount,
} from "wagmi";
import { LAUNCHER_ABI, SAFU_LAUNCHER_CA } from "../web3/config";
import { ethers } from "ethers";
import { verifyContract } from "../web3/etherscan";
import Navbar from "../components/launchintro/Navbar";
import DustParticles from "../components/generalcomponents/DustParticles";
import Footer from "../components/generalcomponents/Footer";
import rocket from "../assets/rocket.png";
import { base } from "../lib/api";

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
  const { isConnected } = useAccount();

  // Basic fields
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState<number>(0);
  const [website, setWebsite] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [logo, setLogo] = useState<File | null>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [waitingForVerification, setWaitingForVerification] = useState(false); // State for waiting message

  // Toggles
  const [enableTax, setEnableTax] = useState(false);
  const [enableWhitelist, setEnableWhitelist] = useState(false);
  const [startNow, setStartNow] = useState(true);
  const [lpOption, setLpOption] = useState<"lock" | "burn">("lock");
  const [enableBundle, setEnableBundle] = useState(false);
  const [enablePlatformFee, setEnablePlatformFee] = useState(false);

  // Dynamic groups
  const [taxList, setTaxList] = useState<{ addr: string; bps: number }[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [bundleList, setBundleList] = useState<{ addr: string; pct: number }[]>(
    []
  );
  const [bundleEth, setBundleEth] = useState<number>(0);
  const [platformFeeList, setPlatformFeeList] = useState<
    { addr: string; pct: number }[]
  >([]);
  const [platformFeeBps, setPlatformFeeBps] = useState<number>(0);

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

  // Comprehensive validation function
  const validateForm = useCallback((): ValidationError[] => {
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
        field: "supply",
        message: "Supply must be greater than 0",
      });
    }

    // Tax validation
    if (enableTax) {
      const taxBpsSum = taxList.reduce((sum, t) => sum + (t.bps || 0), 0);

      if (taxBpsSum > 1000) {
        errors.push({
          field: "tax",
          message: "Total tax cannot exceed 10% (1000 BPS)",
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
        if (tax.bps < 0 || tax.bps > 1000) {
          errors.push({
            field: "tax",
            message: `Tax recipient ${index + 1}: BPS must be between 0-1000`,
          });
        }
      });

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
      if (whitelist.length > 200) {
        errors.push({
          field: "whitelist",
          message: "Maximum 200 whitelist addresses allowed",
        });
      }

      // Validate whitelist addresses
      whitelist.forEach((addr, index) => {
        if (addr && !isValidAddress(addr)) {
          errors.push({
            field: "whitelist",
            message: `Whitelist address ${index + 1}: Invalid address`,
          });
        }
      });

      // Check for empty whitelist entries
      const emptyWhitelistEntries = whitelist.some((addr) => !addr.trim());
      if (emptyWhitelistEntries) {
        errors.push({
          field: "whitelist",
          message: "All whitelist entries must have valid addresses",
        });
      }

      // Check for duplicate whitelist addresses
      const validWhitelistAddresses = whitelist.filter(
        (addr) => addr && addr.trim()
      );
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
      const TRADE_FEE_BPS = 30; // 0.3% - adjust to match your contract
      const virtualEthReserve = 2; // 2 ETH - from your contract

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
        const maxAllowedTokens = (supply * 25) / 100; // 25% of supply

        if (estimatedTokens > maxAllowedTokens) {
          const maxEthForTokens =
            bundleEth * (maxAllowedTokens / estimatedTokens);
          errors.push({
            field: "bundle",
            message: `Bundle would exceed 25% of supply. Maximum ETH for this supply: ~${maxEthForTokens.toFixed(
              4
            )} ETH`,
          });
        }
      }

      // Validate bundle addresses and percentages
      let totalBundlePercent = 0;
      bundleList.forEach((bundle, index) => {
        if (bundle.addr && !isValidAddress(bundle.addr)) {
          errors.push({
            field: "bundle",
            message: `Bundle recipient ${index + 1}: Invalid address`,
          });
        }
        if (bundle.pct <= 0 || bundle.pct > 100) {
          errors.push({
            field: "bundle",
            message: `Bundle recipient ${
              index + 1
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
    if (enablePlatformFee) {
      if (platformFeeBps > 500) {
        errors.push({
          field: "platformFee",
          message: "Platform fee cannot exceed 5% (500 BPS)",
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
            message: `Platform fee recipient ${
              index + 1
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
  }, [
    isConnected,
    name,
    symbol,
    supply,
    enableTax,
    taxList,
    enableWhitelist,
    whitelist,
    enableBundle,
    bundleList,
    bundleEth,
    enablePlatformFee,
    platformFeeBps,
    platformFeeList,
  ]);

  // Run validation whenever form data changes
  useEffect(() => {
    const errors = validateForm();
    setValidationErrors(errors);
    setIsFormValid(errors.length === 0);
  }, [validateForm]);

  // Compute conditional inputs
  const taxBpsSum: bigint = enableTax
    ? taxList.reduce((sum, t) => sum + BigInt(t.bps || 0), 0n)
    : 0n;
  const taxRecipientsAddrs = React.useMemo(
    () =>
      enableTax
        ? (taxList.map((t) => t.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [enableTax, taxList]
  );
  const taxPercentsArray = React.useMemo(
    () =>
      enableTax
        ? (taxList.map((t) => t.bps) as readonly number[])
        : ([] as readonly number[]),
    [enableTax, taxList]
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
  const ethValue = enableBundle ? ethers.parseEther(bundleEth.toString()) : 0n;

  const wlArray = React.useMemo(
    () =>
      enableWhitelist
        ? (whitelist as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [enableWhitelist, whitelist]
  );

  const pfBps = enablePlatformFee ? platformFeeBps : 0;
  const pfAddrs = React.useMemo(
    () =>
      enablePlatformFee
        ? (platformFeeList.map((p) => p.addr) as readonly `0x${string}`[])
        : ([] as readonly `0x${string}`[]),
    [enablePlatformFee, platformFeeList]
  );
  const pfPercs = React.useMemo(
    () =>
      enablePlatformFee
        ? (platformFeeList.map((p) =>
            Math.floor(p.pct * 100)
          ) as readonly number[])
        : ([] as readonly number[]),
    [enablePlatformFee, platformFeeList]
  );

  // Build args
  const argArray = React.useMemo(
    () =>
      [
        name,
        symbol,
        ethers.parseUnits(supply.toString(), 18),
        taxBpsSum,
        lpOption === "lock",
        enableWhitelist,
        startNow,
        bundleAddrs,
        bundleShares,
        taxRecipientsAddrs,
        taxPercentsArray,
        wlArray,
        pfBps,
        pfAddrs,
        pfPercs,
      ] as [
        string,
        string,
        bigint,
        bigint,
        boolean,
        boolean,
        boolean,
        readonly `0x${string}`[],
        readonly number[],
        readonly `0x${string}`[],
        readonly number[],
        readonly `0x${string}`[],
        number,
        readonly `0x${string}`[],
        readonly number[]
      ],
    [
      name,
      symbol,
      supply,
      taxBpsSum,
      lpOption,
      enableWhitelist,
      startNow,
      bundleAddrs,
      bundleShares,
      taxRecipientsAddrs,
      taxPercentsArray,
      wlArray,
      pfBps,
      pfAddrs,
      pfPercs,
    ]
  );

  const { data: uniV2Router } = useReadContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: "_uniV2Router",
  });

  const { data: uniV2WETH } = useReadContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: "WETH",
  });

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      // Final validation check before submission
      const errors = validateForm();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      try {
        writeContract({
          ...LAUNCHER_ABI,
          functionName: "createToken",
          args: argArray,
          value: ethValue,
        });
      } catch (err) {
        console.error(err);
      }
    },
    [validateForm, argArray, ethValue, writeContract]
  );

  const handleVerify = async (
    encodedMessageWithoutPrefix: string,
    tokenAddress: string
  ) => {
    // const handleVerify = async (tokenAddress: any) => {
    try {
      console.log(
        "encodedMessage at handleVerify Func",
        encodedMessageWithoutPrefix
      );
      console.log("deployedAddress at handleVerify Func", tokenAddress);
      const result = await verifyContract({
        encodedMessageWithoutPrefix,
        tokenAddress,
      });
      // const result = await verifyContract({ tokenAddress });
      setStatusMessage("Verification request sent successfully!");
      console.log(result); // Log the result if needed (status, or further information)
    } catch (error) {
      setStatusMessage("Error during verification. Please try again.");
      console.error(error); // Log the error for debugging
    }
  };

  useEffect(() => {
    if (isConfirmed && result) {
      (async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 1. fetch the block data by blockNumber
        const block = await provider.getBlock(result.blockNumber);

        // 2. convert UNIX timestamp to ISO string
        let createdAt = "";
        if (block && block.timestamp) {
          // timestamp is in seconds, so multiply by 1 000 to get ms
          const createdAtMs = block.timestamp * 1_000;
          createdAt = new Date(createdAtMs).toISOString();
          console.log("Created at: %s", createdAt);
        }

        // 4. build FormData with on-chain timestamp
        const formData = new FormData();
        formData.append("name", name);
        formData.append("symbol", symbol);
        formData.append("website", website);
        formData.append("description", description);
        formData.append("tokenCreator", result.from);
        formData.append("createdAt", createdAt); // <–– here you use the block time

        const lastLog = result.logs[result.logs.length - 1];
        const topic1 = lastLog?.topics[1] ?? "";
        const tokenAddress = topic1.length
          ? ethers.getAddress("0x" + topic1.slice(-40))
          : "";
        formData.append("tokenAddress", tokenAddress);
        if (logo) formData.append("logo", logo);

        // const API = `https://safulauncher-production.up.railway.app`;
        // const API = import.meta.env.VITE_API_BASE_URL;
        await base.post("token", formData);

        // Log bundle transactions for each wallet if bundling is enabled
        if (enableBundle && ethValue > 0n && bundleList.length > 0) {
          const totalBundleEth = Number(ethers.formatEther(ethValue));
          const totalTokensFromBundle = calculateBundleTokens(
            totalBundleEth,
            supply
          );

          // Create transaction entries for each bundle recipient
          const bundleTransactions = bundleList.map((bundle, index) => {
            // Calculate ETH amount for this specific wallet based on their percentage
            const walletEthAmount = (totalBundleEth * bundle.pct) / 100;

            // Calculate token amount for this specific wallet based on their percentage
            const walletTokenAmount =
              (totalTokensFromBundle * bundle.pct) / 100;

            return {
              tokenAddress,
              type: "buy",
              ethAmount: walletEthAmount.toString(),
              tokenAmount: walletTokenAmount.toString(),
              timestamp: createdAt,
              // Use original transaction hash
              txnHash: txHash,
              wallet: bundle.addr,
              // Add metadata to identify this as a bundle transaction
              isBundleTransaction: true,
              originalTxnHash: txHash,
              bundleIndex: index,
            };
          });

          // Log each bundle transaction
          for (const transaction of bundleTransactions) {
            try {
              const response = await base.post("transaction", transaction);

              if (response.status !== 201) {
                console.error(
                  `Error logging bundle transaction for ${transaction.wallet}:`,
                  response.status,
                  await response.data
                );
              } else {
                console.log(
                  `Bundle transaction logged successfully for wallet: ${transaction.wallet}, ETH: ${transaction.ethAmount}, Tokens: ${transaction.tokenAmount}`
                );
              }
            } catch (error) {
              console.error(
                `Error logging bundle transaction for ${transaction.wallet}:`,
                error
              );
            }
          }
        }

        const message = [
          name,
          symbol,
          ethers.parseUnits(supply.toString(), 18),
          uniV2Router,
          uniV2WETH,
          taxRecipientsAddrs,
          taxPercentsArray,
          SAFU_LAUNCHER_CA,
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
            "address",
          ],
          [...message]
        );
        const encodedMessageWithoutPrefix = encodedMessage.slice(2); // Remove "0x" prefix

        // console.log("Encoded message at deployToken Func:", encodedMessageWithoutPrefix);

        // Ensure that both `encodedMessage` and `deployedAddress` are not empty before verifying
        if (encodedMessageWithoutPrefix) {
          setWaitingForVerification(true); // Show waiting message
          setTimeout(async () => {
            setWaitingForVerification(false); // Hide waiting message after delay
            await handleVerify(encodedMessageWithoutPrefix, tokenAddress);
            // await handleVerify(tokenAddress);
          }, 120000); // Wait for 30 seconds before verifying
        } else {
          console.error(
            "Error: Deployed address or encoded message is missing"
          );
          setStatusMessage(
            "Error: Deployed address or encoded message is missing"
          );
        }
      })().catch(console.error);
    }
  }, [
    isConfirmed,
    result,
    name,
    symbol,
    website,
    description,
    txHash,
    logo,
    enableBundle,
    ethValue,
    bundleList,
    supply,
    taxRecipientsAddrs,
    taxPercentsArray,
    uniV2Router,
    uniV2WETH,
  ]);

  console.log("createToken args:", argArray, "value:", ethValue.toString());

  function calculateBundleTokens(bundleEth: number, supply: number): number {
    // Simulate the smart contract calculation
    // These values should match your smart contract constants
    const TRADE_FEE_BPS = 30; // 0.3% - adjust to match your contract
    const virtualEthReserve = 2; // 2 ETH - from your contract

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

  return (
    <div className="px-4 relative flex flex-col justify-center min-h-screen">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none -z-20 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <DustParticles key={i} />
        ))}
      </div>
      {/* <div className="absolute inset-0 bg-gradient-to-l from-[#3BC3DB] to-[#0C8CE0] opacity-[0.03] pointer-events-none dark:hidden" /> */}
      <div className="lg:size-[30rem] lg:w-[50rem] rounded-full bg-[#3BC3DB]/10 absolute top-[100px] left-0 right-0 mx-auto blur-3xl hidden dark:block"></div>
      <div className="my-40 bg-[#01061C]/2 max-w-4xl mx-auto py-10  dark:bg-[#050A1E]/50 border border-white/10 px-4 lg:px-[100px] lg:py-20 rounded-[10px] ">
        {validationErrors.length > 0 && (
          <div className=" dark:bg-[#2c0b0e] border border-red-300 dark:border-red-600 text-red-800 dark:text-red-300 rounded-md px-4 py-3 mb-5">
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
        )}
        <div className="">
          <h1 className="dark:text-white text-[#01061C] text-center text-lg lg:text-[24px] font-raleway font-medium mb-[12px]">
            Launch Your Token
          </h1>
          <p className="font-raleway dark:text-white/70 text-[#141313] text-center">
            Use Safu to deploy coins with ease. No fees. Earn 80% creator
            rewards on trading fees.
          </p>
        </div>
        {/* Validation Errors Display */}

        <form
          id="launch-form"
          className=" mt-[40px] relative z-40 max-h-[80vh] lg:pr-20 overflow-y-auto scrollbar-thin scrollbar-track-[#D9D9D9] scrollbar-thumb-[#0C8CE0]"
          onSubmit={handleSubmit}
        >
          {/* Name */}
          <div className="flex flex-col gap-[10px]">
            <label htmlFor="tokenName">
              <span className="mandatory text-[20px] dark:text-white text-black font-semibold font-raleway">
                Token Name
              </span>
            </label>
            <input
              id="tokenName"
              type="text"
              placeholder="Enter your Token Name, e.g (“MoonCat”)"
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-[95%] lg:w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              placeholder="Enter your Ticker Symbol, e.g (“MCAT”)"
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42] w-[95%] lg:w-full"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
          </div>

          {/* <div className="help">Ticker symbol (e.g. "MCAT")</div> */}
          {/* Supply */}
          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label>
              <span className="mandatory text-[20px] dark:text-white text-black font-semibold font-raleway">
                Supply
              </span>
            </label>
            <input
              type="number"
              placeholder="100"
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-[95%] lg:w-full"
              value={supply}
              onChange={(e) => setSupply(parseInt(e.target.value) || 0)}
              required
              min="1"
            />
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
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-[95%] lg:w-full"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
              Description
              <span className="mandatory text-Primary"> (Optional)</span>
            </label>
            <textarea
              placeholder="Enter short description"
              value={description}
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 w-[95%] lg:w-full"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Input file and tax toggle */}
          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              className="py-[14px] px-4 rounded-lg dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:placeholder:text-[#B6B6B6] placeholder:text-[#141313]/42 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2c2c2c] file:text-white hover:file:bg-[#3a3a3a] w-[95%] lg:w-full"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Enable Tax Toggle Styled Similarly */}
          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
              Enable Tax
            </label>
            <div className="grid grid-cols-[.2fr_.8fr] lg:flex items-center gap-2">
              <div
                className={`relative w-[54px] h-8 flex items-center  ${
                  enableTax
                    ? "bg-Primary"
                    : " dark:bg-[#d5f2f80a] bg-[#01061c0d]"
                } rounded-full p-1 cursor-pointer`}
                onClick={() => setEnableTax(!enableTax)}
              >
                <input
                  type="checkbox"
                  checked={enableTax}
                  readOnly
                  className="hidden"
                />
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${
                    enableTax ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="dark:text-white text-black lg:text-lg">
                Toggle to enable or disable tax
              </span>
            </div>
            <div className=" text-Primary lg:text-lg">
              Collect up to 10% tax on Uniswap trades. (Max 5 recipients)
            </div>
          </div>

          {/* Tax Section */}
          {enableTax && (
            <div
              id="tax-section"
              className="space-y-4 dark:bg-[#d5f2f80a] bg-[#01061c0d] p-6 rounded-xl dark:border border-gray-800 shadow-md mt-[10px]"
            >
              <div className="dark:text-white text-black font-medium mb-2">
                Current total:{" "}
                <span className="text-green-400">
                  {taxList.reduce((sum, t) => sum + (t.bps || 0), 0)} BPS (
                  {(
                    taxList.reduce((sum, t) => sum + (t.bps || 0), 0) / 100
                  ).toFixed(1)}
                  %)
                </span>
              </div>

              {taxList.map((t, i) => (
                <div
                  key={i}
                  className="group-item flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#d5f2f80a] p-4 rounded-lg border border-gray-700"
                >
                  <input
                    placeholder="0x..."
                    value={t.addr}
                    onChange={(e) => {
                      const list = [...taxList];
                      list[i].addr = e.target.value;
                      setTaxList(list);
                    }}
                    className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                  />
                  <input
                    placeholder="BPS (e.g. 200 = 2%)"
                    type="number"
                    value={t.bps}
                    onChange={(e) => {
                      const list = [...taxList];
                      list[i].bps = parseInt(e.target.value) || 0;
                      setTaxList(list);
                    }}
                    min="0"
                    max="1000"
                    className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(taxList, setTaxList, i)}
                    className="text-red-400 hover:text-red-500 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Whitelist Toggle */}
          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
              Whitelist Only
            </label>
            <div className="grid grid-cols-[.2fr_.8fr] lg:flex items-center gap-2">
              <div
                className={`relative w-[54px] h-8 flex items-center ${
                  enableWhitelist
                    ? "bg-Primary"
                    : " dark:bg-[#d5f2f80a] bg-[#01061c0d]"
                }  rounded-full p-1 cursor-pointer`}
                onClick={() => setEnableWhitelist(!enableWhitelist)}
              >
                <input
                  type="checkbox"
                  checked={enableWhitelist}
                  readOnly
                  className="hidden"
                />
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${
                    enableWhitelist ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="dark:text-white text-black lg:text-lg">
                Toggle to restrict to whitelisted addresses
              </span>
            </div>
            <div className="text-Primary lg:text-lg">
              Only whitelisted addresses can buy initially. (Max 200 addresses)
            </div>
          </div>

          {/* Whitelist Section */}
          {enableWhitelist && (
            <div
              id="wl-section"
              className="space-y-4 dark:bg-[#d5f2f80a] bg-[#01061c0d] p-6 rounded-xl dark:border border-gray-800 shadow-md mt-[10px]"
            >
              <div className="dark:text-white text-black font-medium mb-2">
                Whitelisted Addresses:{" "}
                <span className="text-green-400">{whitelist.length} / 200</span>
              </div>

              {whitelist.map((addr, i) => (
                <div
                  key={i}
                  className="group-item flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#d5f2f80a] p-4 rounded-lg dark:border border-gray-700"
                >
                  <input
                    placeholder="0x..."
                    value={addr}
                    onChange={(e) => {
                      const list = [...whitelist];
                      list[i] = e.target.value;
                      setWhitelist(list);
                    }}
                    className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(whitelist, setWhitelist, i)}
                    className="text-red-400 hover:text-red-500 text-sm font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addItem(whitelist, setWhitelist, "", 200)}
                disabled={whitelist.length >= 200}
                className="text-green-500 hover:text-green-400 text-sm font-semibold cursor-pointer"
              >
                + Add Whitelist Address ({whitelist.length}/200)
              </button>
            </div>
          )}

          {/* Start Now Toggle */}
          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
              Start Trading Now
            </label>
            <div className="grid grid-cols-[.2fr_.8fr] lg:flex items-center gap-2">
              <div
                className={`relative w-[54px] h-8 flex items-center ${
                  startNow
                    ? "bg-Primary"
                    : " dark:bg-[#d5f2f80a] bg-[#01061c0d]"
                } rounded-full p-1 cursor-pointer`}
                onClick={() => setStartNow(!startNow)}
              >
                <input
                  type="checkbox"
                  checked={startNow}
                  readOnly
                  className="hidden"
                />
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${
                    startNow ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="dark:text-white text-black lg:text-lg">
                Toggle to begin trading immediately after launch
              </span>
            </div>
          </div>

          <div className="dark:text-gray-400 text-gray-700 text-sm mt-2">
            ON = live immediately; OFF = start later.
          </div>
          {/* LP Option */}
          <div className="flex flex-col gap-2 mt-[34px]">
            <label className="text-[20px] font-semibold dark:text-white text-black font-ralewaye">
              LP Option <span className="text-red-400">*</span>
            </label>
            <select
              value={lpOption}
              onChange={(e) => setLpOption(e.target.value as "lock" | "burn")}
              required
              className="dark:bg-[#111] bg-white dark:text-white text-black border border-gray-600 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-Primary transition duration-200"
            >
              <option value="lock">Lock LP (3 months)</option>
              <option value="burn">Burn LP</option>
            </select>
          </div>

          <div className="text-Primary mt-2">
            Lock or burn liquidity after bonding.
          </div>
          {/* Bundle Toggle */}

          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label className="text-[20px] font-semibold dark:text-white text-black font-raleway">
              Enable Bundle
            </label>
            <div className="grid grid-cols-[.2fr_.8fr] lg:flex items-center gap-2">
              <div
                className={`relative w-[54px] h-8 flex items-center ${
                  enableBundle
                    ? "bg-Primary"
                    : " dark:bg-[#d5f2f80a] bg-[#01061c0d]"
                } rounded-full p-1 cursor-pointer`}
                onClick={() => setEnableBundle(!enableBundle)}
              >
                <input
                  type="checkbox"
                  checked={enableBundle}
                  readOnly
                  className="hidden"
                />
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${
                    enableBundle ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="dark:text-white text-black lg:text-lg">
                Toggle to allow dev pre-buy bundle
              </span>
            </div>
            <div className="dark:text-gray-400 text-gray-700 text-sm">
              Dev pre-buy (max 15% of supply, max 30 recipients).
            </div>
          </div>

          {/* Bundle Section */}
          {enableBundle && (
            <div
              id="bundle-section"
              className="space-y-4 dark:bg-[#d5f2f80a] bg-[#01061c0d] p-6 rounded-xl dark:border border-gray-800 shadow-md mt-[10px]"
            >
              <label className="flex flex-col gap-1 font-medium">
                <span className="dark:text-white text-black">Bundle ETH</span>
                <input
                  type="number"
                  value={bundleEth}
                  onChange={(e) =>
                    setBundleEth(parseFloat(e.target.value) || 0)
                  }
                  placeholder="10"
                  min="0"
                  step="0.001"
                  className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                />
              </label>

              <div className="dark:text-gray-400 text-gray-700 text-sm">
                ETH to spend on initial pre-buy.
              </div>
              {bundleEth > 0 && supply > 0 && (
                <div className="space-y-1 dark:bg-[#d5f2f80a] bg-[#01061c0d] p-4 rounded-md dark:border border-gray-700">
                  <div className="dark:text-white text-black">
                    Estimated tokens: ~{" "}
                    {calculateBundleTokens(bundleEth, supply).toLocaleString()}
                  </div>
                  <div className="dark:text-white text-black">
                    Percentage of supply: ~{" "}
                    {(
                      (calculateBundleTokens(bundleEth, supply) / supply) *
                      100
                    ).toFixed(2)}
                    %
                  </div>
                  <div className="dark:text-white text-black">
                    Max allowed (25%): {((supply * 25) / 100).toLocaleString()}
                  </div>
                  {calculateBundleTokens(bundleEth, supply) >
                    (supply * 25) / 100 && (
                    <div className="text-red-400 font-semibold">
                      ⚠️ Exceeds 25% limit!
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
                  className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#d5f2f80a] p-4 rounded-lg dark:border border-gray-700"
                >
                  <input
                    placeholder="0x..."
                    value={b.addr}
                    onChange={(e) => {
                      const list = [...bundleList];
                      list[i].addr = e.target.value;
                      setBundleList(list);
                    }}
                    className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                  />
                  <input
                    placeholder="Percentage (e.g. 50)"
                    type="number"
                    value={b.pct}
                    onChange={(e) => {
                      const list = [...bundleList];
                      list[i].pct = parseFloat(e.target.value) || 0;
                      setBundleList(list);
                    }}
                    min="0"
                    max="100"
                    step="0.01"
                    className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(bundleList, setBundleList, i)}
                    className="text-red-400 hover:text-red-500 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  addItem(bundleList, setBundleList, { addr: "", pct: 0 }, 30)
                }
                disabled={bundleList.length >= 30}
                className="text-green-500 hover:text-green-400 text-sm font-semibold cursor-pointer"
              >
                + Add Bundle Entry ({bundleList.length}/30)
              </button>
            </div>
          )}

          {/* Platform Fee Toggle */}
          <div className="flex flex-col gap-[10px] mt-[34px]">
            <label className="text-[20px] font-semibold  dark:text-white text-black font-raleway">
              Enable Platform Fees
            </label>
            <div className="grid grid-cols-[.2fr_.8fr] lg:flex items-center gap-2">
              <div
                className={`relative w-[54px] h-8 flex items-center ${
                  enablePlatformFee
                    ? "bg-Primary"
                    : " dark:bg-[#d5f2f80a] bg-[#01061c0d]"
                } rounded-full p-1 cursor-pointer`}
                onClick={() => setEnablePlatformFee(!enablePlatformFee)}
              >
                <input
                  type="checkbox"
                  checked={enablePlatformFee}
                  readOnly
                  className="hidden"
                />
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${
                    enablePlatformFee ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="dark:text-white text-black lg:text-lg">
                Toggle to enable dev/platform fee
              </span>
            </div>
            <div className="dark:text-gray-400 text-gray-700 text-sm">
              Dev/platform fee (max 5%, max 5 recipients).
            </div>
          </div>

          {/* Platform Fee Section */}
          {enablePlatformFee && (
            <div
              id="pf-section"
              className="space-y-4 bg-[#d5f2f80a] p-6 rounded-xl dark:border border-gray-800 shadow-md mt-[10px]"
            >
              <label className="flex flex-col gap-1 font-medium">
                <span className="dark:text-white text-black">
                  Platform Fee BPS
                </span>
                <input
                  type="number"
                  value={platformFeeBps}
                  onChange={(e) =>
                    setPlatformFeeBps(parseInt(e.target.value) || 0)
                  }
                  placeholder="e.g. 250 (2.5%)"
                  min="0"
                  max="500"
                  className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                />
              </label>

              <div className="dark:text-gray-400 text-gray-700 text-sm">
                Max 500 BPS (5%).
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
                  className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#d5f2f80a] p-4 rounded-lg dark:border border-gray-700"
                >
                  <input
                    placeholder="0x..."
                    value={p.addr}
                    onChange={(e) => {
                      const list = [...platformFeeList];
                      list[i].addr = e.target.value;
                      setPlatformFeeList(list);
                    }}
                    className="flex-1 w-full dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
                  />
                  <input
                    placeholder="Percentage (e.g. 50)"
                    type="number"
                    value={p.pct}
                    onChange={(e) => {
                      const list = [...platformFeeList];
                      list[i].pct = parseFloat(e.target.value) || 0;
                      setPlatformFeeList(list);
                    }}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full md:w-40 dark:bg-[#d5f2f80a] bg-[#01061c0d] dark:text-white text-black dark:border border-gray-600 px-3 py-2 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-Primary"
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
                    { addr: "", pct: 0 },
                    5
                  )
                }
                disabled={platformFeeList.length >= 5}
                className="text-green-500 hover:text-green-400 text-sm font-semibold cursor-pointer"
              >
                + Add Platform Fee Recipient ({platformFeeList.length}/5)
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-[#3BC3DB] to-[#0C8CE0] px-6 py-4 text-white font-semibold mx-auto mt-4 flex items-center justify-center gap-2"
            disabled={isPending || isConfirming || !isFormValid}
            style={{
              opacity: !isFormValid ? 0.5 : 1,
              cursor: !isFormValid ? "not-allowed" : "pointer",
            }}
          >
            {isFormValid ? (
              <>
                <span>Create Token</span>
                <img src={rocket} alt="rocket" className="w-5 h-5" />
              </>
            ) : (
              "Fix Validation Errors"
            )}
          </button>
        </form>
        {error && (
          <p className="text-red-500">Error: {(error as BaseError).message}</p>
        )}
        {isConfirmed && (
          <p className="text-green-500">
            Token launched! Deployed Hash:{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${result.transactionHash}`}
            >
              Click Here
            </a>
          </p>
        )}

        {waitingForVerification && (
          <div>Please wait, we are waiting for the block to finalize....</div>
        )}
        {statusMessage && <div>{statusMessage}</div>}
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
