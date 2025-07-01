// safu-dapp/src/pages/Launch.tsx
import React, { useCallback, useEffect, useState, type FormEvent } from "react";
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

/**
 * Description placeholder
 *
 * @interface ValidationError
 * @typedef {ValidationError}
 */
interface ValidationError {
  /**
   * Description placeholder
   *
   * @type {string}
   */
  field: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  message: string;
}

/**
 * Description placeholder
 *
 * @export
 * @returns {*}
 */
export default function Launch() {
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
  const taxRecipientsAddrs = enableTax
    ? (taxList.map((t) => t.addr) as readonly `0x${string}`[])
    : ([] as readonly `0x${string}`[]);
  const taxPercentsArray = enableTax
    ? (taxList.map((t) => t.bps) as readonly number[])
    : ([] as readonly number[]);

  const bundleAddrs = enableBundle
    ? (bundleList.map((b) => b.addr) as readonly `0x${string}`[])
    : ([] as readonly `0x${string}`[]);
  const bundleShares = enableBundle
    ? (bundleList.map((b) => Math.floor(b.pct * 100)) as readonly number[])
    : ([] as readonly number[]);
  const ethValue = enableBundle ? ethers.parseEther(bundleEth.toString()) : 0n;

  const wlArray = enableWhitelist
    ? (whitelist as readonly `0x${string}`[])
    : ([] as readonly `0x${string}`[]);

  const pfBps = enablePlatformFee ? platformFeeBps : 0;
  const pfAddrs = enablePlatformFee
    ? (platformFeeList.map((p) => p.addr) as readonly `0x${string}`[])
    : ([] as readonly `0x${string}`[]);
  const pfPercs = enablePlatformFee
    ? (platformFeeList.map((p) => Math.floor(p.pct * 100)) as readonly number[])
    : ([] as readonly number[]);

  // Build args
  const argArray: [
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
  ] = [
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
  ];

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
    encodedMessageWithoutPrefix: any,
    tokenAddress: any
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
        const fd = new FormData();
        fd.append("name", name);
        fd.append("symbol", symbol);
        fd.append("website", website);
        fd.append("description", description);
        fd.append("tokenCreator", result.from);
        fd.append("createdAt", createdAt); // <–– here you use the block time

        const lastLog = result.logs[result.logs.length - 1];
        const topic1 = lastLog?.topics[1] ?? "";
        const tokenAddress = topic1.length
          ? ethers.getAddress("0x" + topic1.slice(-40))
          : "";
        fd.append("tokenAddress", tokenAddress);
        if (logo) fd.append("logo", logo);

        // const API = `https://safulauncher-production.up.railway.app`;
        const API = import.meta.env.VITE_API_BASE_URL;
        await fetch(`${API}/api/tokens`, { method: "POST", body: fd });

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
  }, [isConfirmed]);

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
    <div className="container">
      <h1>Launch Your Token</h1>

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div
          className="validation-errors"
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#dc2626", margin: "0 0 8px 0" }}>
            Please fix the following issues:
          </h3>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {validationErrors.map((error, index) => (
              <li key={index} style={{ color: "#dc2626", marginBottom: "4px" }}>
                <strong>{error.field}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form id="launch-form" onSubmit={handleSubmit}>
        {/* Name */}
        <label>
          <span className="mandatory">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <div className="help">Token name (e.g. "MoonCat")</div>

        {/* Symbol */}
        <label>
          <span className="mandatory">Symbol</span>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
          />
        </label>
        <div className="help">Ticker symbol (e.g. "MCAT")</div>

        {/* Supply */}
        <label>
          <span className="mandatory">Supply</span>
          <input
            type="number"
            value={supply}
            onChange={(e) => setSupply(parseInt(e.target.value) || 0)}
            required
            min="1"
          />
        </label>
        <div className="help">Total supply (e.g. 1,000,000,000)</div>

        <input
          type="url"
          placeholder="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
        />

        {/* Tax Toggle */}
        <div className="toggle-group">
          <span>Enable Tax</span>
          <div className="toggle" onClick={() => setEnableTax(!enableTax)}>
            <input type="checkbox" checked={enableTax} readOnly />
            <div className="knob" />
          </div>
        </div>
        <div className="help">
          Collect up to 10% tax on Uniswap trades. (Max 5 recipients)
        </div>

        {/* Tax Section */}
        {enableTax && (
          <div id="tax-section" className="group">
            <div className="help" style={{ marginBottom: "10px" }}>
              Current total: {taxList.reduce((sum, t) => sum + (t.bps || 0), 0)}{" "}
              BPS (
              {(
                taxList.reduce((sum, t) => sum + (t.bps || 0), 0) / 100
              ).toFixed(1)}
              %)
            </div>
            {taxList.map((t, i) => (
              <div key={i} className="group-item">
                <input
                  placeholder="0x..."
                  value={t.addr}
                  onChange={(e) => {
                    const list = [...taxList];
                    list[i].addr = e.target.value;
                    setTaxList(list);
                  }}
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
                />
                <button
                  type="button"
                  onClick={() => removeItem(taxList, setTaxList, i)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                addItem(taxList, setTaxList, { addr: "", bps: 0 }, 5)
              }
              disabled={taxList.length >= 5}
            >
              + Add Tax Recipient ({taxList.length}/5)
            </button>
          </div>
        )}

        {/* Whitelist Toggle */}
        <div className="toggle-group">
          <span>Whitelist Only</span>
          <div
            className="toggle"
            onClick={() => setEnableWhitelist(!enableWhitelist)}
          >
            <input type="checkbox" checked={enableWhitelist} readOnly />
            <div className="knob" />
          </div>
        </div>
        <div className="help">
          Only whitelisted addresses can buy initially. (Max 200 addresses)
        </div>

        {/* Whitelist Section */}
        {enableWhitelist && (
          <div id="wl-section" className="group">
            {whitelist.map((addr, i) => (
              <div key={i} className="group-item">
                <input
                  placeholder="0x..."
                  value={addr}
                  onChange={(e) => {
                    const list = [...whitelist];
                    list[i] = e.target.value;
                    setWhitelist(list);
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeItem(whitelist, setWhitelist, i)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem(whitelist, setWhitelist, "", 200)}
              disabled={whitelist.length >= 200}
            >
              + Add Whitelist Address ({whitelist.length}/200)
            </button>
          </div>
        )}

        {/* Start Now Toggle */}
        <div className="toggle-group">
          <span>Start Trading Now</span>
          <div className="toggle" onClick={() => setStartNow(!startNow)}>
            <input type="checkbox" checked={startNow} readOnly />
            <div className="knob" />
          </div>
        </div>
        <div className="help">ON = live immediately; OFF = start later.</div>

        {/* LP Option */}
        <label>
          <span className="mandatory">LP Option</span>
          <select
            value={lpOption}
            onChange={(e) => setLpOption(e.target.value as any)}
            required
          >
            <option value="lock">Lock LP (3 months)</option>
            <option value="burn">Burn LP</option>
          </select>
        </label>
        <div className="help">Lock or burn liquidity after bonding.</div>

        {/* Bundle Toggle */}
        <div className="toggle-group">
          <span>Enable Bundle</span>
          <div
            className="toggle"
            onClick={() => setEnableBundle(!enableBundle)}
          >
            <input type="checkbox" checked={enableBundle} readOnly />
            <div className="knob" />
          </div>
        </div>
        <div className="help">
          Dev pre-buy (max 15% of supply, max 30 recipients).
        </div>

        {/* Bundle Section */}
        {enableBundle && (
          <div id="bundle-section" className="group">
            <label>
              <span>Bundle ETH</span>
              <input
                type="number"
                value={bundleEth}
                onChange={(e) => setBundleEth(parseFloat(e.target.value) || 0)}
                placeholder="10"
                min="0"
                step="0.001"
              />
            </label>
            <div className="help">ETH to spend on initial pre-buy.</div>

            {/* Bundle calculation display */}
            {bundleEth > 0 && supply > 0 && (
              <div
                className="bundle-calc"
                style={{
                  background: "#f3f4f6",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  marginBottom: "10px",
                  fontSize: "14px",
                }}
              >
                <div>
                  Estimated tokens: ~
                  {calculateBundleTokens(bundleEth, supply).toLocaleString()}
                </div>
                <div>
                  Percentage of supply: ~
                  {(
                    (calculateBundleTokens(bundleEth, supply) / supply) *
                    100
                  ).toFixed(2)}
                  %
                </div>
                <div>
                  Max allowed (25%): {((supply * 25) / 100).toLocaleString()}
                </div>
                {calculateBundleTokens(bundleEth, supply) >
                  (supply * 25) / 100 && (
                  <div style={{ color: "#dc2626", fontWeight: "bold" }}>
                    ⚠️ Exceeds 25% limit!
                  </div>
                )}
              </div>
            )}
            <div className="help" style={{ marginBottom: "10px" }}>
              Current total:{" "}
              {bundleList.reduce((sum, b) => sum + (b.pct || 0), 0).toFixed(2)}%
            </div>

            {bundleList.map((b, i) => (
              <div key={i} className="group-item">
                <input
                  placeholder="0x..."
                  value={b.addr}
                  onChange={(e) => {
                    const list = [...bundleList];
                    list[i].addr = e.target.value;
                    setBundleList(list);
                  }}
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
                />
                <button
                  type="button"
                  onClick={() => removeItem(bundleList, setBundleList, i)}
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
            >
              + Add Bundle Entry ({bundleList.length}/30)
            </button>
          </div>
        )}

        {/* Platform Fee Toggle */}
        <div className="toggle-group">
          <span>Enable Platform Fees</span>
          <div
            className="toggle"
            onClick={() => setEnablePlatformFee(!enablePlatformFee)}
          >
            <input type="checkbox" checked={enablePlatformFee} readOnly />
            <div className="knob" />
          </div>
        </div>
        <div className="help">Dev/platform fee (max 5%, max 5 recipients).</div>

        {/* Platform Fee Section */}
        {enablePlatformFee && (
          <div id="pf-section" className="group">
            <label>
              <span>Platform Fee BPS</span>
              <input
                type="number"
                value={platformFeeBps}
                onChange={(e) =>
                  setPlatformFeeBps(parseInt(e.target.value) || 0)
                }
                placeholder="e.g. 250 (2.5%)"
                min="0"
                max="500"
              />
            </label>
            <div className="help">Max 500 BPS (5%).</div>

            <div className="help" style={{ marginBottom: "10px" }}>
              Current total:{" "}
              {platformFeeList
                .reduce((sum, p) => sum + (p.pct || 0), 0)
                .toFixed(2)}
              %
            </div>

            {platformFeeList.map((p, i) => (
              <div key={i} className="group-item">
                <input
                  placeholder="0x..."
                  value={p.addr}
                  onChange={(e) => {
                    const list = [...platformFeeList];
                    list[i].addr = e.target.value;
                    setPlatformFeeList(list);
                  }}
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
                />
                <button
                  type="button"
                  onClick={() =>
                    removeItem(platformFeeList, setPlatformFeeList, i)
                  }
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
            >
              + Add Platform Fee Recipient ({platformFeeList.length}/5)
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="submit-btn"
          disabled={isPending || isConfirming || !isFormValid}
          style={{
            opacity: !isFormValid ? 0.5 : 1,
            cursor: !isFormValid ? "not-allowed" : "pointer",
          }}
        >
          {!isFormValid ? "Fix Validation Errors" : "Create Token"}
        </button>
      </form>

      {error && (
        <p className="text-red-500">Error: {(error as BaseError).message}</p>
      )}
      {isConfirmed && (
        <p className="text-green-500">
          Token launched! Deployed Hash:{" "}
          <a href={`https://sepolia.etherscan.io/tx/${result.transactionHash}`}>
            Click Here
          </a>
        </p>
      )}

      {waitingForVerification && (
        <div>Please wait, we are waiting for the block to finalize...</div>
      )}
      {statusMessage && <div>{statusMessage}</div>}
    </div>
  );
}
