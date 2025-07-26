/* eslint-disable @typescript-eslint/no-explicit-any */
// safu-dapp/src/web3/readContracts.ts
import { publicClient } from "../config/publicConfig";
import { LAUNCHER_ABI, PRICE_GETTER_ABI, SAFU_LAUNCHER_CA } from "./config";

/**
 * Description placeholder
 *
 * @type {*}
 */
export const pureMetrics = await publicClient.readContract({
  ...LAUNCHER_ABI,
  address: SAFU_LAUNCHER_CA as `0x${string}`,
  functionName: "getMetrics",
});

/**
 * Description placeholder
 *
 * @type {*}
 */
export const totalTokensListed = await publicClient.readContract({
  ...LAUNCHER_ABI,
  address: SAFU_LAUNCHER_CA as `0x${string}`,
  functionName: "totalTokensListed",
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
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
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
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
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
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: "getAmountOut",
    args: [tokenAddress, a, b],
  });
};
