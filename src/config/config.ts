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
import { metaMaskWallet, phantomWallet, rainbowWallet, trustWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID!;
const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY!;

export const config = getDefaultConfig({
  appName: "Abyss App",
  projectId,
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    sepolia,
    bscTestnet,
  ],
  ssr: true,
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [bscTestnet.id]: http(),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`),
  },
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        phantomWallet,
        metaMaskWallet,
        trustWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
});
