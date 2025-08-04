// Updated config.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import {
  mainnet,
  sepolia,
  polygon,
  optimism,
  arbitrum,
  base,
  bscTestnet,
} from "wagmi/chains";
import {
  metaMaskWallet,
  phantomWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID!;
const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY!;

// Define all supported chains
export const ALL_CHAINS = [mainnet, sepolia, polygon, optimism, arbitrum, base, bscTestnet];

export const config = getDefaultConfig({
  appName: "Abyss App",
  projectId,
  chains: [mainnet, sepolia, polygon, optimism, arbitrum, base, bscTestnet], // Support all chains
  ssr: true,
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [bscTestnet.id]: http(),
  },
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        injectedWallet,
        phantomWallet,
        metaMaskWallet,
        trustWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
});

// Environment detection
export const isDevEnvironment = import.meta.env.DEV;