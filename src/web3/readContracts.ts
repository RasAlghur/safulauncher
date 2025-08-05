// safulauncher/src/web3/readContracts.ts
import { getClientForChain } from "../config/publicConfig";
import {
  LAUNCHER_ABI_V2,
  LAUNCHER_ABI_V1,
  PRICE_GETTER_ABI,
  PRICE_GETTER_ADDRESSES,
  SAFU_LAUNCHER_ADDRESSES_V2,
  SAFU_LAUNCHER_ADDRESSES_V1,
} from "./config";

// Combined metrics functions
export const getPureMetrics = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);

  const [v1Metrics, v2Metrics] = await Promise.all([
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "getMetrics",
    }),
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "getMetrics",
    }),
  ]);

  return [
    v1Metrics[0] + v2Metrics[0], // _volumeETH
    v1Metrics[1] + v2Metrics[1], // _feesETH
    v1Metrics[2] + v2Metrics[2], // _tokensLaunched
    v1Metrics[3] + v2Metrics[3], // _tokensListed
    v1Metrics[4] + v2Metrics[4], // _taxedTokens
    v1Metrics[5] + v2Metrics[5], // _zeroTaxTokens
    v1Metrics[6] + v2Metrics[6], // _devRewardsEth
  ];
};

export const getPureUniqueTraderCount = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);

  const [v1Count, v2Count] = await Promise.all([
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "uniqueTraderCount",
    }),
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "uniqueTraderCount",
    }),
  ]);

  return v1Count + v2Count;
};

// Token listing functions
export const getTotalTokensListed = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);

  const [v1Listed, v2Listed] = await Promise.all([
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "totalTokensListed",
    }),
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "totalTokensListed",
    }),
  ]);

  return v1Listed + v2Listed;
};

export const getListingMilestone = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "listingMilestone",
  });
};

export const getBundleMaxAmount = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "bundleMaxAmount",
  });
};

// Token data functions
export const getPureInfoDataRaw = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
    abi: LAUNCHER_ABI_V2.abi,
    functionName: "data",
    args: [tokenAddress as `0x${string}`],
  });
};

export const getPureInfoV2DataRaw = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "data",
    args: [tokenAddress as `0x${string}`],
  });
};

// Price functions
export const getPureGetLatestETHPrice = async (
  chainId: number,
  priceFeed: string
) => {
  const publicClient = getClientForChain(chainId);
  return publicClient.readContract({
    address: PRICE_GETTER_ADDRESSES[chainId],
    abi: PRICE_GETTER_ABI.abi,
    functionName: "getLatestETHPrice",
    args: [priceFeed as `0x${string}`],
  });
};

export const getPureAmountOutMarketCap = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  try {
    return await publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap from V2:", error);
    return 0n;
  }
};

export const getPureV2AmountOutMarketCap = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  try {
    return await publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap from V1:", error);
    return 0n;
  }
};

export const getPureAmountOut = async (
  chainId: number,
  tokenAddress: string,
  amountIn: bigint,
  isBuy: boolean
) => {
  const publicClient = getClientForChain(chainId);
  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
    abi: LAUNCHER_ABI_V2.abi,
    functionName: "getAmountOut",
    args: [tokenAddress as `0x${string}`, amountIn, isBuy],
  });
};

export const getPureV2AmountOut = async (
  chainId: number,
  tokenAddress: string,
  amountIn: bigint,
  isBuy: boolean
) => {
  const publicClient = getClientForChain(chainId);
  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "getAmountOut",
    args: [tokenAddress as `0x${string}`, amountIn, isBuy],
  });
};
