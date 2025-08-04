
export const SAFU_LAUNCHER_ADDRESSES_V2: Record<number, `0x${string}`> = {
  1: "0x0", // Mainnet address
  11155111: "0x2321F6a4214f473348C177F9D402bf31789c32C7", // Sepolia address
};

export const SAFU_LAUNCHER_ADDRESSES_V1: Record<number, `0x${string}`> = {
  1: "0x8899EE4869eA410970eDa6b9D5a4a8Cee1148b87", // Mainnet address
  11155111: "0xF2aE04bC24ee9fa6f2ea3a2b5f7845809234BC01", // Sepolia address
};

export const PRICE_GETTER_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0x4603276A9A90382A1aD8Af9aE56133b905bF8AAf", // Mainnet address
  11155111: "0x7dACcc56CB9d797A234F84a8B62C95F5c3d7433e", // Sepolia address
};

export const ETH_USDT_PRICE_FEED_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // Mainnet address
  11155111: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // Sepolia address
};

export const SAFU_TOKEN_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0x{mainnet}", // Mainnet address
  11155111: "0x4BEdac867d705d9225293c6eba1Fc2d98Fa70DD8", // Sepolia address
};

/**
 * Description placeholder
 *
 * @type {11155111}
 */
export const testChainID = 11155111;
/**
 * Description placeholder
 *
 * @type {1}
 */
export const mainnetID = 1;

/**
 * Description placeholder
 *
 * @type {{ readonly address: "0x31ea5493a157dfFa0f440335abc12855101286c4"; readonly abi: readonly [{ readonly type: "constructor"; readonly inputs: readonly [{ readonly name: "router_"; readonly type: "address"; readonly internalType: "address"; }, ... 6 more ..., { ...; }]; readonly stateMutability: "nonpayable"; }, ... 53 ...}
 */

export const LAUNCHER_ABI_V2 = {
  abi: [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "router_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "locker_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "weth_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "create2factory_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "n_owner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_safuToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_tokenPriceGetterAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "priceFeed",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "receive",
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "WETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "_uniV2Factory",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "_uniV2Router",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "addToWhitelist",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "list",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "capsBps",
          "type": "uint16[]",
          "internalType": "uint16[]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "bundleMaxAmount",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "buy",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "create2Factory",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "createToken",
      "inputs": [
        {
          "name": "name",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "symbol",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "supply",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "lockLp",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "startNow",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isMaxWalletOnSafu_",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "maxWalletAmountOnSafu_",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "bundleAddrs",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "bundleShares",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "taxOnDexBps_",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "taxOnDexRecipients",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "taxOnDexPercents",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "taxOnSafuBps_",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "taxOnSafuRecipients_",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "taxOnSafuPercents_",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "whitelistOnly_",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "initialWhitelist",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "initialCapsBps",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "myIndex",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "_tokenAddr",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_tokenCreator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "data",
      "inputs": [
        {
          "name": "_tokenAddr",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "tradingStarted",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "listed",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "whitelistOnly",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "lockLP",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "wlCount",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "totalSupply",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "ethRaised",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "tokensSold",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "virtualEthReserve",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "virtualTokenReserve",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "k",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "feeCollected",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "taxOnSafuBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "taxOnDexBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "isBundled",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isTaxedOnDex",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isTaxedOnSafu",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isMaxWalletOnSafu",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "maxWalletAmountOnSafu",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "devRewardETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "disableMaxWalletLimit",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "disableWhitelist",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getAmountOut",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "isBuy",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getMetrics",
      "inputs": [],
      "outputs": [
        {
          "name": "_volumeETH",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_feesETH",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_tokensLaunched",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_tokensListed",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_taxedTokens",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_zeroTaxTokens",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_devRewardsEth",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRemainingWhitelistBalance",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "hasTraded",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "initialPoolEth",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isSafuTokenAutoWL",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listingFeeBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listingFeeDiv",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listingMilestone",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "locker",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "maxWhitelistBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "reservedEth",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "safuToken",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "sell",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amt",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setTierThreshold",
      "inputs": [
        {
          "name": "_tier1Threshold",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier1ThresholdDiv",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier1WLCap",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier1WLDiv",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2Threshold",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2ThresholdDiv",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2WLCap",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2WLDiv",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setTradeFeeBps",
      "inputs": [
        {
          "name": "_newBps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "startTrading",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "taxOnDexMaxBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "taxOnSafuMaxBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier1Threshold",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier1WLCap",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier2Threshold",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier2WLCap",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalDevRewardEth",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalFeesETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalTaxedTokens",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalTokensLaunched",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalTokensListed",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalVolumeETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalZeroTaxTokens",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tradeFeeBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "uniqueTraderCount",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "updateCreatorConfigs",
      "inputs": [
        {
          "name": "_taxOnSafuMaxBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_taxOnDexMaxBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_bundleMaxAmount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_listingMilestone",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_maxWhitelistBps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateListingFee",
      "inputs": [
        {
          "name": "_newBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_newDiv",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updatePoolConfigs",
      "inputs": [
        {
          "name": "_newPoolETH",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_newDevRewardETH",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateSafuTokenCA",
      "inputs": [
        {
          "name": "_s",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "whitelist",
      "inputs": [
        {
          "name": "_tokenAddr",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_eoa",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "whitelistAllocationLeft",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "whitelistMaxWallet",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "withdrawStuckETH",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "Listed",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "pair",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "TokenDeployed",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "myIndex",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Trade",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "buy",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        },
        {
          "name": "inAmt",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "outAmt",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "DisAllowed",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ETHTF",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ExceedsL",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ExceedsM",
      "inputs": []
    },
    {
      "type": "error",
      "name": "FeeTF",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidB",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotAutoWL",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotCreator",
      "inputs": []
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ReentrancyGuardReentrantCall",
      "inputs": []
    },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ShareM",
      "inputs": []
    },
    {
      "type": "error",
      "name": "TaxCF",
      "inputs": []
    },
    {
      "type": "error",
      "name": "TokenIL",
      "inputs": []
    },
    {
      "type": "error",
      "name": "TradingNL",
      "inputs": []
    }
  ],
} as const;

export const LAUNCHER_ABI_V1 = {
  abi: [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "router_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "locker_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "weth_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "create2factory_",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "n_owner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_safuToken",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_tokenPriceGetterAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "priceFeed",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "receive",
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "WETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "_uniV2Factory",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "_uniV2Router",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "addToWhitelist",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "list",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "capsBps",
          "type": "uint16[]",
          "internalType": "uint16[]"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "bundleMaxAmount",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "buy",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "create2Factory",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "createToken",
      "inputs": [
        {
          "name": "name",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "symbol",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "supply",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "lockLp",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "startNow",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isMaxWalletOnSafu_",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "maxWalletAmountOnSafu_",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "bundleAddrs",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "bundleShares",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "taxOnDexBps_",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "taxOnDexRecipients",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "taxOnDexPercents",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "taxOnSafuBps_",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "taxOnSafuRecipients_",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "taxOnSafuPercents_",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "whitelistOnly_",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "initialWhitelist",
          "type": "address[]",
          "internalType": "address[]"
        },
        {
          "name": "initialCapsBps",
          "type": "uint16[]",
          "internalType": "uint16[]"
        },
        {
          "name": "myIndex",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "_tokenAddr",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_tokenCreator",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "payable"
    },
    {
      "type": "function",
      "name": "data",
      "inputs": [
        {
          "name": "_tokenAddr",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "creator",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "tradingStarted",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "listed",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "whitelistOnly",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "lockLP",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "wlCount",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "totalSupply",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "ethRaised",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "tokensSold",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "virtualEthReserve",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "virtualTokenReserve",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "k",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "feeCollected",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "taxOnSafuBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "taxOnDexBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "isBundled",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isTaxedOnDex",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isTaxedOnSafu",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "isMaxWalletOnSafu",
          "type": "bool",
          "internalType": "bool"
        },
        {
          "name": "maxWalletAmountOnSafu",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "devRewardETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "disableMaxWalletLimit",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "disableWhitelist",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getAmountOut",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amountIn",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "isBuy",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getMetrics",
      "inputs": [],
      "outputs": [
        {
          "name": "_volumeETH",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_feesETH",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_tokensLaunched",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_tokensListed",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_taxedTokens",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_zeroTaxTokens",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_devRewardsEth",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getRemainingWhitelistBalance",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "hasTraded",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "initialPoolEth",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isSafuTokenAutoWL",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listingFeeBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listingFeeDiv",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "listingMilestone",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "locker",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "maxWhitelistBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "reservedEth",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "safuToken",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "sell",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "amt",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setTierThreshold",
      "inputs": [
        {
          "name": "_tier1Threshold",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier1ThresholdDiv",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier1WLCap",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier1WLDiv",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2Threshold",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2ThresholdDiv",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2WLCap",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_tier2WLDiv",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setTradeFeeBps",
      "inputs": [
        {
          "name": "_newBps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "startTrading",
      "inputs": [
        {
          "name": "tok",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "taxOnDexMaxBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "taxOnSafuMaxBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier1Threshold",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier1WLCap",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier2Threshold",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tier2WLCap",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalDevRewardEth",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalFeesETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalTaxedTokens",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalTokensLaunched",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalTokensListed",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalVolumeETH",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "totalZeroTaxTokens",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "tradeFeeBps",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "uniqueTraderCount",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "updateCreatorConfigs",
      "inputs": [
        {
          "name": "_taxOnSafuMaxBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_taxOnDexMaxBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_bundleMaxAmount",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_listingMilestone",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_maxWhitelistBps",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateListingFee",
      "inputs": [
        {
          "name": "_newBps",
          "type": "uint16",
          "internalType": "uint16"
        },
        {
          "name": "_newDiv",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updatePoolConfigs",
      "inputs": [
        {
          "name": "_newPoolETH",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "_newDevRewardETH",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "updateSafuTokenCA",
      "inputs": [
        {
          "name": "_s",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "whitelist",
      "inputs": [
        {
          "name": "_tokenAddr",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_eoa",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "whitelistAllocationLeft",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "whitelistMaxWallet",
      "inputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint16",
          "internalType": "uint16"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "withdrawStuckETH",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "Listed",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "pair",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "TokenDeployed",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        },
        {
          "name": "myIndex",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "Trade",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "token",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "buy",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        },
        {
          "name": "inAmt",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "outAmt",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "DisAllowed",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ETHTF",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ExceedsL",
      "inputs": []
    },
    {
      "type": "error",
      "name": "ExceedsM",
      "inputs": []
    },
    {
      "type": "error",
      "name": "FeeTF",
      "inputs": []
    },
    {
      "type": "error",
      "name": "InvalidB",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotAutoWL",
      "inputs": []
    },
    {
      "type": "error",
      "name": "NotCreator",
      "inputs": []
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ReentrancyGuardReentrantCall",
      "inputs": []
    },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        {
          "name": "token",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "ShareM",
      "inputs": []
    },
    {
      "type": "error",
      "name": "TaxCF",
      "inputs": []
    },
    {
      "type": "error",
      "name": "TokenIL",
      "inputs": []
    },
    {
      "type": "error",
      "name": "TradingNL",
      "inputs": []
    }
  ],
} as const;

/**
 * Description placeholder
 *
 * @type {{ readonly address: "0x4BEdac867d705d9225293c6eba1Fc2d98Fa70DD8"; readonly abi: readonly [{ readonly type: "constructor"; readonly inputs: readonly [{ readonly name: "initialOwner"; readonly type: "address"; readonly internalType: "address"; }, { ...; }, { ...; }, { ...; }]; readonly stateMutability: "nonpayable"; }...}
 */
export const TOKEN_ABI = {
  abi: [
    {
      type: "constructor",
      inputs: [
        {
          name: "initialOwner",
          type: "address",
          internalType: "address",
        },
        {
          name: "tokenName",
          type: "string",
          internalType: "string",
        },
        {
          name: "tokenSymbol",
          type: "string",
          internalType: "string",
        },
        {
          name: "totalSupply",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "allowance",
      inputs: [
        {
          name: "owner",
          type: "address",
          internalType: "address",
        },
        {
          name: "spender",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "approve",
      inputs: [
        {
          name: "spender",
          type: "address",
          internalType: "address",
        },
        {
          name: "value",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "bool",
          internalType: "bool",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "balanceOf",
      inputs: [
        {
          name: "account",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "decimals",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint8",
          internalType: "uint8",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "name",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "string",
          internalType: "string",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "owner",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "renounceOwnership",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "symbol",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "string",
          internalType: "string",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalSupply",
      inputs: [],
      outputs: [
        {
          name: "",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "transfer",
      inputs: [
        {
          name: "to",
          type: "address",
          internalType: "address",
        },
        {
          name: "value",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "bool",
          internalType: "bool",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "transferFrom",
      inputs: [
        {
          name: "from",
          type: "address",
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          internalType: "address",
        },
        {
          name: "value",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      outputs: [
        {
          name: "",
          type: "bool",
          internalType: "bool",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "transferOwnership",
      inputs: [
        {
          name: "newOwner",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "Approval",
      inputs: [
        {
          name: "owner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "spender",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "value",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "OwnershipTransferred",
      inputs: [
        {
          name: "previousOwner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "newOwner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Transfer",
      inputs: [
        {
          name: "from",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "to",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "value",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "error",
      name: "ERC20InsufficientAllowance",
      inputs: [
        {
          name: "spender",
          type: "address",
          internalType: "address",
        },
        {
          name: "allowance",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "needed",
          type: "uint256",
          internalType: "uint256",
        },
      ],
    },
    {
      type: "error",
      name: "ERC20InsufficientBalance",
      inputs: [
        {
          name: "sender",
          type: "address",
          internalType: "address",
        },
        {
          name: "balance",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "needed",
          type: "uint256",
          internalType: "uint256",
        },
      ],
    },
    {
      type: "error",
      name: "ERC20InvalidApprover",
      inputs: [
        {
          name: "approver",
          type: "address",
          internalType: "address",
        },
      ],
    },
    {
      type: "error",
      name: "ERC20InvalidReceiver",
      inputs: [
        {
          name: "receiver",
          type: "address",
          internalType: "address",
        },
      ],
    },
    {
      type: "error",
      name: "ERC20InvalidSender",
      inputs: [
        {
          name: "sender",
          type: "address",
          internalType: "address",
        },
      ],
    },
    {
      type: "error",
      name: "ERC20InvalidSpender",
      inputs: [
        {
          name: "spender",
          type: "address",
          internalType: "address",
        },
      ],
    },
    {
      type: "error",
      name: "OwnableInvalidOwner",
      inputs: [
        {
          name: "owner",
          type: "address",
          internalType: "address",
        },
      ],
    },
    {
      type: "error",
      name: "OwnableUnauthorizedAccount",
      inputs: [
        {
          name: "account",
          type: "address",
          internalType: "address",
        },
      ],
    },
  ],
} as const;

/**
 * Description placeholder
 *
 * @type {{ readonly address: "0x602120373b9de0069D5C950C98b66Adf7ABD8bE9"; readonly abi: readonly [{ readonly type: "constructor"; readonly inputs: readonly [{ readonly name: "_adm"; readonly type: "address"; readonly internalType: "address"; }]; readonly stateMutability: "nonpayable"; }, ... 8 more ..., { ...; }]; }}
 */
export const PRICE_GETTER_ABI = {
  abi: [
    {
      type: "constructor",
      inputs: [
        {
          name: "_adm",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "receive",
      stateMutability: "payable",
    },
    {
      type: "function",
      name: "convertETHToUSD",
      inputs: [
        {
          name: "_ethAmount",
          type: "uint256",
          internalType: "uint256",
        },
        {
          name: "_ethUsdPriceFeed",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "usdValue",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getLatestETHPrice",
      inputs: [
        {
          name: "_priceFeed",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "ETHUSDPrice",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getTokenPriceFromPair",
      inputs: [
        {
          name: "_pairAddress",
          type: "address",
          internalType: "address",
        },
        {
          name: "_tokenAddress",
          type: "address",
          internalType: "address",
        },
        {
          name: "_quoteTokenAddress",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "ETHValue",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getTokenPriceInUSD",
      inputs: [
        {
          name: "_pairAddress",
          type: "address",
          internalType: "address",
        },
        {
          name: "_tokenAddress",
          type: "address",
          internalType: "address",
        },
        {
          name: "_quoteTokenAddress",
          type: "address",
          internalType: "address",
        },
        {
          name: "_priceFeed",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "usdPrice",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "withdrawNonNativeToken",
      inputs: [
        {
          name: "_token",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "withdrawStuckETH",
      inputs: [],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "nonNativeTokenWithdrawal",
      inputs: [
        {
          name: "_token",
          type: "address",
          indexed: false,
          internalType: "address",
        },
        {
          name: "_account",
          type: "address",
          indexed: false,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "stuckETHWithdrawal",
      inputs: [
        {
          name: "_account",
          type: "address",
          indexed: false,
          internalType: "address",
        },
      ],
      anonymous: false,
    },
  ],
} as const;
