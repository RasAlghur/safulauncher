// safulauncher/src/web3/readContracts.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClientForChain } from "../config/publicConfig";
import {
  LAUNCHER_ABI_V2,
  LAUNCHER_ABI_V1,
  PRICE_GETTER_ABI,
  PRICE_GETTER_ADDRESSES,
  SAFU_LAUNCHER_ADDRESSES_V2,
  SAFU_LAUNCHER_ADDRESSES_V1
} from "./config";

// Combined metrics functions
export const getPureMetrics = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const [v1, v2] = await Promise.all([
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "getMetrics",
    }),
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "getMetrics",
    })
  ]);

  return v1.map((val: bigint, idx: number) => val + (v2[idx] || 0n));
};

export const getPureUniqueTraderCount = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const [v1, v2] = await Promise.all([
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "uniqueTraderCount",
    }),
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "uniqueTraderCount",
    })
  ]);
  return v1 + v2;
};

// Token listing functions
export const getTotalTokensListed = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const [v1, v2] = await Promise.all([
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "totalTokensListed",
    }),
    publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "totalTokensListed",
    })
  ]);
  return v1 + v2;
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
export const getPureInfoDataRaw = async (chainId: number, tokenAddress: string) => {
  if (!tokenAddress) return;
  const publicClient = getClientForChain(chainId);

  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
    abi: LAUNCHER_ABI_V2.abi,
    functionName: "data",
    args: [tokenAddress as `0x${string}`],
  });
};

export const getPureInfoV2DataRaw = async (chainId: number, tokenAddress: string) => {
  if (!tokenAddress) return;
  const publicClient = getClientForChain(chainId);

  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "data",
    args: [tokenAddress as `0x${string}`],
  });
};

// Price functions
export const getPureGetLatestETHPrice = async (chainId: number, priceFeed: `0x${string}`) => {
  if (!priceFeed) return;
  const publicClient = getClientForChain(chainId);

  return publicClient.readContract({
    address: PRICE_GETTER_ADDRESSES[chainId],
    abi: PRICE_GETTER_ABI.abi,
    functionName: "getLatestETHPrice",
    args: [priceFeed],
  });
};

export const getPureAmountOutMarketCap = async (chainId: number, tokenAddress: string) => {
  if (!tokenAddress) return;
  const publicClient = getClientForChain(chainId);

  try {
    return await publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap:", error);
    return 0n;
  }
};

export const getPureV2AmountOutMarketCap = async (chainId: number, tokenAddress: string) => {
  if (!tokenAddress) return;
  const publicClient = getClientForChain(chainId);

  try {
    return await publicClient.readContract({
      address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap:", error);
    return 0n;
  }
};

export const getPureAmountOut = async (
  chainId: number,
  tokenAddress: `0x${string}`,
  amountIn: bigint,
  isBuy: boolean
) => {
  if (!tokenAddress) return;
  const publicClient = getClientForChain(chainId);

  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V2[chainId],
    abi: LAUNCHER_ABI_V2.abi,
    functionName: "getAmountOut",
    args: [tokenAddress, amountIn, isBuy],
  });
};

export const getPureV2AmountOut = async (
  chainId: number,
  tokenAddress: `0x${string}`,
  amountIn: bigint,
  isBuy: boolean
) => {
  if (!tokenAddress) return;
  const publicClient = getClientForChain(chainId);

  return publicClient.readContract({
    address: SAFU_LAUNCHER_ADDRESSES_V1[chainId],
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "getAmountOut",
    args: [tokenAddress, amountIn, isBuy],
  });
};