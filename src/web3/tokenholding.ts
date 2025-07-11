// src/web3/tokenholding.ts

import { Alchemy, Network } from 'alchemy-sdk';

export const AlchemyTokenDiscovery = {
    async getAllTokenBalances(address: string, chainId = 11155111) {
        const networkMap: Record<number, Network> = {
            1: Network.ETH_MAINNET,
            11155111: Network.ETH_SEPOLIA,
        };

        const config = {
            apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || "",
            network: networkMap[chainId] || Network.ETH_MAINNET,
        };

        const alchemy = new Alchemy(config);

        try {
            // Get all token balances (returns tokens with non-zero balances)
            const balances = await alchemy.core.getTokenBalances(address);

            // Filter out zero balances and get metadata
            const nonZeroBalances = balances.tokenBalances.filter(
                token => token.tokenBalance !== '0x0' && token.tokenBalance !== '0x'
            );

            // Get metadata for each token
            const tokenDetails = await Promise.all(
                nonZeroBalances.map(async (token) => {
                    try {
                        const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
                        const balance = parseInt(token.tokenBalance ?? '0x0', 16);
                        const decimals = metadata.decimals || 18;
                        const formattedBalance = balance / Math.pow(10, decimals);

                        return {
                            contractAddress: token.contractAddress,
                            symbol: metadata.symbol || 'UNKNOWN',
                            name: metadata.name || 'Unknown Token',
                            decimals,
                            balance: formattedBalance,
                            formattedBalance: formattedBalance.toFixed(4),
                            rawBalance: token.tokenBalance,
                            logo: metadata.logo,
                        };
                    } catch (error) {
                        console.error(`Error fetching metadata for ${token.contractAddress}:`, error);
                        return null;
                    }
                })
            );

            // Filter out failed metadata requests
            return tokenDetails.filter(token => token !== null);
        } catch (error) {
            console.error('Alchemy API error:', error);
            return [];
        }
    },
};
