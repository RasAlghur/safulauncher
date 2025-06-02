import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'


const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`)
})