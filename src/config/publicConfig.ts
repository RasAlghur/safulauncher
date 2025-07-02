import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

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
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`),
});
