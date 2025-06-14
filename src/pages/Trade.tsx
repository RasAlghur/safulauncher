// safu-dapp/src/pages/Trade.tsx
import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
    useAccount,
    useWriteContract,
    useReadContract,
    useWaitForTransactionReceipt,
} from 'wagmi';
import { TOKEN_ABI, LAUNCHER_ABI, SAFU_LAUNCHER_CA, ETH_USDT_PRICE_FEED, PRICE_GETTER_ABI } from '../web3/config';
import { ethers } from 'ethers';
import '../App.css';
import { pureInfoDataRaw, pureGetLatestETHPrice, pureAmountOutMarketCap } from '../web3/readContracts';

interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
    createdAt?: number;  // Optional, can be used to store creation timestamp
    expiresAt?: number; // Optional, can be used to store expiration timestamp
}


interface TxLog {
    type: 'buy' | 'sell';
    wallet: string;
    ethAmount: string;    // ETH spent (buy) or received (sell)
    tokenAmount: string;  // tokens received (buy) or sold (sell)
    txnHash: string;
    timestamp: string;
}

// 1. Create a formatter function:
function formatUTC(isoString: string): string {
    return new Date(isoString).toLocaleString('en-GB', {
        timeZone: 'UTC',
        hour12: true,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}


function getStartOfCurrentDay(): number {
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return now.getTime();
}

function formatVolume(value: number): string {
    return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)}M` : value.toLocaleString();
}

export default function Trade() {
    const { address, isConnected } = useAccount();
    const { tokenAddress } = useParams<{ tokenAddress: `0x${string}` }>();
    const [token, setToken] = useState<TokenMetadata | null>(null);
    const [txLogs, setTxLogs] = useState<TxLog[]>([]);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [amount, setAmount] = useState<string>('');
    const [isLoadingToken, setIsLoadingToken] = useState(true);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isProcessingTxn, setIsProcessingTxn] = useState(false);
    const [fallbackInfoData, setFallbackInfoData] = useState<any[] | null>(null);
    const [fallbackETHPrice, setFallbackETHPrice] = useState<any | null>(null);
    const [curveProgressMap, setCurveProgressMap] = useState<Record<string, number>>({});
    const [oneTokenPriceETH, setOneTokenPriceETH] = useState<number | null>(null)
    const [isLoadingOneTokenPrice, setIsLoadingOneTokenPrice] = useState(false)


    // Admin function states
    const [whitelistAddresses, setWhitelistAddresses] = useState<string>('');
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    // Track the type of the last transaction: 'approval', 'sell', or admin functions
    const [lastTxnType, setLastTxnType] = useState<"approval" | "sell" | "buy" | "startTrading" | "addToWhitelist" | "disableWhitelist" | null>(
        null
    );

    // Check if current user is the token creator
    const isTokenCreator = address && token && address.toLowerCase() === token.tokenCreator.toLowerCase();

    // Wagmi hooks
    const { data: txHash, writeContract, isPending: isWritePending, error } = useWriteContract();
    const { data: result, isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash: txHash });

    // Compute parsed values
    const ethValue = ethers.parseEther(mode === 'buy' ? amount || '0' : '0');
    const tokenValue = ethers.parseEther(mode === 'sell' ? amount || '0' : '0');

    const { data: getBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract(
        tokenAddress && address
            ? {
                ...TOKEN_ABI,
                address: tokenAddress as `0x${string}`,
                functionName: 'balanceOf',
                args: [address as `0x${string}`]
            }
            : undefined
    );

    const {
        data: allowance,
        isLoading: isLoadingAllowance,
        refetch: refetchAllowance,
    } = useReadContract(
        tokenAddress && address
            ? {
                ...TOKEN_ABI,
                address: tokenAddress,
                functionName: "allowance",
                args: [address as `0x${string}`, SAFU_LAUNCHER_CA],
            }
            : undefined
    );

    // Admin function to start trading
    const handleStartTrading = useCallback(() => {
        if (!tokenAddress || !isTokenCreator) return;
        setErrorMsg("");
        setLastTxnType("startTrading");

        writeContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: 'startTrading',
            args: [tokenAddress as `0x${string}`]
        });
        setIsProcessingTxn(true);
    }, [writeContract, tokenAddress, isTokenCreator, LAUNCHER_ABI, SAFU_LAUNCHER_CA]);

    // Admin function to add addresses to whitelist
    const handleAddToWhitelist = useCallback(() => {
        if (!tokenAddress || !isTokenCreator || !whitelistAddresses.trim()) {
            setErrorMsg("Please enter valid addresses to whitelist");
            return;
        }

        // Parse comma-separated addresses
        const addresses = whitelistAddresses
            .split(',')
            .map(addr => addr.trim())
            .filter(addr => addr.length > 0);

        if (addresses.length === 0) {
            setErrorMsg("Please enter valid addresses");
            return;
        }

        setErrorMsg("");
        setLastTxnType("addToWhitelist");

        writeContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: 'addToWhitelist',
            args: [tokenAddress as `0x${string}`, addresses as `0x${string}`[]]
        });
        setIsProcessingTxn(true);
    }, [writeContract, tokenAddress, isTokenCreator, whitelistAddresses, LAUNCHER_ABI, SAFU_LAUNCHER_CA]);

    // Admin function to disable whitelist
    const handleDisableWhitelist = useCallback(() => {
        if (!tokenAddress || !isTokenCreator) return;
        setErrorMsg("");
        setLastTxnType("disableWhitelist");

        writeContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: 'disableWhitelist',
            args: [tokenAddress as `0x${string}`]
        });
        setIsProcessingTxn(true);
    }, [writeContract, tokenAddress, isTokenCreator, LAUNCHER_ABI, SAFU_LAUNCHER_CA]);

    // Function to handle approval.
    const handleApprove = useCallback(() => {
        setErrorMsg("");
        if (isLoadingAllowance || isConfirming) return;
        if (mode === 'sell' && !amount) {
            setErrorMsg("Please enter an amount to sell");
            return;
        }

        // Mark this txn as an approval txn.
        setLastTxnType("approval");
        writeContract({
            ...TOKEN_ABI,
            functionName: "approve",
            address: tokenAddress!,
            args: [SAFU_LAUNCHER_CA as `0x${string}`, tokenValue], // Use tokenValue (parsed amount)
        });
        setIsProcessingTxn(true);
    }, [
        isLoadingAllowance,
        isConfirming,
        amount,
        tokenValue,
        writeContract,
        tokenAddress,
        mode,
        SAFU_LAUNCHER_CA,
    ]);

    const { data: amountOut, isLoading: isLoadingAmountOut,
        refetch: refetchAmountOut } = useReadContract(
            tokenAddress
                ? {
                    ...LAUNCHER_ABI,
                    address: SAFU_LAUNCHER_CA,
                    functionName: 'getAmountOut',
                    args: [
                        tokenAddress,
                        mode === 'buy' ? ethValue : tokenValue,
                        mode === 'buy' ? true : false
                    ],
                }
                : undefined
        );

    const { data: infoDataRaw, isLoading: isLoadingInfoData,
        refetch: refetchInfoData } = useReadContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: 'data',
            args: [tokenAddress!],
        });

    useEffect(() => {
        if (!isConnected && tokenAddress) {
            pureInfoDataRaw(tokenAddress).then(data => {
                if (Array.isArray(data)) {
                    console.log("Fetched fallback info data:", data);
                    setFallbackInfoData(data);
                } else {
                    console.error("Expected array, got:", data);
                    setFallbackInfoData([]);
                }
            });
        }
    }, [isConnected, tokenAddress]);

    const infoData = isConnected ? infoDataRaw : fallbackInfoData;

    const tokenSupply = infoData ? Number(infoData[7]) : 0;
    const tokenSold = infoData ? Number(infoData[10]) : 0;
    const isStartTrading = infoData ? Number(infoData[1]) : 0;
    const isListed = infoData ? Number(infoData[2]) : 0;
    const isWhiteListOngoing = infoData ? Number(infoData[3]) : 0;


    const curvePercent = infoData
        ? (Number(tokenSold) / (0.75 * Number(tokenSupply))) * 100
        : 0;

    const curvePercentClamped = Math.min(Math.max(curvePercent, 0), 100);

    // Update curve progress map in effect
    useEffect(() => {
        if (tokenAddress) {
            setIsLoadingOneTokenPrice(true)

            pureAmountOutMarketCap(tokenAddress)
                .then(raw => {
                    // raw is BigInt or a bigint‐style object
                    if (raw !== undefined && raw !== null) {
                        const eth = Number(raw.toString()) / 1e18
                        setOneTokenPriceETH(eth)
                    } else {
                        setOneTokenPriceETH(0)
                    }
                })
                .catch(err => {
                    console.error("failed to fetch single‑token price:", err)
                    setOneTokenPriceETH(0)
                })
                .finally(() => setIsLoadingOneTokenPrice(false))
            setCurveProgressMap(prev => ({ ...prev, [tokenAddress]: curvePercentClamped }));
        }
    }, [tokenAddress, curvePercentClamped]);
    // Check if transaction is in progress
    const isTransactionPending = isWritePending || isConfirming;

    // Convert balance to readable format
    const tokenBalance = getBalance ? ethers.formatEther(getBalance.toString()) : '0';

    const { data: latestETHPrice, isLoading: isLoadingLatestETHPrice,
        refetch: refetchLatestETHPrice } = useReadContract({
            ...PRICE_GETTER_ABI,
            functionName: 'getLatestETHPrice',
            args: [ETH_USDT_PRICE_FEED!],
        });

    useEffect(() => {
        if (!isConnected && ETH_USDT_PRICE_FEED) {
            pureGetLatestETHPrice(ETH_USDT_PRICE_FEED).then(data => {
                if (data) {
                    console.log("Fetched fallback info data:", data);
                    setFallbackETHPrice(data);
                } else {
                    console.error("Expected array, got:", data);
                    setFallbackETHPrice([]);
                }
            });
        }
    }, [isConnected, ETH_USDT_PRICE_FEED]);

    const infoETHCurrentPrice = isConnected ? (Number(latestETHPrice) / 1e8) : (Number(fallbackETHPrice) / 1e8);

    const totalSupplyTokens = tokenSupply / 1e18
    const marketCapETH = oneTokenPriceETH !== null
        ? oneTokenPriceETH * totalSupplyTokens
        : 0
    const marketCapUSD = marketCapETH * infoETHCurrentPrice;

    // console.log("Market Cap USD:", marketCapUSD, "ETH Price:", infoETHCurrentPrice, "One Token Price ETH:", oneTokenPriceETH, "Total Supply Tokens:", totalSupplyTokens);

    // Handlers
    const handleMode = (m: 'buy' | 'sell') => {
        setMode(m);
        setAmount('');
        setErrorMsg('');
    };

    const handleMaxClick = useCallback(() => {
        if (mode === 'sell' && getBalance) {
            const maxAmount = ethers.formatEther(getBalance.toString());
            setAmount(maxAmount);
        }
    }, [mode, getBalance]);

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (!tokenAddress) return;
        setErrorMsg("");
        if (isConfirming) return;

        // Mark this txn as the actual mode (buy/sell) transaction.
        setLastTxnType(mode);
        writeContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: mode,
            args: mode === 'sell'
                ? [tokenAddress, tokenValue]
                : [tokenAddress],
            value: mode === 'buy' ? ethValue : undefined,
        });
        setIsProcessingTxn(true);
    }, [isConfirming, writeContract, tokenAddress, mode, tokenValue, ethValue, LAUNCHER_ABI, SAFU_LAUNCHER_CA]);

    // Check if approval is needed whenever allowance or amount changes.
    useEffect(() => {
        if (
            mode === 'sell' &&
            allowance !== undefined &&
            amount &&
            !isLoadingAllowance
        ) {
            const parsedAmount = ethers.parseEther(amount);
            setNeedsApproval(allowance < parsedAmount);
        } else {
            setNeedsApproval(false);
        }
    }, [allowance, amount, isLoadingAllowance, mode]);

    // If a transaction error occurs (e.g. cancellation), reset the processing flag.
    useEffect(() => {
        if (error) {
            setIsProcessingTxn(false);
        }
    }, [error]);

    // Reset processing state when there's no active transaction.
    useEffect(() => {
        if (!txHash) {
            setIsProcessingTxn(false);
        }
    }, [txHash]);

    // Handle the sell process (approval first if needed, then sell)
    const handleSellProcess = useCallback(() => {
        if (needsApproval) {
            handleApprove();
        } else {
            handleSubmit({ preventDefault: () => { } } as FormEvent);
        }
    }, [needsApproval, handleApprove, handleSubmit]);

    // Refetch data after transaction confirmation
    useEffect(() => {
        if (isConfirmed && txHash) {
            refetchInfoData();
            refetchLatestETHPrice();
            refetchAmountOut();
            refetchBalance();
            refetchAllowance(); // Also refetch allowance after approval

            // Reset processing state after successful transaction
            setIsProcessingTxn(false);

            // Clear whitelist input after successful addition
            if (lastTxnType === "addToWhitelist") {
                setWhitelistAddresses('');
            }
        }
    }, [isConfirmed, txHash, refetchInfoData, refetchAmountOut, refetchBalance, refetchAllowance, refetchLatestETHPrice, lastTxnType]);

    // const API = `https://safulauncher-production.up.railway.app`;

    const API = import.meta.env.VITE_API_BASE_URL;

    // Load token metadata
    useEffect(() => {
        setIsLoadingToken(true);
        fetch(`${API}/api/tokens`)
            .then(res => res.json())
            .then((all: TokenMetadata[]) => {
                const match = all.find(
                    t => t.tokenAddress.toLowerCase() === tokenAddress?.toLowerCase()
                );
                setToken(match ?? null);
            })
            .catch(() => setToken(null))
            .finally(() => setIsLoadingToken(false));
    }, [tokenAddress]);

    useEffect(() => {
        // Only log transactions that are NOT approval transactions
        if (isConfirmed && result && tokenAddress && (lastTxnType === "buy" || lastTxnType === "sell")) {
            (async () => {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const block = await provider.getBlock(result.blockNumber);
                // 2. convert UNIX timestamp to ISO string
                let timestamp = "";
                if (block && block.timestamp) {
                    // timestamp is in seconds, so multiply by 1 000 to get ms
                    const createdAtMs = block.timestamp * 1_000;
                    timestamp = new Date(createdAtMs).toISOString();
                    console.log("Created at: %s", timestamp);
                }
                const type = lastTxnType; // Use lastTxnType instead of mode
                const inputAmountStr = type === 'buy'
                    ? ethers.formatEther(ethValue)
                    : ethers.formatEther(tokenValue);

                // 2. What came out of the swap
                const outputAmountStr = amountOut
                    ? (Number(amountOut.toString()) / 1e18).toString()
                    : '0';

                // 3. Build separate ethAmount & tokenAmount
                const body = {
                    tokenAddress,
                    type,
                    ethAmount: type === 'buy' ? inputAmountStr : outputAmountStr,
                    tokenAmount: type === 'buy' ? outputAmountStr : inputAmountStr,
                    timestamp,
                    txnHash: txHash,
                    wallet: result.from,
                };

                await fetch(`${API}/api/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                // fetch updated logs
                fetchLogs();
            })().catch(console.error);
        }
    }, [isConfirmed, lastTxnType, tokenAddress, txHash, ethValue, tokenValue]);

    const fetchLogs = useCallback(() => {
        if (!tokenAddress) return;
        fetch(
            `${API}/api/transactions/${tokenAddress}`
        )
            .then((r) => r.json())
            .then((all: TxLog[]) => {
                // exclude non-buy/sell entries
                const filtered = all.filter(
                    (tx) => tx.type === 'buy' || tx.type === 'sell'
                );
                setTxLogs(filtered);
            })
            .catch(console.error);
    }, [tokenAddress]);


    // initial load & after token change
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Compute totals
    const totals = txLogs.reduce((acc, tx) => {
        acc.totalEthSpent += parseFloat(tx.ethAmount);
        acc.totalTokensTraded += parseFloat(tx.tokenAmount);
        return acc;
    }, { totalEthSpent: 0, totalTokensTraded: 0 });

    const now = Date.now();
    const startOfToday = getStartOfCurrentDay();
    const logs1d = txLogs.filter(tx => new Date(tx.timestamp).getTime() >= startOfToday);
    const logs7d = txLogs.filter(tx => new Date(tx.timestamp).getTime() >= now - 7 * 24 * 60 * 60 * 1000);
    const logsAll = txLogs;

    const sumVolume = (logs: TxLog[]) => logs.reduce((sum, tx) => sum + parseFloat(tx.ethAmount), 0);

    const volume1dEth = sumVolume(logs1d);
    const volume7dEth = sumVolume(logs7d);
    const volumeAllEth = sumVolume(logsAll);

    const volume1dUsd = volume1dEth * infoETHCurrentPrice;
    const volume7dUsd = volume7dEth * infoETHCurrentPrice;
    const volumeAllUsd = volumeAllEth * infoETHCurrentPrice;

    // Load token metadata
    useEffect(() => {
        if (!tokenAddress) return;
        setIsLoadingToken(true);
        fetch(`${API}/api/tokens`)
            .then((res) => res.json())
            .then((all: TokenMetadata[]) => {
                const match = all.find(
                    (t) =>
                        t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
                );
                setToken(match ?? null);
            })
            .catch(() => setToken(null))
            .finally(() => setIsLoadingToken(false));
    }, [tokenAddress]);

    // TradingView widget
    useEffect(() => {
        if (!token) return;

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.onload = () => {
            // @ts-ignore
            new window.TradingView.widget({
                width: '100%',
                height: 250,
                symbol: token?.symbol || 'ETH',
                interval: '60',
                timezone: 'Etc/UTC',
                theme: 'dark',
                style: '1',
                locale: 'en',
                toolbar_bg: '#f1f3f6',
                enable_publishing: false,
                hide_side_toolbar: true,
                allow_symbol_change: false,
                container_id: 'tv_chart_container',
            });
        };
        document.body.appendChild(script);
    }, [token]);

    // Loading state for initial token load
    if (isLoadingToken) {
        return (
            <div className="container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading token data...</p>
                </div>
            </div>
        );
    }

    // Token not found
    if (!token) {
        return (
            <div className="container">
                <div className="error-message">
                    <h2>Token not found</h2>
                    <p>The requested token could not be loaded.</p>
                </div>
            </div>
        );
    }

    // Get button text based on mode and approval status
    const getButtonText = () => {
        if (isWritePending) return 'Confirming...';
        if (isConfirming) return 'Processing...';

        if (mode === 'buy') {
            return 'Buy';
        } else {
            return needsApproval ? 'Approve' : 'Sell';
        }
    };

    // Handle button click based on mode and approval status
    const handleButtonClick = (e: FormEvent) => {
        e.preventDefault();
        if (mode === 'buy') {
            handleSubmit(e);
        } else {
            handleSellProcess();
        }
    };

    // Get admin transaction status message
    const getAdminTxnMessage = () => {
        switch (lastTxnType) {
            case "startTrading":
                return "Trading started successfully!";
            case "addToWhitelist":
                return "Addresses added to whitelist successfully!";
            case "disableWhitelist":
                return "Whitelist disabled successfully!";
            default:
                return "Transaction confirmed successfully!";
        }
    };

    return (
        <>
            <div className="container">
                <h1>Trade • {token.name} ({token.symbol})</h1>
                <p>Token supply: {(tokenSupply / 1e18).toLocaleString()}</p>
                <p>Token trading started: {isStartTrading}</p>
                <p>Token whitelist round is ongoing: {isWhiteListOngoing}</p>
                <p>Token is listed on uniswap: {isListed}</p>

                <div className="tx-summary">
                    <p>Volume (Today): {volume1dEth.toFixed(4)} ETH (${volume1dUsd.toLocaleString()})</p>
                    <p>Volume (7d): {volume7dEth.toFixed(4)} ETH (${volume7dUsd.toLocaleString()})</p>
                    <p>Volume (All Time): {volumeAllEth.toFixed(4)} ETH (${volumeAllUsd.toLocaleString()})</p>
                </div>
                <p>Total ETH Traded: {totals.totalEthSpent.toFixed(4)} ETH</p>
                <p>Total {token.symbol} Traded: {formatVolume(totals.totalTokensTraded)} {token.symbol}</p>
                {/* Admin Panel - Only show if user is token creator */}
                {isTokenCreator && (
                    <div className="admin-panel">
                        <div className="admin-header">
                            <h3>🔧 Admin Controls</h3>
                            <button
                                className="toggle-admin-btn"
                                onClick={() => setShowAdminPanel(!showAdminPanel)}
                                disabled={isTransactionPending}
                            >
                                {showAdminPanel ? 'Hide' : 'Show'} Controls
                            </button>
                        </div>

                        {showAdminPanel && (
                            <div className="admin-controls">
                                <div className="admin-section">
                                    <h4>Trading Control</h4>
                                    <button
                                        className="admin-btn start-trading"
                                        onClick={handleStartTrading}
                                        disabled={isTransactionPending || isStartTrading === 1 || isProcessingTxn}
                                    >
                                        {isStartTrading === 1 ? 'Trading Started' : 'Start Trading'}
                                    </button>
                                </div>

                                <div className="admin-section">
                                    <h4>Whitelist Management</h4>
                                    <div className="whitelist-input">
                                        <input
                                            type="text"
                                            value={whitelistAddresses}
                                            onChange={(e) => setWhitelistAddresses(e.target.value)}
                                            placeholder="Enter addresses separated by commas"
                                            disabled={isTransactionPending || isProcessingTxn}
                                        />
                                        <button
                                            className="admin-btn add-whitelist"
                                            onClick={handleAddToWhitelist}
                                            disabled={isTransactionPending || !whitelistAddresses.trim() || isProcessingTxn}
                                        >
                                            Add to Whitelist
                                        </button>
                                    </div>
                                    <button
                                        className="admin-btn disable-whitelist"
                                        onClick={handleDisableWhitelist}
                                        disabled={isTransactionPending || isProcessingTxn}
                                    >
                                        Disable Whitelist
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div className="top-section">
                    <div id="chart-container">
                        <div className="volume">
                            Market Cap:{' '}
                            {isLoadingOneTokenPrice || isLoadingLatestETHPrice
                                ? <span className="loading-text">Loading...</span>
                                : `$${marketCapUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            }
                        </div>
                        <div id="tv_chart_container" style={{ width: '100%', height: '100%' }} />
                    </div>

                    <div className="trade-widget">
                        <div className="action-toggle">
                            <button
                                className={mode === 'buy' ? 'active' : ''}
                                onClick={() => handleMode('buy')}
                                disabled={isTransactionPending}
                            >Buy</button>
                            <button
                                className={mode === 'sell' ? 'active' : ''}
                                onClick={() => handleMode('sell')}
                                disabled={isTransactionPending}
                            >Sell</button>
                        </div>

                        {/* Display token balance when in sell mode */}
                        {mode === 'sell' && (
                            <div className="balance-display">
                                Balance: {isLoadingBalance ? (
                                    <span className="loading-text">Loading...</span>
                                ) : (
                                    `${parseFloat(tokenBalance).toLocaleString()} ${token.symbol}`
                                )}
                            </div>
                        )}

                        <form className="trade-form" onSubmit={handleButtonClick}>
                            <label id="inputLabel">
                                Amount ({mode === 'buy' ? 'ETH' : token.symbol})
                            </label>
                            <div className="input-container">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.0"
                                    min="0"
                                    step="any"
                                    autoComplete="off"
                                    disabled={isTransactionPending}
                                />
                                {mode === 'sell' && (
                                    <button
                                        type="button"
                                        className="max-btn"
                                        onClick={handleMaxClick}
                                        disabled={isTransactionPending || isLoadingBalance || !getBalance}
                                    >
                                        {isLoadingBalance ? 'Loading...' : 'Max'}
                                    </button>
                                )}
                            </div>

                            <div className="output">
                                {isLoadingAmountOut ? (
                                    <span className="loading-text">Calculating...</span>
                                ) : (
                                    <>
                                        You will receive {amountOut && mode === 'buy' ? (Number(amountOut.toString()) / 1e18).toLocaleString() : amountOut && mode === 'sell' ? (Number(amountOut.toString()) / 1e18).toFixed(18) : 0} {mode === 'buy' ? token.symbol : 'ETH'}
                                    </>
                                )}
                            </div>

                            {/* Show approval info when in sell mode and approval is needed */}
                            {mode === 'sell' && needsApproval && (
                                <div className="approval-info">
                                    <p>⚠️ Approval required to sell tokens</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`submit ${isTransactionPending ? 'loading' : ''}`}
                                disabled={isTransactionPending || !amount || parseFloat(amount) <= 0}
                            >
                                {getButtonText()}
                                {isTransactionPending && <span className="button-spinner"></span>}
                            </button>
                        </form>

                        {/* Transaction status messages */}
                        {isWritePending && (
                            <div className="status-message pending">
                                Please confirm the transaction in your wallet
                            </div>
                        )}
                        {isConfirming && (
                            <div className="status-message confirming">
                                Transaction submitted. Waiting for confirmation...
                            </div>
                        )}

                        {isConfirmed && txHash && (
                            <div className="status-message success">
                                <p>
                                    {lastTxnType === "approval"
                                        ? "Approval confirmed! You can now sell tokens."
                                        : lastTxnType === "sell"
                                            ? "Sell transaction confirmed successfully!"
                                            : lastTxnType === "buy"
                                                ? "Buy transaction confirmed successfully!"
                                                : ["startTrading", "addToWhitelist", "disableWhitelist"].includes(lastTxnType!)
                                                    ? getAdminTxnMessage()
                                                    : "Transaction confirmed successfully!"}
                                </p>
                                <p className="text-sm text-gray-300">Transaction: {txHash}</p>
                            </div>
                        )}

                        {/* Error Messages */}
                        {errorMsg && (
                            <div className="status-message error">
                                {errorMsg}
                            </div>
                        )}

                        {error && (
                            <div className="status-message error">
                                Error: {'shortMessage' in (error as any)
                                    ? (error as any).shortMessage
                                    : (error as Error).message}
                            </div>
                        )}
                    </div>
                </div>

                <div className="progress-section">
                    <div className="progress-label">
                        Bonding Progress: {isLoadingInfoData ? (
                            <span className="loading-text">Loading...</span>
                        ) : (
                            `${curvePercentClamped.toFixed(0)}%`
                        )}
                    </div>

                    <div style={{ background: '#eee', borderRadius: 4, overflow: 'hidden', height: 10, marginTop: 8 }}>
                        <div style={{
                            width: `${curveProgressMap[token.tokenAddress] || 0}%`,
                            background: '#4caf50',
                            height: '100%'
                        }} />
                    </div>
                </div>

                <div className="mid-section">
                    <div className="tx-table">
                        <h2>Recent Transactions</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Wallet</th>
                                    <th>ETH</th>
                                    <th>{token.symbol}</th>
                                    <th>Txn</th>
                                    <th>Date / Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {txLogs.map((tx, i) => (
                                    <tr key={i}>
                                        <td className={tx.type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                        </td>
                                        <td>{tx.wallet.slice(0, 6)}…{tx.wallet.slice(-4)}</td>
                                        <td>{Number(tx.ethAmount).toFixed(4)}</td>
                                        <td>{Number(tx.tokenAmount).toLocaleString()}</td>
                                        <td>
                                            <a href={`https://etherscan.io/tx/${tx.txnHash}`} target="_blank" rel="noreferrer">
                                                {tx.txnHash.slice(0, 8)}…{tx.txnHash.slice(-6)}
                                            </a>
                                        </td>
                                        <td>{formatUTC(tx.timestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="chat">
                        <h2 className="chat-header">Community Chat</h2>
                        <div id="chatBody" className="chat-body" />
                        <div className="chat-input">
                            <input id="chatInput" placeholder="Type a message…" />
                            <button id="sendBtn">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}