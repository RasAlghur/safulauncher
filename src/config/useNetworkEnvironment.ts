// Updated useNetworkEnvironment hook
import { useAccount, useChainId } from "wagmi";
import { ALL_CHAINS } from "./config";
import { useMemo } from "react";

// Precompute default chain IDs
const DEFAULT_MAINNET_CHAIN_ID = 1;
const DEFAULT_TESTNET_CHAIN_ID = 11155111;

export const useNetworkEnvironment = () => {
  const { isConnected } = useAccount();
  const wagmiChainId = useChainId();
  const isClient = typeof window !== "undefined";
  
  // Determine effective chain ID
  const effectiveChainId = useMemo(() => {
    if (isConnected) return wagmiChainId;
    
    if (!isClient) return DEFAULT_TESTNET_CHAIN_ID;
    
    const hostname = window.location.hostname;
    if (hostname === "app.safulauncher.com") {
      return DEFAULT_MAINNET_CHAIN_ID;
    }
    
    if (hostname === "safulauncher.com") {
      return DEFAULT_MAINNET_CHAIN_ID;
    }
    
    // Default to testnet for dev/localhost
    return DEFAULT_TESTNET_CHAIN_ID;
  }, [isConnected, wagmiChainId, isClient]);

  return useMemo(() => {
    const chain = ALL_CHAINS.find(c => c.id === effectiveChainId) || ALL_CHAINS[0];
    const isTestnet = chain.testnet;

    // Ensure URLs end with a trailing slash
    const testnetUrl = import.meta.env.VITE_TESTNET_API_BASE_URL;

    const mainnetUrl = import.meta.env.VITE_MAINNET_API_BASE_URL;

    const testnetCA = '0xF2aE04bC24ee9fa6f2ea3a2b5f7845809234BC01';
    const mainnetCA = '0x8899EE4869eA410970eDa6b9D5a4a8Cee1148b87';

    return {
      chainId: effectiveChainId,
      chainName: chain.name,
      environmentMatch: true,
      currentChain: chain,
      apiBaseUrl: isTestnet ? testnetUrl : mainnetUrl,
      explorerUrl: chain.blockExplorers?.default?.url || "",
      safuContract: isTestnet ? testnetCA : mainnetCA,
    };
  }, [effectiveChainId]);
};