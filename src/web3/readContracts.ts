// safulauncher/src/web3/readContracts.ts
import { getClientForChain } from "../config/publicConfig";
import {
  LAUNCHER_ABI_V2,
  LAUNCHER_ABI_V1,
  PRICE_GETTER_ABI,
  PRICE_GETTER_ADDRESSES,
  SAFU_LAUNCHER_ADDRESSES_V2,
  SAFU_LAUNCHER_ADDRESSES_V1,
  LAUNCHER_ABI_V3,
  SAFU_LAUNCHER_ADDRESSES_V3,
  SAFU_LAUNCHER_ADDRESSES_V4,
  LAUNCHER_ABI_V4,
} from "./config";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isZeroAddress(address: `0x${string}`) {
  return address === ZERO_ADDRESS;
}

// Combined metrics functions
export const getPureMetrics = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const v1Address = SAFU_LAUNCHER_ADDRESSES_V1[chainId];
  const v2Address = SAFU_LAUNCHER_ADDRESSES_V2[chainId];
  const v3Address = SAFU_LAUNCHER_ADDRESSES_V3[chainId];
  const v4Address = SAFU_LAUNCHER_ADDRESSES_V4[chainId];

  const [v1Metrics, v2Metrics, v3Metrics, v4Metrics] = await Promise.all([
    isZeroAddress(v1Address)
      ? [0n, 0n, 0n, 0n, 0n, 0n, 0n]
      : publicClient.readContract({
        address: v1Address,
        abi: LAUNCHER_ABI_V1.abi,
        functionName: "getMetrics",
      }),
    isZeroAddress(v2Address)
      ? [0n, 0n, 0n, 0n, 0n, 0n, 0n]
      : publicClient.readContract({
        address: v2Address,
        abi: LAUNCHER_ABI_V2.abi,
        functionName: "getMetrics",
      }),
    isZeroAddress(v3Address)
      ? [
        0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
        0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
        0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n
      ]
      : publicClient.readContract({
        address: v3Address,
        abi: LAUNCHER_ABI_V3.abi,
        functionName: "getMetrics",
      }),
    isZeroAddress(v4Address)
      ? [
        0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
        0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
        0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n
      ]
      : publicClient.readContract({
        address: v4Address,
        abi: LAUNCHER_ABI_V4.abi,
        functionName: "getMetrics",
      }),
  ]);

  return [
    v1Metrics[0] + v2Metrics[0] + v3Metrics[0] + v4Metrics[0], // _volumeETH
    v1Metrics[1] + v2Metrics[1] + v3Metrics[1] + v4Metrics[1], // _feesETH
    v1Metrics[2] + v2Metrics[2] + v3Metrics[2] + v4Metrics[2], // _tokensLaunched
    v1Metrics[3] + v2Metrics[3] + v3Metrics[3] + v4Metrics[3], // _tokensListed
    v1Metrics[4] + v2Metrics[4] + v3Metrics[4] + v4Metrics[4], // _taxedTokens
    v1Metrics[5] + v2Metrics[5] + v3Metrics[5] + v4Metrics[5], // _zeroTaxTokens
    v1Metrics[6] + v2Metrics[6] + v3Metrics[6] + v4Metrics[6], // _devRewardsEth
    v3Metrics[7] + v4Metrics[7],
    v3Metrics[8] + v4Metrics[8],
    v3Metrics[9] + v4Metrics[9],
    v3Metrics[10] + v4Metrics[10],
    v3Metrics[11] + v4Metrics[11],
    v3Metrics[12] + v4Metrics[12],
    v3Metrics[13] + v4Metrics[13],
    v3Metrics[14] + v4Metrics[14],
    v3Metrics[15] + v4Metrics[15],
    v3Metrics[16] + v4Metrics[16],
    v3Metrics[17] + v4Metrics[17],
    v3Metrics[18] + v4Metrics[18],
    v3Metrics[19] + v4Metrics[19],
    v3Metrics[20] + v4Metrics[20],
    v3Metrics[21] + v4Metrics[21],
    v3Metrics[22] + v4Metrics[22],
    v3Metrics[23] + v4Metrics[23]
  ];
};

export const getPureUniqueTraderCount = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const v1Address = SAFU_LAUNCHER_ADDRESSES_V1[chainId];
  const v2Address = SAFU_LAUNCHER_ADDRESSES_V2[chainId];

  const [v1Count, v2Count] = await Promise.all([
    isZeroAddress(v1Address)
      ? 0n
      : publicClient.readContract({
        address: v1Address,
        abi: LAUNCHER_ABI_V1.abi,
        functionName: "uniqueTraderCount",
      }),
    isZeroAddress(v2Address)
      ? 0n
      : publicClient.readContract({
        address: v2Address,
        abi: LAUNCHER_ABI_V2.abi,
        functionName: "uniqueTraderCount",
      }),

  ]);

  return v1Count + v2Count;
};

export const getListingMilestone = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V1[chainId];

  return isZeroAddress(address)
    ? 0n
    : publicClient.readContract({
      address,
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "listingMilestone",
    });
};

export const getV3Metrics = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const v3Address = SAFU_LAUNCHER_ADDRESSES_V3[chainId];

  return isZeroAddress(v3Address)
    ? [
      0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
      0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
      0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n
    ]
    : publicClient.readContract({
      address: v3Address,
      abi: LAUNCHER_ABI_V3.abi,
      functionName: "getMetrics",
    });

};

export const getV4Metrics = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const v4Address = SAFU_LAUNCHER_ADDRESSES_V4[chainId];

  return isZeroAddress(v4Address)
    ? [
      0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
      0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n,
      0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n
    ]
    : publicClient.readContract({
      address: v4Address,
      abi: LAUNCHER_ABI_V4.abi,
      functionName: "getMetrics",
    });

};

export const getBundleMaxAmount = async (chainId: number) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V1[chainId];

  return isZeroAddress(address) ? 0n :
    publicClient.readContract({
      address: address,
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "bundleMaxAmount",
    });
};

// Token data functions
export const getPureInfoV2DataRaw = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V2[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V2.abi,
    functionName: "data",
    args: [tokenAddress as `0x${string}`],
  });
};

export const getPureInfoV1DataRaw = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V1[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "data",
    args: [tokenAddress as `0x${string}`],
  });
};

export const getPureInfoV3DataRaw = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V3[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V3.abi,
    functionName: "data",
    args: [tokenAddress as `0x${string}`],
  });
};

export const getPureInfoV4DataRaw = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V4[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V4.abi,
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
  const address = PRICE_GETTER_ADDRESSES[chainId];
  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address,
    abi: PRICE_GETTER_ABI.abi,
    functionName: "getLatestETHPrice",
    args: [priceFeed as `0x${string}`],
  });
};

export const getPureAmountOutMarketCapV2 = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V2[chainId];

  if (isZeroAddress(address)) return 0n;

  try {
    return await publicClient.readContract({
      address: address,
      abi: LAUNCHER_ABI_V2.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap from V2:", error);
    return 0n;
  }
};

export const getPureAmountOutMarketCapV1 = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V1[chainId];

  if (isZeroAddress(address)) return 0n;

  try {
    return await publicClient.readContract({
      address: address,
      abi: LAUNCHER_ABI_V1.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap from V1:", error);
    return 0n;
  }
};

export const getPureAmountOutMarketCapV3 = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V3[chainId];

  if (isZeroAddress(address)) return 0n;

  try {
    return await publicClient.readContract({
      address: address,
      abi: LAUNCHER_ABI_V3.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap from V1:", error);
    return 0n;
  }
};

export const getPureAmountOutMarketCapV4 = async (
  chainId: number,
  tokenAddress: string
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V4[chainId];

  if (isZeroAddress(address)) return 0n;

  try {
    return await publicClient.readContract({
      address: address,
      abi: LAUNCHER_ABI_V4.abi,
      functionName: "getAmountOut",
      args: [tokenAddress as `0x${string}`, 1000000000000000000n, false],
    });
  } catch (error) {
    console.error("Error fetching market cap from V1:", error);
    return 0n;
  }
};

export const getPureAmountOutV2 = async (
  chainId: number,
  tokenAddress: string,
  amountIn: bigint,
  isBuy: boolean
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V2[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V2.abi,
    functionName: "getAmountOut",
    args: [tokenAddress as `0x${string}`, amountIn, isBuy],
  });
};

export const getPureAmountOutV3 = async (
  chainId: number,
  tokenAddress: string,
  amountIn: bigint,
  isBuy: boolean
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V3[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V3.abi,
    functionName: "getAmountOut",
    args: [tokenAddress as `0x${string}`, amountIn, isBuy],
  });
};

export const getPureAmountOutV4 = async (
  chainId: number,
  tokenAddress: string,
  amountIn: bigint,
  isBuy: boolean
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V4[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V4.abi,
    functionName: "getAmountOut",
    args: [tokenAddress as `0x${string}`, amountIn, isBuy],
  });
};

export const getPureAmountOutV1 = async (
  chainId: number,
  tokenAddress: string,
  amountIn: bigint,
  isBuy: boolean
) => {
  const publicClient = getClientForChain(chainId);
  const address = SAFU_LAUNCHER_ADDRESSES_V1[chainId];

  return isZeroAddress(address) ? 0n : publicClient.readContract({
    address: address,
    abi: LAUNCHER_ABI_V1.abi,
    functionName: "getAmountOut",
    args: [tokenAddress as `0x${string}`, amountIn, isBuy],
  });
};
