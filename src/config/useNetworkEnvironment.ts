// Updated useNetworkEnvironment hook
import { useChainId } from "wagmi";
import { ALL_CHAINS } from "./config";
import { useMemo } from "react";

export const useNetworkEnvironment = () => {
  const chainId = useChainId();

  return useMemo(() => {
    const chain = ALL_CHAINS.find(c => c.id === chainId) || ALL_CHAINS[0];
    const isTestnet = chain.testnet;

    // Ensure URLs end with a trailing slash
    const testnetUrl = import.meta.env.VITE_TESTNET_API_BASE_URL.endsWith('/')
      ? import.meta.env.VITE_TESTNET_API_BASE_URL
      : import.meta.env.VITE_TESTNET_API_BASE_URL + '/';

    const mainnetUrl = import.meta.env.VITE_MAINNET_API_BASE_URL.endsWith('/')
      ? import.meta.env.VITE_MAINNET_API_BASE_URL
      : import.meta.env.VITE_MAINNET_API_BASE_URL + '/';

      const testnetCA = '0x{testnet}';
      const mainnetCA = '0x{mainnet}';


    return {
      chainId,
      chainName: chain.name,
      environmentMatch: true, // Always match now
      currentChain: chain,
      apiBaseUrl: isTestnet ? testnetUrl : mainnetUrl,
      explorerUrl: chain.blockExplorers?.default?.url || "",
      safuContract: isTestnet ? testnetCA : mainnetCA,
    };
  }, [chainId]);
};