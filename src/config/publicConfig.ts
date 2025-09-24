// publicConfig.ts
import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet, sepolia, bscTestnet, bsc } from "viem/chains";

const alchemyKey = import.meta.env.VITE_RPC_API_KEY as string;
const Sepolia_AlchemyKey = import.meta.env.VITE_SEPOLIA_RPC_API_KEY as string;
const bsc_AlchemyKey = import.meta.env.VITE_BSC_RPC_API_KEY!;
const bscTestnet_AlchemyKey = import.meta.env.VITE_BSC_TESTNET_RPC_API_KEY! || import.meta.env.VITE_BSC_TESTNET_RPC_API_KEY2!; 
const isDev = import.meta.env.DEV as boolean;

// Configure clients for all supported chains
export const clients: Record<number, PublicClient> = {
  [mainnet.id]: createPublicClient({
    chain: mainnet,
    transport: http(alchemyKey),
  }),
  [sepolia.id]: createPublicClient({
    chain: sepolia,
    transport: http(Sepolia_AlchemyKey),
  }),
  [bsc.id]: createPublicClient({
    chain: bsc,
    transport: http(bsc_AlchemyKey),
  }),
  [bscTestnet.id]: createPublicClient({
    chain: bscTestnet,
    transport: http(bscTestnet_AlchemyKey),
  }),
};

// Get client for specific chain with proper fallback logic
export function getClientForChain(chainId: number): PublicClient {
  console.log("Requested chainId:", chainId);
  
  // Check if we have a client for the requested chain
  if (clients[chainId]) {
    console.log("Using client for chain:", chainId);
    return clients[chainId];
  }
  
  // Determine appropriate fallback based on environment and chain type
  let fallbackChainId: number;
  
  if (isDev) {
    // In development, prefer testnets
    if (chainId === 56 || chainId === 1) { // If mainnet was requested but not available
      fallbackChainId = chainId === 56 ? bscTestnet.id : sepolia.id;
    } else {
      // Default dev fallback
      fallbackChainId = sepolia.id; // or bscTestnet.id based on your preference
    }
  } else {
    // In production, prefer mainnets
    if (chainId === 97 || chainId === 11155111) { // If testnet was requested but not available
      fallbackChainId = chainId === 97 ? bsc.id : mainnet.id;
    } else {
      // Default production fallback
      fallbackChainId = mainnet.id; // or bsc.id based on your preference
    }
  }
  
  console.log("Falling back to chain:", fallbackChainId);
  
  const fallbackClient = clients[fallbackChainId];
  if (!fallbackClient) {
    throw new Error(`No client configured for chain ${chainId} and fallback chain ${fallbackChainId} is also not available`);
  }
  
  return fallbackClient;
}

// Default client - choose based on your primary chain
export const publicClient = getClientForChain(isDev ? sepolia.id : mainnet.id);