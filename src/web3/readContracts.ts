import { publicClient } from "../config/publicConfig";
import { LAUNCHER_ABI, SAFU_LAUNCHER_CA } from "./config";

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
