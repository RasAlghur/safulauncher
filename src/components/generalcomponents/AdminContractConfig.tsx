import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  type BaseError,
  useBalance,
} from "wagmi";
import { LAUNCHER_ABI_V1, SAFU_LAUNCHER_ADDRESSES_V1 } from "../../web3/config";
import { ethers } from "ethers";
import { useState } from "react";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";

const AdminContractConfig = () => {
  const networkInfo = useNetworkEnvironment();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // State for form inputs
  const [tradeFeeBps, setTradeFeeBps] = useState<string>("");
  const [newPoolETH, setNewPoolETH] = useState<string>("");
  const [newDevRewardETH, setNewDevRewardETH] = useState<string>("");
  const [listingFeeBps, setListingFeeBps] = useState<string>("");
  const [listingFeeDiv, setListingFeeDiv] = useState<string>("");
  const [safuTokenAddress, setSafuTokenAddress] = useState<string>("");
  const [newOwner, setNewOwner] = useState<string>("");

  // Creator configs
  const [taxOnSafuMaxBps, setTaxOnSafuMaxBps] = useState<string>("");
  const [taxOnDexMaxBps, setTaxOnDexMaxBps] = useState<string>("");
  const [bundleMaxAmount, setBundleMaxAmount] = useState<string>("");
  const [listingMilestone, setListingMilestone] = useState<string>("");
  const [maxWhitelistBps, setMaxWhitelistBps] = useState<string>("");

  // Tier threshold configs
  const [tier1Threshold, setTier1Threshold] = useState<string>("");
  const [tier1ThresholdDiv, setTier1ThresholdDiv] = useState<string>("");
  const [tier1WLCap, setTier1WLCap] = useState<string>("");
  const [tier1WLDiv, setTier1WLDiv] = useState<string>("");
  const [tier2Threshold, setTier2Threshold] = useState<string>("");
  const [tier2ThresholdDiv, setTier2ThresholdDiv] = useState<string>("");
  const [tier2WLCap, setTier2WLCap] = useState<string>("");
  const [tier2WLDiv, setTier2WLDiv] = useState<string>("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Read current contract values
  const { data: currentTradeFeeBps } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "tradeFeeBps",
  });

  const { data: getListingFeeBps } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "listingFeeBps",
  });
  const { data: getListingFeeDiv } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "listingFeeDiv",
  });

  const { data: getTaxOnSafuMaxBps } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "taxOnSafuMaxBps",
  });
  const { data: getTaxOnDexMaxBps } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "taxOnDexMaxBps",
  });
  const { data: getListingMilestone } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "listingMilestone",
  });
  const { data: getBundleMaxAmount } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "bundleMaxAmount",
  });
  const { data: getMaxWhitelistBps } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "maxWhitelistBps",
  });

  const { data: currentInitialPoolEth } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "initialPoolEth",
  });

  const { data: currentDevRewardETH } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "devRewardETH",
  });

  const { data: geReservedETH } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

    abi: LAUNCHER_ABI_V1.abi,
    functionName: "reservedEth",
  });

  const { data: contractBalance } = useBalance({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],
  });

  const { data: currentOwner } = useReadContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "owner",
  });

  // Validation functions
  const validateTradeFeeBps = (value: string): string | null => {
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < 0) return "Cannot be negative";
    if (num > 10) return "Cannot exceed 10% (contract limit)";
    return null;
  };

  const validateEthAmount = (value: string): string | null => {
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < 0) return "Cannot be negative";
    if (num > 100) return "Exceeds reasonable limit";
    return null;
  };

  const validatePercentage = (
    value: string,
    max: number = 100
  ): string | null => {
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num < 0) return "Cannot be negative";
    if (num > max) return `Cannot exceed ${max}%`;
    return null;
  };

  const validateAddress = (value: string): string | null => {
    if (!value) return "Address is required";
    if (!/^0x[a-fA-F0-9]{40}$/.test(value))
      return "Invalid Ethereum address format";
    return null;
  };

  const validateTierHierarchy = (): string | null => {
    if (
      !tier1Threshold ||
      !tier1ThresholdDiv ||
      !tier2Threshold ||
      !tier2ThresholdDiv
    ) {
      return null;
    }

    const tier1Percent =
      (parseFloat(tier1Threshold) / parseFloat(tier1ThresholdDiv)) * 100;
    const tier2Percent =
      (parseFloat(tier2Threshold) / parseFloat(tier2ThresholdDiv)) * 100;

    if (tier2Percent > tier1Percent) {
      return "Tier 2 threshold must be lower than Tier 1 threshold";
    }
    return null;
  };

  const handleValidation = (
    fieldName: string,
    value: string,
    validator: (val: string) => string | null
  ) => {
    const error = validator(value);
    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: error || "",
    }));
    return !error;
  };

  const Tooltip = ({
    content,
    children,
  }: {
    content: string;
    children: React.ReactNode;
  }) => (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  const FormSection = ({
    title,
    children,
    tooltip,
  }: {
    title: string;
    children: React.ReactNode;
    tooltip?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          {title}
        </h3>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info className="w-4 h-4 text-gray-500 hover:text-blue-500 cursor-help" />
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );

  const InputField = ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    currentValue,
    tooltip,
    validator,
    fieldName,
    unit,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    currentValue?: string | number;
    tooltip?: string;
    validator?: (val: string) => string | null;
    fieldName?: string;
    unit?: string;
  }) => {
    const hasError = fieldName && validationErrors[fieldName];

    const handleChange = (newValue: string) => {
      onChange(newValue);
      if (validator && fieldName) {
        handleValidation(fieldName, newValue, validator);
      }
    };

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {currentValue !== undefined && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                (Current: {currentValue.toString()}
                {unit && ` ${unit}`})
              </span>
            )}
          </label>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="w-3 h-3 text-gray-400 hover:text-blue-500 cursor-help" />
            </Tooltip>
          )}
        </div>
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           ${hasError
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
              }`}
          />
          {hasError && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          )}
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {hasError}
          </p>
        )}
      </div>
    );
  };

  const ActionButton = ({
    onClick,
    children,
    disabled = false,
    variant = "primary",
    isValid = true,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    variant?: "primary" | "danger";
    isValid?: boolean;
  }) => {
    const baseClasses =
      "px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2";
    const variantClasses =
      variant === "danger"
        ? "bg-red-600 hover:bg-red-700 text-white"
        : "bg-blue-600 hover:bg-blue-700 text-white";

    const isDisabled = disabled || isPending || !isValid;

    return (
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`${baseClasses} ${variantClasses}`}
      >
        {isPending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            {isValid && <CheckCircle className="w-4 h-4" />}
            {children}
          </>
        )}
      </button>
    );
  };

  // Always coerce to boolean (no string | false anywhere!)
  const isTradeFeeBpsValid: boolean =
    !validationErrors.tradeFeeBps && tradeFeeBps.trim() !== "";

  const isPoolConfigValid: boolean =
    !validationErrors.newPoolETH &&
    !validationErrors.newDevRewardETH &&
    newPoolETH.trim() !== "" &&
    newDevRewardETH.trim() !== "";

  const isListingFeeValid: boolean =
    !validationErrors.listingFeeBps &&
    !validationErrors.listingFeeDiv &&
    listingFeeBps.trim() !== "" &&
    listingFeeDiv.trim() !== "";

  const isSafuTokenValid: boolean =
    !validationErrors.safuTokenAddress && safuTokenAddress.trim() !== "";

  const isCreatorConfigValid: boolean =
    !validationErrors.taxOnSafuMaxBps &&
    !validationErrors.taxOnDexMaxBps &&
    !validationErrors.bundleMaxAmount &&
    !validationErrors.listingMilestone &&
    !validationErrors.maxWhitelistBps &&
    taxOnSafuMaxBps.trim() !== "" &&
    taxOnDexMaxBps.trim() !== "" &&
    bundleMaxAmount.trim() !== "" &&
    listingMilestone.trim() !== "" &&
    maxWhitelistBps.trim() !== "";

  const tierHierarchyError = validateTierHierarchy();

  const isTierConfigValid: boolean =
    !tierHierarchyError &&
    !validationErrors.tier1Threshold &&
    !validationErrors.tier1ThresholdDiv &&
    !validationErrors.tier1WLCap &&
    !validationErrors.tier1WLDiv &&
    !validationErrors.tier2Threshold &&
    !validationErrors.tier2ThresholdDiv &&
    !validationErrors.tier2WLCap &&
    !validationErrors.tier2WLDiv &&
    tier1Threshold.trim() !== "" &&
    tier1ThresholdDiv.trim() !== "" &&
    tier1WLCap.trim() !== "" &&
    tier1WLDiv.trim() !== "" &&
    tier2Threshold.trim() !== "" &&
    tier2ThresholdDiv.trim() !== "" &&
    tier2WLCap.trim() !== "" &&
    tier2WLDiv.trim() !== "";

  return (
    <div className="p-4 max-w-6xl mx-auto mt-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          SafuLauncher Admin Panel for Address: {SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId]}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage contract parameters and system configurations
        </p>
      </div>

      {/* Contract Metrics */}
      <FormSection
        title="📊 Contract Information"
        tooltip="Current contract state and metrics"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Number(currentTradeFeeBps) / 100 || "0"}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Trade Fee (%)
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {currentInitialPoolEth
                ? ethers.formatEther(currentInitialPoolEth.toString())
                : "0"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Initial Pool ETH
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {currentDevRewardETH
                ? ethers.formatEther(currentDevRewardETH.toString())
                : "0"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Dev Reward ETH
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(Number(getListingFeeBps) / Number(getListingFeeDiv)) * 100}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Listing Fee
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Number(getTaxOnSafuMaxBps) / 100}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Max Tax On Safu
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Number(getTaxOnDexMaxBps) / 100}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Max Tax On Dex
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {getListingMilestone}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Listing Milestone
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {getBundleMaxAmount}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Max Dev Bundle Amount
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Number(getMaxWhitelistBps) / 100}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Max Whitelist Amount
            </div>
          </div>
        </div>
      </FormSection>

      {/* Transaction Status */}
      {hash && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            Transaction Hash: <span className="font-mono text-sm">{hash}</span>
          </p>
          {isConfirming && (
            <p className="text-blue-600 dark:text-blue-300 mt-2">
              Waiting for confirmation...
            </p>
          )}
          {isConfirmed && (
            <p className="text-green-600 dark:text-green-400 mt-2">
              ✅ Transaction confirmed!
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error: {(error as BaseError).shortMessage || error.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Functions */}
        <FormSection
          title="🚨 Emergency Functions"
          tooltip="To remove extra ETH from the safu launcher contract"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-3">
                Contract Balance:{" "}
                {contractBalance ? contractBalance.formatted : "0"} ETH
              </p>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-3">
                Reserved ETH:{" "}
                {geReservedETH
                  ? ethers.formatEther(geReservedETH.toString())
                  : "0"}{" "}
                ETH
              </p>
              <ActionButton
                onClick={() =>
                  writeContract({
                    address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

                    abi: LAUNCHER_ABI_V1.abi,
                    functionName: "withdrawStuckETH",
                    args: [],
                  })
                }
                variant="danger"
              >
                Withdraw Stuck ETH
              </ActionButton>
            </div>
          </div>
        </FormSection>

        {/* Ownership Transfer Section */}
        <FormSection
          title="👑 Ownership"
          tooltip="Transfer contract ownership to a new address"
        >
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Owner
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 font-mono text-sm truncate">
                {currentOwner?.toString() || "Loading..."}
              </div>
            </div>

            <InputField
              label="New Owner Address"
              value={newOwner}
              onChange={setNewOwner}
              placeholder="0x..."
              tooltip="New contract owner address"
              validator={validateAddress}
              fieldName="newOwner"
            />

            <ActionButton
              onClick={() =>
                writeContract({
                  address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],
                  abi: LAUNCHER_ABI_V1.abi,
                  functionName: "transferOwnership",
                  args: [newOwner as `0x${string}`],
                })
              }
              isValid={!validationErrors.newOwner && !!newOwner}
              variant="danger"
            >
              Transfer Ownership
            </ActionButton>
          </div>
        </FormSection>

        {/* Fee Configuration */}
        <FormSection
          title="💰 Fee Configuration"
          tooltip="Configure platform trading and listing fees"
        >
          <div className="space-y-4">
            <InputField
              label="Trade Fee (%)"
              value={tradeFeeBps}
              onChange={setTradeFeeBps}
              placeholder="0.3 (0.3%)"
              currentValue={Number(currentTradeFeeBps) / 100}
              tooltip="Fee charged on each trade (max 10%)"
              validator={validateTradeFeeBps}
              fieldName="tradeFeeBps"
              unit="%"
            />
            <ActionButton
              onClick={() =>
                writeContract({
                  address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

                  abi: LAUNCHER_ABI_V1.abi,
                  functionName: "setTradeFeeBps",
                  args: [BigInt(parseInt(tradeFeeBps) * 100)],
                })
              }
              isValid={isTradeFeeBpsValid}
            >
              Update Trade Fee
            </ActionButton>

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Listing Fee"
                value={listingFeeBps}
                onChange={setListingFeeBps}
                placeholder="5"
                tooltip="Numerator for listing fee calculation"
                validator={(val) => validatePercentage(val, 100)}
                fieldName="listingFeeBps"
              />
              <InputField
                label="Listing Fee Divisor"
                value={listingFeeDiv}
                onChange={setListingFeeDiv}
                placeholder="100"
                tooltip="Denominator for listing fee calculation"
                validator={(val) => {
                  const num = parseInt(val);
                  if (isNaN(num) || num <= 0)
                    return "Must be a positive integer";
                  return null;
                }}
                fieldName="listingFeeDiv"
              />
            </div>
            <ActionButton
              onClick={() =>
                writeContract({
                  address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

                  abi: LAUNCHER_ABI_V1.abi,
                  functionName: "updateListingFee",
                  args: [BigInt(parseInt(listingFeeBps)), BigInt(parseInt(listingFeeDiv))],
                })
              }
              isValid={isListingFeeValid}
            >
              Update Listing Fee
            </ActionButton>
          </div>
        </FormSection>

        {/* Pool Configuration */}
        <FormSection
          title="🏊 Pool Configuration"
          tooltip="Configure initial liquidity pool settings"
        >
          <div className="space-y-4">
            <InputField
              label="Initial Pool ETH"
              value={newPoolETH}
              onChange={setNewPoolETH}
              placeholder="1.5"
              type="number"
              currentValue={
                currentInitialPoolEth
                  ? ethers.formatEther(currentInitialPoolEth.toString())
                  : "0"
              }
              tooltip="ETH amount for initial virtual liquidity pool"
              validator={validateEthAmount}
              fieldName="newPoolETH"
              unit="ETH"
            />
            <InputField
              label="Dev Reward ETH"
              value={newDevRewardETH}
              onChange={setNewDevRewardETH}
              placeholder="0.2"
              type="number"
              currentValue={
                currentDevRewardETH
                  ? ethers.formatEther(currentDevRewardETH.toString())
                  : "0"
              }
              tooltip="ETH reward given to token creators upon listing"
              validator={validateEthAmount}
              fieldName="newDevRewardETH"
              unit="ETH"
            />
            <ActionButton
              onClick={() =>
                writeContract({
                  address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

                  abi: LAUNCHER_ABI_V1.abi,
                  functionName: "updatePoolConfigs",
                  args: [
                    ethers.parseEther(newPoolETH || "0"),
                    ethers.parseEther(newDevRewardETH || "0"),
                  ],
                })
              }
              isValid={isPoolConfigValid}
            >
              Update Pool Configs
            </ActionButton>
          </div>
        </FormSection>

        {/* Creator Configuration */}
        <FormSection
          title="⚙️ Creator Configuration"
          tooltip="Configure limits for token creators"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Max Tax on Safu (%)"
                value={taxOnSafuMaxBps}
                onChange={setTaxOnSafuMaxBps}
                placeholder="5 (5%)"
                currentValue={Number(getTaxOnSafuMaxBps) / 100}
                tooltip="Maximum tax rate creators can set on SafuLauncher trades"
                validator={(val) => validatePercentage(val, 50)}
                fieldName="taxOnSafuMaxBps"
                unit="%"
              />
              <InputField
                label="Max Tax on Dex (%)"
                value={taxOnDexMaxBps}
                onChange={setTaxOnDexMaxBps}
                placeholder="10 (10%)"
                currentValue={Number(getTaxOnDexMaxBps) / 100}
                tooltip="Maximum tax rate creators can set on DEX trades"
                validator={(val) => validatePercentage(val, 50)}
                fieldName="taxOnDexMaxBps"
                unit="%"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InputField
                label="Bundle Max Amount (%)"
                value={bundleMaxAmount}
                onChange={setBundleMaxAmount}
                placeholder="25"
                currentValue={Number(getBundleMaxAmount)}
                tooltip="Maximum percentage of tokens that can be bundled at launch"
                validator={(val) => validatePercentage(val, 50)}
                fieldName="bundleMaxAmount"
                unit="%"
              />
              <InputField
                label="Listing Milestone (%)"
                value={listingMilestone}
                onChange={setListingMilestone}
                placeholder="70"
                currentValue={Number(getListingMilestone)}
                tooltip="Percentage of tokens sold required for automatic listing (min 10%)"
                validator={(val) => {
                  const error = validatePercentage(val, 100);
                  if (error) return error;
                  if (parseFloat(val) < 10) return "Must be at least 10%";
                  return null;
                }}
                fieldName="listingMilestone"
                unit="%"
              />
              <InputField
                label="Max Whitelist (%)"
                value={maxWhitelistBps}
                onChange={setMaxWhitelistBps}
                placeholder="2 (2%)"
                currentValue={Number(getMaxWhitelistBps) / 100}
                tooltip="Maximum percentage per user in whitelist allocations"
                validator={(val) => validatePercentage(val, 10)}
                fieldName="maxWhitelistBps"
                unit="%"
              />
            </div>
            <ActionButton
              onClick={() =>
                writeContract({
                  address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

                  abi: LAUNCHER_ABI_V1.abi,
                  functionName: "updateCreatorConfigs",
                  args: [
                    BigInt(parseInt(taxOnSafuMaxBps) * 100),
                    BigInt(parseInt(taxOnDexMaxBps) * 100),
                    BigInt(BigInt(bundleMaxAmount)),
                    BigInt(BigInt(listingMilestone)),
                    BigInt(parseInt(maxWhitelistBps) * 100),
                  ],
                })
              }
              isValid={isCreatorConfigValid}
            >
              Update Creator Configs
            </ActionButton>
          </div>
        </FormSection>

        {/* SAFU Token Configuration */}
        <FormSection
          title="🪙 SAFU Token"
          tooltip="Configure the SAFU token contract address"
        >
          <div className="space-y-4">
            <InputField
              label="SAFU Token Contract Address"
              value={safuTokenAddress}
              onChange={setSafuTokenAddress}
              placeholder="0x..."
              tooltip="Contract address of the SAFU token used for auto-whitelist tiers"
              validator={validateAddress}
              fieldName="safuTokenAddress"
            />
            <ActionButton
              onClick={() =>
                writeContract({
                  address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

                  abi: LAUNCHER_ABI_V1.abi,
                  functionName: "updateSafuTokenCA",
                  args: [safuTokenAddress as `0x${string}`],
                })
              }
              isValid={isSafuTokenValid}
            >
              Update SAFU Token Address
            </ActionButton>
          </div>
        </FormSection>

        {/* Tier Threshold Configuration */}
        <FormSection
          title="🎯 SAFU Token Holders Whitelist Tiers"
          tooltip="Configure whitelist tiers for SAFU token holders"
        >
          <div className="space-y-4">
            {tierHierarchyError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-200 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {tierHierarchyError}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  🥇 Tier 1 Settings (Gold)
                  <Tooltip content="Highest tier with lowest threshold requirements">
                    <Info className="w-3 h-3 text-gray-400" />
                  </Tooltip>
                </h4>
                <InputField
                  label="Tier 1 Threshold"
                  value={tier1Threshold}
                  onChange={setTier1Threshold}
                  placeholder="1"
                  tooltip="Numerator for minimum SAFU token percentage required"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier1Threshold"
                />
                <InputField
                  label="Tier 1 Threshold Divisor"
                  value={tier1ThresholdDiv}
                  onChange={setTier1ThresholdDiv}
                  placeholder="100"
                  tooltip="Denominator for threshold calculation (1/100 = 1%)"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier1ThresholdDiv"
                />
                <InputField
                  label="Tier 1 WL Cap"
                  value={tier1WLCap}
                  onChange={setTier1WLCap}
                  placeholder="1"
                  tooltip="Numerator for max tokens this tier can purchase"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier1WLCap"
                />
                <InputField
                  label="Tier 1 WL Divisor"
                  value={tier1WLDiv}
                  onChange={setTier1WLDiv}
                  placeholder="100"
                  tooltip="Denominator for whitelist cap (1/100 = 1%)"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier1WLDiv"
                />
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <p className="text-blue-700 dark:text-blue-300">
                    Current:{" "}
                    {tier1Threshold && tier1ThresholdDiv
                      ? `${(
                        (parseInt(tier1Threshold) /
                          parseInt(tier1ThresholdDiv)) *
                        100
                      ).toFixed(3)}%`
                      : "N/A"}{" "}
                    threshold,{" "}
                    {tier1WLCap && tier1WLDiv
                      ? `${(
                        (parseInt(tier1WLCap) / parseInt(tier1WLDiv)) *
                        100
                      ).toFixed(3)}%`
                      : "N/A"}{" "}
                    cap
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  🥈 Tier 2 Settings (Silver)
                  <Tooltip content="Second tier with higher threshold requirements">
                    <Info className="w-3 h-3 text-gray-400" />
                  </Tooltip>
                </h4>
                <InputField
                  label="Tier 2 Threshold"
                  value={tier2Threshold}
                  onChange={setTier2Threshold}
                  placeholder="3"
                  tooltip="Numerator for minimum SAFU token percentage required"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier2Threshold"
                />
                <InputField
                  label="Tier 2 Threshold Divisor"
                  value={tier2ThresholdDiv}
                  onChange={setTier2ThresholdDiv}
                  placeholder="1000"
                  tooltip="Denominator for threshold calculation (3/1000 = 0.3%)"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier2ThresholdDiv"
                />
                <InputField
                  label="Tier 2 WL Cap"
                  value={tier2WLCap}
                  onChange={setTier2WLCap}
                  placeholder="5"
                  tooltip="Numerator for max tokens this tier can purchase"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier2WLCap"
                />
                <InputField
                  label="Tier 2 WL Divisor"
                  value={tier2WLDiv}
                  onChange={setTier2WLDiv}
                  placeholder="1000"
                  tooltip="Denominator for whitelist cap (5/1000 = 0.5%)"
                  validator={(val) => {
                    const num = parseInt(val);
                    if (isNaN(num) || num <= 0)
                      return "Must be a positive integer";
                    return null;
                  }}
                  fieldName="tier2WLDiv"
                />
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    Current:{" "}
                    {tier2Threshold && tier2ThresholdDiv
                      ? `${(
                        (parseInt(tier2Threshold) /
                          parseInt(tier2ThresholdDiv)) *
                        100
                      ).toFixed(3)}%`
                      : "N/A"}{" "}
                    threshold,{" "}
                    {tier2WLCap && tier2WLDiv
                      ? `${(
                        (parseInt(tier2WLCap) / parseInt(tier2WLDiv)) *
                        100
                      ).toFixed(3)}%`
                      : "N/A"}{" "}
                    cap
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Configuration Summary
              </h5>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  • Tier 1 users need ≥
                  {tier1Threshold && tier1ThresholdDiv
                    ? `${(
                      (parseInt(tier1Threshold) /
                        parseInt(tier1ThresholdDiv)) *
                      100
                    ).toFixed(3)}%`
                    : "0"}{" "}
                  of SAFU supply
                </p>
                <p>
                  • Tier 2 users need ≥
                  {tier2Threshold && tier2ThresholdDiv
                    ? `${(
                      (parseInt(tier2Threshold) /
                        parseInt(tier2ThresholdDiv)) *
                      100
                    ).toFixed(3)}%`
                    : "0"}{" "}
                  of SAFU supply
                </p>
                <p>• Auto-whitelist requires minimum Tier 2 threshold</p>
              </div>
            </div>

            <ActionButton
              onClick={() =>
                writeContract({
                  address: SAFU_LAUNCHER_ADDRESSES_V1[networkInfo.chainId],

                  abi: LAUNCHER_ABI_V1.abi,
                  functionName: "setTierThreshold",
                  args: [
                    BigInt(parseInt(tier1Threshold)),
                    BigInt(parseInt(tier1ThresholdDiv)),
                    BigInt(parseInt(tier1WLCap)),
                    BigInt(parseInt(tier1WLDiv)),
                    BigInt(parseInt(tier2Threshold)),
                    BigInt(parseInt(tier2ThresholdDiv)),
                    BigInt(parseInt(tier2WLCap)),
                    BigInt(parseInt(tier2WLDiv)),
                  ],
                })
              }
              isValid={isTierConfigValid}
            >
              Update Tier Thresholds
            </ActionButton>
          </div>
        </FormSection>
      </div>

      {/* Global Validation Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Configuration Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div
            className={`flex items-center gap-2 ${isTradeFeeBpsValid
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isTradeFeeBpsValid ? "bg-green-500" : "bg-gray-300"
                }`}
            ></div>
            Trade Fee Config
          </div>
          <div
            className={`flex items-center gap-2 ${isPoolConfigValid
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isPoolConfigValid ? "bg-green-500" : "bg-gray-300"
                }`}
            ></div>
            Pool Config
          </div>
          <div
            className={`flex items-center gap-2 ${isListingFeeValid
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isListingFeeValid ? "bg-green-500" : "bg-gray-300"
                }`}
            ></div>
            Listing Fee Config
          </div>
          <div
            className={`flex items-center gap-2 ${isCreatorConfigValid
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isCreatorConfigValid ? "bg-green-500" : "bg-gray-300"
                }`}
            ></div>
            Creator Config
          </div>
          <div
            className={`flex items-center gap-2 ${isSafuTokenValid
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isSafuTokenValid ? "bg-green-500" : "bg-gray-300"
                }`}
            ></div>
            SAFU Token Config
          </div>
          <div
            className={`flex items-center gap-2 ${isTierConfigValid
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
              }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${isTierConfigValid ? "bg-green-500" : "bg-gray-300"
                }`}
            ></div>
            Tier Config
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContractConfig;
