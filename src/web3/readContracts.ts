// safu-dapp/src/web3/readContracts.ts
import { publicClient } from "../config/publicConfig";
import { LAUNCHER_ABI, PRICE_GETTER_ABI, SAFU_LAUNCHER_CA } from "./config";

export const pureMetrics = await publicClient.readContract(
  {
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA as `0x${string}`,
    functionName: 'getMetrics',
  }
);

export const pureInfoDataRaw = async (tokenAddress: any) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: 'data',
    args: [tokenAddress],
  });
};

export const pureGetLatestETHPrice = async (priceFeed: any) => {
  if (!priceFeed) return;

  return await publicClient.readContract({
    ...PRICE_GETTER_ABI,
    functionName: "getLatestETHPrice",
    args: [priceFeed],
  });
};

export const pureAmountOutMarketCap = async (tokenAddress: any) => {
  if (!tokenAddress) return;
  return await publicClient.readContract({
    ...LAUNCHER_ABI,
    address: SAFU_LAUNCHER_CA,
    functionName: 'getAmountOut',
    args: [
      tokenAddress,
      1000000000000000000n,
      false
    ],
  });
}