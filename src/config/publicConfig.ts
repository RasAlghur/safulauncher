// publicConfig.ts
import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet, sepolia }          from "viem/chains";

const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY as string;
const isDev      = import.meta.env.DEV as boolean;

// tell TS: "clients maps any numeric chain.id → PublicClient"
export const clients: Record<number, PublicClient> = {
  [mainnet.id]: createPublicClient({
    chain:     mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
  }),
  [sepolia.id]: createPublicClient({
    chain:     sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`),
  }),
};

// now indexing by any `number` is valid
export function getClientForChain(chainId: number): PublicClient {
  // fallback to sepolia in dev, mainnet otherwise
  const fallback = isDev ? sepolia.id : mainnet.id;
  return clients[chainId] ?? clients[fallback];
}

// optionally expose the “default”
export const publicClient = getClientForChain(isDev ? sepolia.id : mainnet.id);
