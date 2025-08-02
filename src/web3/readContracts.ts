/* eslint-disable @typescript-eslint/no-explicit-any */
// safu-dapp/src/web3/readContracts.ts
import { publicClient } from "../config/publicConfig";
import {
  LAUNCHER_ABI_V1,
  LAUNCHER_ABI_V2,
  PRICE_GETTER_ABI,
  SAFU_LAUNCHER_CA_V1,
  SAFU_LAUNCHER_CA_V2,
} from "./config";

/**
 * Description placeholder
 *
 * @type {*}
 */
export const pureMetrics = await publicClient.readContract({
  ...LAUNCHER_ABI_V1,
  address: SAFU_LAUNCHER_CA_V1 as `0x${string}`,
  functionName: "getMetrics",
});

export const pureV2Metrics = await publicClient.readContract({
  ...LAUNCHER_ABI_V2,
  address: SAFU_LAUNCHER_CA_V2 as `0x${string}`,
  functionName: "getMetrics",
});

// Explicitly type as bigint[]
export const pureCombinedMetrics: bigint[] = pureMetrics.map(
  (val, idx) => val + (pureV2Metrics[idx] || 0n)
);

export const pureUniqueTraderCount = (await publicClient.readContract({
  ...LAUNCHER_ABI_V1,
  address: SAFU_LAUNCHER_CA_V1 as `0x${string}`,
  functionName: "uniqueTraderCount",
})) as bigint;

export const pureV2UniqueTraderCount = (await publicClient.readContract({
  ...LAUNCHER_ABI_V2,
  address: SAFU_LAUNCHER_CA_V2 as `0x${string}`,
  functionName: "uniqueTraderCount",
})) as bigint;

// Now just sum the two bigints:
export const pureCombinedUniqueTraderCount: bigint =
  pureUniqueTraderCount + pureV2UniqueTraderCount;

/**
 * Description placeholder
 *
 * @type {*}
 */
export const totalTokensListed = await publicClient.readContract({
  ...LAUNCHER_ABI_V1,
  address: SAFU_LAUNCHER_CA_V1 as `0x${string}`,
  functionName: "totalTokensListed",
});

export const totalV2TokensListed = await publicClient.readContract({
  ...LAUNCHER_ABI_V2,
  address: SAFU_LAUNCHER_CA_V2 as `0x${string}`,
  functionName: "totalTokensListed",
});

export const listingMilestone = await publicClient.readContract({
  ...LAUNCHER_ABI_V2,
  address: SAFU_LAUNCHER_CA_V2 as `0x${string}`,
  functionName: "listingMilestone",
});

export const bundleMaxAmount = await publicClient.readContract({
  ...LAUNCHER_ABI_V2,
  address: SAFU_LAUNCHER_CA_V2 as `0x${string}`,
  functionName: "bundleMaxAmount",
});

/**
 * Description placeholder
 *
 * @async
 * @param {*} tokenAddress
 * @returns {unknown}
 */
export const pureInfoDataRaw = async (tokenAddress: any) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI_V1,
    address: SAFU_LAUNCHER_CA_V1,
    functionName: "data",
    args: [tokenAddress],
  });
};

export const pureInfoV2DataRaw = async (tokenAddress: any) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI_V2,
    address: SAFU_LAUNCHER_CA_V2,
    functionName: "data",
    args: [tokenAddress],
  });
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} priceFeed
 * @returns {unknown}
 */
export const pureGetLatestETHPrice = async (priceFeed: any) => {
  if (!priceFeed) return;

  return await publicClient.readContract({
    ...PRICE_GETTER_ABI,
    functionName: "getLatestETHPrice",
    args: [priceFeed],
  });
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} tokenAddress
 * @returns {unknown}
 */
export const pureAmountOutMarketCap = async (tokenAddress: any) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI_V1,
    address: SAFU_LAUNCHER_CA_V1,
    functionName: "getAmountOut",
    args: [tokenAddress, 1000000000000000000n, false],
  });
};

export const pureV2AmountOutMarketCap = async (tokenAddress: any) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI_V2,
    address: SAFU_LAUNCHER_CA_V2,
    functionName: "getAmountOut",
    args: [tokenAddress, 1000000000000000000n, false],
  });
};

/**
 * Description placeholder
 *
 * @async
 * @param {*} tokenAddress
 * @param {bigint} a
 * @param {boolean} b
 * @returns {unknown}
 */
export const pureAmountOut = async (
  tokenAddress: any,
  a: bigint,
  b: boolean
) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI_V1,
    address: SAFU_LAUNCHER_CA_V1,
    functionName: "getAmountOut",
    args: [tokenAddress, a, b],
  });
};

export const pureV2AmountOut = async (
  tokenAddress: any,
  a: bigint,
  b: boolean
) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI_V2,
    address: SAFU_LAUNCHER_CA_V2,
    functionName: "getAmountOut",
    args: [tokenAddress, a, b],
  });
};
