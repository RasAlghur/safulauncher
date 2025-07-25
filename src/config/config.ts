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

// Access environment variables with Vite's import.meta.env
/**
 * Description placeholder
 *
 * @type {*}
 */
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;
/**
 * Description placeholder
 *
 * @type {*}
 */
const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;

/**
 * Description placeholder
 *
 * @type {*}
 */
export const config = getDefaultConfig({
  appName: "Abyss App",
  projectId: projectId,
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia, bscTestnet],
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
});
