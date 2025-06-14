export const SAFU_LAUNCHER_CA = "0xFb090E8643414297D32f25af545bF66A3B35E4b0";
export const SAFU_TOKEN_CA = "0x4BEdac867d705d9225293c6eba1Fc2d98Fa70DD8";
export const ETH_USDT_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
export const testChainID = 11155111;
export const mainnetID = 1;

export const LAUNCHER_ABI = {
    address: "0xFb090E8643414297D32f25af545bF66A3B35E4b0",
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
            "name": "DEV_REWARD",
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
            "name": "LISTING_FEE_BPS",
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
            "name": "TRADE_FEE_BPS",
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
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
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
                    "name": "taxBps_",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "lockLp",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "whitelistOnly_",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "startNow",
                    "type": "bool",
                    "internalType": "bool"
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
                    "name": "taxRecipients",
                    "type": "address[]",
                    "internalType": "address[]"
                },
                {
                    "name": "taxPercents",
                    "type": "uint16[]",
                    "internalType": "uint16[]"
                },
                {
                    "name": "initialWhitelist",
                    "type": "address[]",
                    "internalType": "address[]"
                },
                {
                    "name": "platformFeeBps_",
                    "type": "uint16",
                    "internalType": "uint16"
                },
                {
                    "name": "platformFeeRecipients_",
                    "type": "address[]",
                    "internalType": "address[]"
                },
                {
                    "name": "platformFeePercents_",
                    "type": "uint16[]",
                    "internalType": "uint16[]"
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
                    "name": "burnLP",
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
                    "name": "reservedTokens",
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
                    "name": "initialMarketCap",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "platformFeeBps",
                    "type": "uint16",
                    "internalType": "uint16"
                }
            ],
            "stateMutability": "view"
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
            "name": "getAmountIn",
            "inputs": [
                {
                    "name": "tok",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "amountOut",
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
            "name": "getCurrentTokenPrice",
            "inputs": [
                {
                    "name": "tok",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "priceInETH",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "priceInUSD",
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
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getTradeDetails",
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
                    "name": "amountOut",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "fee",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "priceImpactBps",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "newPriceInETH",
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
            "name": "withdrawNonNativeToken",
            "inputs": [
                {
                    "name": "_token",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_amount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
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
            "name": "ETHTransferFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "ExceedsLimit",
            "inputs": []
        },
        {
            "type": "error",
            "name": "FeeTransferFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "InvalidBundle",
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
            "name": "ShareMismatch",
            "inputs": []
        },
        {
            "type": "error",
            "name": "TaxConfigFailed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "TradingNotLive",
            "inputs": []
        }
    ]
} as const

export const TOKEN_ABI = {
    address: "0x4BEdac867d705d9225293c6eba1Fc2d98Fa70DD8",
    abi: [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "initialOwner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "tokenName",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "tokenSymbol",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "totalSupply",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "allowance",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "spender",
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
            "name": "approve",
            "inputs": [
                {
                    "name": "spender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "balanceOf",
            "inputs": [
                {
                    "name": "account",
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
            "name": "decimals",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint8",
                    "internalType": "uint8"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "name",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
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
            "name": "symbol",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "totalSupply",
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
            "name": "transfer",
            "inputs": [
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "transferFrom",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "nonpayable"
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
            "type": "event",
            "name": "Approval",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "spender",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
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
            "name": "Transfer",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "ERC20InsufficientAllowance",
            "inputs": [
                {
                    "name": "spender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "allowance",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "needed",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InsufficientBalance",
            "inputs": [
                {
                    "name": "sender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "balance",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "needed",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidApprover",
            "inputs": [
                {
                    "name": "approver",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidReceiver",
            "inputs": [
                {
                    "name": "receiver",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidSender",
            "inputs": [
                {
                    "name": "sender",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidSpender",
            "inputs": [
                {
                    "name": "spender",
                    "type": "address",
                    "internalType": "address"
                }
            ]
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
        }
    ]
} as const

export const PRICE_GETTER_ABI = {
    address: "0x602120373b9de0069D5C950C98b66Adf7ABD8bE9",
    abi: [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_adm",
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
            "name": "convertETHToUSD",
            "inputs": [
                {
                    "name": "_ethAmount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_ethUsdPriceFeed",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "usdValue",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getLatestETHPrice",
            "inputs": [
                {
                    "name": "_priceFeed",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "ETHUSDPrice",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getTokenPriceFromPair",
            "inputs": [
                {
                    "name": "_pairAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_tokenAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_quoteTokenAddress",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "ETHValue",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getTokenPriceInUSD",
            "inputs": [
                {
                    "name": "_pairAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_tokenAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_quoteTokenAddress",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_priceFeed",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [
                {
                    "name": "usdPrice",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "withdrawNonNativeToken",
            "inputs": [
                {
                    "name": "_token",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
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
            "name": "nonNativeTokenWithdrawal",
            "inputs": [
                {
                    "name": "_token",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "_account",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "stuckETHWithdrawal",
            "inputs": [
                {
                    "name": "_account",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        }
    ]
} as const