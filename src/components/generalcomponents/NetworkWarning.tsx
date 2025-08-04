// components/NetworkWarning.tsx
import React from "react";
import { useSwitchChain } from "wagmi";
import { useNetworkEnvironment } from "../../config/useNetworkEnvironment";
import { sepolia, mainnet } from "wagmi/chains";

export const NetworkWarning: React.FC = () => {
  const { switchChain } = useSwitchChain();
  const {
    shouldSuggestNetworkSwitch,
    isDevelopment,
    expectedNetworkType,
    chainId,
  } = useNetworkEnvironment();

  if (!shouldSuggestNetworkSwitch) return null;

  const handleSwitchNetwork = () => {
    if (isDevelopment) {
      // Switch to testnet (Sepolia)
      switchChain({ chainId: sepolia.id });
    } else {
      // Switch to mainnet
      switchChain({ chainId: mainnet.id });
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Network Environment Mismatch
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              You're running in {isDevelopment ? "development" : "production"} mode
              but connected to a {expectedNetworkType === "mainnet" ? "testnet" : "mainnet"} chain.
              Consider switching to a {expectedNetworkType} network for the best experience.
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSwitchNetwork}
              className="bg-yellow-100 px-3 py-2 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Switch to {expectedNetworkType}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};