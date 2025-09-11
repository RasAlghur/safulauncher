import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  type BaseError,
  useBalance,
} from "wagmi";
import { WITHDRAW_ABI, WITHDRAW_ADDRESS } from "../../web3/config";
import { memo, useState } from "react";
import { Info, AlertTriangle, CheckCircle, Trash2, Plus } from "lucide-react";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";

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

const InputField = memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    tooltip,
    validator,
    fieldName,
    unit,
    validationErrors,
    handleValidation,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    tooltip?: string;
    validator?: (val: string) => string | null;
    fieldName?: string;
    unit?: string;
    validationErrors: { [key: string]: string };
    handleValidation: (
      fieldName: string,
      value: string,
      validator: (val: string) => string | null
    ) => boolean;
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
                           ${
                             hasError
                               ? "border-red-500 dark:border-red-400"
                               : "border-gray-300 dark:border-gray-600"
                           }`}
          />
          {unit && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
              {unit}
            </div>
          )}
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
  }
);

interface Recipient {
  address: string;
  percentage: number;
}

const AdminWithdrawConfig = () => {
  const networkInfo = useNetworkEnvironment();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // State for form inputs
  const [singleRecipient, setSingleRecipient] = useState<string>("");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: "", percentage: 0 },
  ]);
  const [newOwner, setNewOwner] = useState<string>("");
  
  // ERC20 emergency withdrawal
  const [erc20TokenAddress, setErc20TokenAddress] = useState<string>("");
  const [erc20Recipient, setErc20Recipient] = useState<string>("");
  const [erc20Amount, setErc20Amount] = useState<string>("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Get contract balance
  const { data: contractBalance } = useBalance({
    address: WITHDRAW_ADDRESS[networkInfo.chainId],
  });

  // Get current owner
  const { data: currentOwner } = useReadContract({
    address: WITHDRAW_ADDRESS[networkInfo.chainId],
    abi: WITHDRAW_ABI.abi,
    functionName: "owner",
  });

  // Validation functions
  const validateAddress = (value: string): string | null => {
    if (!value) return "Address is required";
    if (!/^0x[a-fA-F0-9]{40}$/.test(value))
      return "Invalid Ethereum address format";
    return null;
  };

  const validateERC20Amount = (value: string): string | null => {
    if (!value) return "Amount is required";
    const num = parseFloat(value);
    if (isNaN(num)) return "Must be a valid number";
    if (num <= 0) return "Must be greater than 0";
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

  const addRecipient = () => {
    setRecipients([...recipients, { address: "", percentage: 0 }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string | number) => {
    const updated = recipients.map((recipient, i) =>
      i === index ? { ...recipient, [field]: value } : recipient
    );
    setRecipients(updated);
  };

  const getTotalPercentage = () => {
    return recipients.reduce((sum, recipient) => sum + (recipient.percentage || 0), 0);
  };

  const isPercentageDistributionValid = () => {
    const totalPercentage = getTotalPercentage();
    const allAddressesValid = recipients.every(
      (r) => r.address && /^0x[a-fA-F0-9]{40}$/.test(r.address)
    );
    const allPercentagesValid = recipients.every(
      (r) => r.percentage > 0 && r.percentage <= 100
    );
    return totalPercentage === 100 && allAddressesValid && allPercentagesValid;
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

  return (
    <div className="p-4 max-w-6xl mx-auto mt-8 space-y-6">
      <div className="text-center mb-8 text-gray-800 dark:text-white">
        <h1 className="lg:text-3xl text-xl font-bold mb-2">
          SWithdraw Admin Panel
        </h1>
        <h2 className="text-sm sm:text-base font-mono">
          {WITHDRAW_ADDRESS[networkInfo.chainId]}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage ETH withdrawals and emergency functions
        </p>
      </div>

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

      {/* Contract Status */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Contract Balance
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {contractBalance ? contractBalance.formatted : "0"} ETH
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-700 dark:text-green-300">
              Owner: {currentOwner ? `${currentOwner.toString().slice(0, 6)}...${currentOwner.toString().slice(-4)}` : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simple Withdraw All */}
        <FormSection
          title="💰 Withdraw All Fees"
          tooltip="Withdraw all ETH from the contract to a single address"
        >
          <div className="space-y-4">
            <InputField
              label="Recipient Address"
              value={singleRecipient}
              onChange={setSingleRecipient}
              placeholder="0x..."
              tooltip="Address to receive all ETH"
              validator={validateAddress}
              fieldName="singleRecipient"
              validationErrors={validationErrors}
              handleValidation={handleValidation}
            />

            <ActionButton
              onClick={() =>
                writeContract({
                  address: WITHDRAW_ADDRESS[networkInfo.chainId],
                  abi: WITHDRAW_ABI.abi,
                  functionName: "withdrawAccumulatedFees",
                  args: [singleRecipient as `0x${string}`],
                })
              }
              isValid={!validationErrors.singleRecipient && !!singleRecipient}
            >
              Withdraw All ETH
            </ActionButton>
          </div>
        </FormSection>

        {/* Percentage-based Withdrawal */}
        <FormSection
          title="📊 Percentage Withdrawal"
          tooltip="Distribute ETH to multiple recipients by percentage"
        >
          <div className="space-y-4">
            {recipients.map((recipient, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recipient {index + 1}
                  </span>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={recipient.address}
                      onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={recipient.percentage || ''}
                      onChange={(e) => updateRecipient(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="Percentage"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-between">
              <button
                onClick={addRecipient}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <Plus className="w-4 h-4" />
                Add Recipient
              </button>
              
              <div className="text-sm">
                Total: <span className={`font-bold ${getTotalPercentage() === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {getTotalPercentage()}%
                </span>
              </div>
            </div>

            <ActionButton
              onClick={() => {
                const addresses = recipients.map(r => r.address as `0x${string}`);
                const percentages = recipients.map(r => BigInt(r.percentage));
                
                writeContract({
                  address: WITHDRAW_ADDRESS[networkInfo.chainId],
                  abi: WITHDRAW_ABI.abi,
                  functionName: "withdrawEtherInPercent",
                  args: [addresses, percentages],
                });
              }}
              isValid={isPercentageDistributionValid()}
            >
              Withdraw by Percentage
            </ActionButton>
          </div>
        </FormSection>

        {/* Emergency ERC20 Withdrawal */}
        <FormSection
          title="🚨 Emergency ERC20 Withdrawal"
          tooltip="Emergency function to withdraw stuck ERC20 tokens"
        >
          <div className="space-y-4">
            <InputField
              label="Token Contract Address"
              value={erc20TokenAddress}
              onChange={setErc20TokenAddress}
              placeholder="0x..."
              tooltip="Address of the ERC20 token contract"
              validator={validateAddress}
              fieldName="erc20TokenAddress"
              validationErrors={validationErrors}
              handleValidation={handleValidation}
            />

            <InputField
              label="Recipient Address"
              value={erc20Recipient}
              onChange={setErc20Recipient}
              placeholder="0x..."
              tooltip="Address to receive the tokens"
              validator={validateAddress}
              fieldName="erc20Recipient"
              validationErrors={validationErrors}
              handleValidation={handleValidation}
            />

            <InputField
              label="Amount"
              value={erc20Amount}
              onChange={setErc20Amount}
              placeholder="Amount to withdraw"
              tooltip="Amount of tokens to withdraw (in token's smallest unit)"
              validator={validateERC20Amount}
              fieldName="erc20Amount"
              validationErrors={validationErrors}
              handleValidation={handleValidation}
            />

            <ActionButton
              onClick={() =>
                writeContract({
                  address: WITHDRAW_ADDRESS[networkInfo.chainId],
                  abi: WITHDRAW_ABI.abi,
                  functionName: "emergencyWithdrawERC20",
                  args: [
                    erc20TokenAddress as `0x${string}`,
                    erc20Recipient as `0x${string}`,
                    BigInt(erc20Amount || "0"),
                  ],
                })
              }
              isValid={
                !validationErrors.erc20TokenAddress &&
                !validationErrors.erc20Recipient &&
                !validationErrors.erc20Amount &&
                !!erc20TokenAddress &&
                !!erc20Recipient &&
                !!erc20Amount
              }
              variant="danger"
            >
              Emergency Withdraw ERC20
            </ActionButton>
          </div>
        </FormSection>

        {/* Ownership Transfer */}
        <FormSection
          title="👑 Ownership Transfer"
          tooltip="Transfer contract ownership to a new address"
        >
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Owner
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 font-mono text-sm break-all">
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
              validationErrors={validationErrors}
              handleValidation={handleValidation}
            />

            <ActionButton
              onClick={() =>
                writeContract({
                  address: WITHDRAW_ADDRESS[networkInfo.chainId],
                  abi: WITHDRAW_ABI.abi,
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
      </div>
    </div>
  );
};

export default AdminWithdrawConfig;