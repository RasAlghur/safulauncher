// safu-dapp/src/pages/Trade.tsx
import { useEffect, useState, useCallback, type FormEvent, useMemo, useRef } from 'react';
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
import { pureInfoDataRaw, pureGetLatestETHPrice, pureAmountOutMarketCap, pureAmountOut } from '../web3/readContracts';
import LightweightChart from '../web3/lightWeightChart';
import TimeframeSelector from '../web3/timeframeSelector';

interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
    createdAt?: number;
    expiresAt?: number;
}

interface TxLog {
    type: 'buy' | 'sell';
    wallet: string;
    ethAmount: string;
    tokenAmount: string;
    txnHash: string;
    timestamp: string;
}

interface CandlestickData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

type TransactionType = "approval" | "sell" | "buy" | "startTrading" | "addToWhitelist" | "disableWhitelist";


interface TimeframeOption {
    label: string;
    value: string;
    resolution: string;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
    // Seconds
    { label: '1s', value: '1s', resolution: '1s', seconds: 1 },

    // Minutes
    { label: '1m', value: '1m', resolution: '1m', minutes: 1 },
    { label: '5m', value: '5m', resolution: '5m', minutes: 5 },
    { label: '15m', value: '15m', resolution: '15m', minutes: 15 },

    // Hours
    { label: '1h', value: '1h', resolution: '1h', hours: 1 },
    { label: '2h', value: '2h', resolution: '2h', hours: 2 },
    { label: '4h', value: '4h', resolution: '4h', hours: 4 },
    { label: '8h', value: '8h', resolution: '8h', hours: 8 },
    { label: '12h', value: '12h', resolution: '12h', hours: 12 },

    // Days
    { label: '1D', value: '1D', resolution: '1D', days: 1 },
    { label: '3D', value: '3D', resolution: '3D', days: 3 },

    // Weeks
    { label: '1W', value: '1W', resolution: '1W', days: 7 },

    // Months
    { label: '1M', value: '1M', resolution: '1M', days: 30 },
];


// Utility functions
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

function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function formatTokenAmount(amount: string | number, decimals: number = 4): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export default function Trade() {
    const { address, isConnected } = useAccount();
    const { tokenAddress } = useParams<{ tokenAddress: `0x${string}` }>();

    const [fallbackAmountOut, setFallbackAmountOut] = useState<bigint | null>(null);
    const [isLoadingFallbackAmountOut, setIsLoadingFallbackAmountOut] = useState(false);

    // Core state
    const [token, setToken] = useState<TokenMetadata | null>(null);
    const [txLogs, setTxLogs] = useState<TxLog[]>([]);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [amount, setAmount] = useState<string>('');
    const [isLoadingToken, setIsLoadingToken] = useState(true);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isProcessingTxn, setIsProcessingTxn] = useState(false);

    // Fallback data for non-connected users
    const [fallbackInfoData, setFallbackInfoData] = useState<any[] | null>(null);
    const [fallbackETHPrice, setFallbackETHPrice] = useState<any | null>(null);

    // UI state
    const [curveProgressMap, setCurveProgressMap] = useState<Record<string, number>>({});
    const [oneTokenPriceETH, setOneTokenPriceETH] = useState<number | null>(null);
    const [isLoadingOneTokenPrice, setIsLoadingOneTokenPrice] = useState(false);
    const [ohlc, setOhlc] = useState<CandlestickData[]>([]);

    // Admin state
    const [whitelistAddresses, setWhitelistAddresses] = useState<string>('');
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [lastTxnType, setLastTxnType] = useState<TransactionType | null>(null);


    // New timeframe state
    const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(
        TIMEFRAME_OPTIONS.find(tf => tf.value === '15m') || TIMEFRAME_OPTIONS[0]
    );
    const [isLoadingChart, setIsLoadingChart] = useState(false);

    const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingChartRef = useRef(false);

    // Memoized values
    const API = useMemo(() => import.meta.env.VITE_API_BASE_URL, []);
    const isTokenCreator = useMemo(() =>
        address && token && address.toLowerCase() === token.tokenCreator.toLowerCase(),
        [address, token]
    );

    // Wagmi hooks
    const { data: txHash, writeContract, isPending: isWritePending, error } = useWriteContract();
    const { data: result, isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash: txHash });

    // Computed values with error handling
    const ethValue = useMemo(() => {
        try {
            return ethers.parseEther(mode === 'buy' ? amount || '0' : '0');
        } catch {
            return BigInt(0);
        }
    }, [mode, amount]);

    const tokenValue = useMemo(() => {
        try {
            return ethers.parseEther(mode === 'sell' ? amount || '0' : '0');
        } catch {
            return BigInt(0);
        }
    }, [mode, amount]);

    // Contract read hooks
    const { data: getBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract(
        tokenAddress && address ? {
            ...TOKEN_ABI,
            address: tokenAddress as `0x${string}`,
            functionName: 'balanceOf',
            args: [address as `0x${string}`]
        } : undefined
    );

    const { data: allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useReadContract(
        tokenAddress && address ? {
            ...TOKEN_ABI,
            address: tokenAddress,
            functionName: "allowance",
            args: [address as `0x${string}`, SAFU_LAUNCHER_CA],
        } : undefined
    );

    const { data: amountOut, isLoading: isLoadingAmountOut, refetch: refetchAmountOut } = useReadContract(
        tokenAddress ? {
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: 'getAmountOut',
            args: [tokenAddress, mode === 'buy' ? ethValue : tokenValue, mode === 'buy' ? true : false],
        } : undefined
    );

    // Add this useEffect to handle the async call
    useEffect(() => {
        if (!isConnected && tokenAddress && (ethValue > 0n || tokenValue > 0n)) {
            setIsLoadingFallbackAmountOut(true);
            pureAmountOut(tokenAddress, mode === 'buy' ? ethValue : tokenValue, mode === 'buy')
                .then(result => {
                    setFallbackAmountOut(result || null);
                })
                .catch(error => {
                    console.error('Error fetching fallback amount out:', error);
                    setFallbackAmountOut(null);
                })
                .finally(() => {
                    setIsLoadingFallbackAmountOut(false);
                });
        } else if (isConnected) {
            setFallbackAmountOut(null);
        }
    }, [isConnected, tokenAddress, ethValue, tokenValue, mode]);

    // Update your amountOutSelect logic
    const amountOutSelect = isConnected ? amountOut : fallbackAmountOut;
    const isLoadingAmountOutSelect = isConnected ? isLoadingAmountOut : isLoadingFallbackAmountOut;

    const { data: infoDataRaw, isLoading: isLoadingInfoData, refetch: refetchInfoData } = useReadContract({
        ...LAUNCHER_ABI,
        address: SAFU_LAUNCHER_CA,
        functionName: 'data',
        args: [tokenAddress!],
    });

    const { data: latestETHPrice, isLoading: isLoadingLatestETHPrice, refetch: refetchLatestETHPrice } = useReadContract({
        ...PRICE_GETTER_ABI,
        functionName: 'getLatestETHPrice',
        args: [ETH_USDT_PRICE_FEED!],
    });

    // Computed contract data
    const infoData = isConnected ? infoDataRaw : fallbackInfoData;
    const tokenSupply = infoData ? Number(infoData[7]) : 0;
    const tokenSold = infoData ? Number(infoData[10]) : 0;
    const isStartTrading = infoData ? Number(infoData[1]) : 0;
    const isListed = infoData ? Number(infoData[2]) : 0;
    const isWhiteListOngoing = infoData ? Number(infoData[3]) : 0;

    const curvePercent = infoData ? (Number(tokenSold) / (0.75 * Number(tokenSupply))) * 100 : 0;
    const curvePercentClamped = Math.min(Math.max(curvePercent, 0), 100);

    const infoETHCurrentPrice = isConnected && !isLoadingLatestETHPrice ? (Number(latestETHPrice) / 1e8) : (Number(fallbackETHPrice) / 1e8);
    const tokenBalance = getBalance ? ethers.formatEther(getBalance.toString()) : '0';
    const isTransactionPending = isWritePending || isConfirming;

    // Market cap calculations
    const totalSupplyTokens = tokenSupply / 1e18;
    const marketCapETH = oneTokenPriceETH !== null ? oneTokenPriceETH * totalSupplyTokens : 0;
    const marketCapUSD = marketCapETH * infoETHCurrentPrice;
    const tokenPriceUSD = oneTokenPriceETH !== null ? oneTokenPriceETH * infoETHCurrentPrice : 0;

    // Load fallback data for non-connected users
    useEffect(() => {
        if (!isConnected && tokenAddress) {
            Promise.all([
                pureInfoDataRaw(tokenAddress).catch(() => []),
                ETH_USDT_PRICE_FEED ? pureGetLatestETHPrice(ETH_USDT_PRICE_FEED).catch(() => null) : Promise.resolve(null)
            ]).then(([infoData, ethPrice]) => {
                setFallbackInfoData(Array.isArray(infoData) ? infoData : []);
                setFallbackETHPrice(ethPrice);
            });
        }
    }, [isConnected, tokenAddress]);

    // Load one token price
    useEffect(() => {
        if (tokenAddress) {
            setIsLoadingOneTokenPrice(true);
            pureAmountOutMarketCap(tokenAddress)
                .then(raw => {
                    if (raw !== undefined && raw !== null) {
                        const eth = Number(raw.toString()) / 1e18;
                        setOneTokenPriceETH(eth);
                    } else {
                        setOneTokenPriceETH(0);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch single-token price:", err);
                    setOneTokenPriceETH(0);
                })
                .finally(() => setIsLoadingOneTokenPrice(false));

            setCurveProgressMap(prev => ({ ...prev, [tokenAddress]: curvePercentClamped }));
        }
    }, [tokenAddress, curvePercentClamped, isLoadingOneTokenPrice]);


    const loadChartData = useCallback(async (isAutoUpdate = false) => {
        if (!tokenAddress || isLoadingChartRef.current) return;

        // Prevent concurrent chart updates
        isLoadingChartRef.current = true;

        if (!isAutoUpdate) {
            setIsLoadingChart(true);
        }

        try {
            console.log(`${isAutoUpdate ? 'Auto-' : ''}Loading OHLC data for token: ${tokenAddress}, timeframe: ${selectedTimeframe.value}`);

            const period = calculatePeriod(selectedTimeframe);
            const timestamp = Date.now();

            const ohlcResponse = await fetch(
                `${API}/api/ohlc/${tokenAddress}?resolution=${selectedTimeframe.resolution}&period=${period}&t=${timestamp}`
            );
            const ohlcData = await ohlcResponse.json();

            if (Array.isArray(ohlcData) && ohlcData.length > 0) {
                const formattedData = ohlcData.map(d => ({
                    time: typeof d.time === 'number' ? d.time : Math.floor(new Date(d.time).getTime() / 1000),
                    open: Number(d.open) || 0,
                    high: Number(d.high) || 0,
                    low: Number(d.low) || 0,
                    close: Number(d.close) || 0,
                    volume: Number(d.volume) || 0
                })).filter(d =>
                    d.open > 0 && d.high > 0 && d.low > 0 && d.close > 0 &&
                    d.time > 0 && !isNaN(d.time)
                );

                setOhlc(formattedData);
                setLastUpdateTime(Date.now());

                if (isAutoUpdate) {
                    console.log('Chart auto-updated with new data');
                }
            } else {
                console.log('No OHLC data available');
                if (!isAutoUpdate) {
                    setOhlc([]);
                }
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
            if (!isAutoUpdate) {
                setOhlc([]);
            }
        } finally {
            isLoadingChartRef.current = false;
            if (!isAutoUpdate) {
                setIsLoadingChart(false);
            }
        }
    }, [tokenAddress, selectedTimeframe, API]);

    // Setup auto-update interval
    useEffect(() => {
        if (!isAutoUpdateEnabled || !tokenAddress) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Determine update frequency based on timeframe
        const getUpdateInterval = () => {
            if (selectedTimeframe.seconds) {
                return Math.max(2000, selectedTimeframe.seconds * 1000); // At least 2 seconds
            } else if (selectedTimeframe.minutes) {
                return Math.max(10000, selectedTimeframe.minutes * 60 * 1000 / 6); // Update 6 times per timeframe period
            } else if (selectedTimeframe.hours) {
                return Math.max(30000, selectedTimeframe.hours * 60 * 60 * 1000 / 12); // Update 12 times per timeframe period
            } else {
                return 60000; // Default 1 minute for daily/weekly/monthly
            }
        };

        const updateInterval = getUpdateInterval();
        console.log(`Setting up auto-update with interval: ${updateInterval}ms for timeframe: ${selectedTimeframe.value}`);

        intervalRef.current = setInterval(() => {
            loadChartData(true);
        }, updateInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isAutoUpdateEnabled, tokenAddress, selectedTimeframe, loadChartData]);

    useEffect(() => {
        if (!tokenAddress) return;
        loadChartData(false);
    }, [tokenAddress, selectedTimeframe, loadChartData]);

    // Calculate period based on timeframe for data fetching
    const calculatePeriod = (timeframe: TimeframeOption): string => {
        if (timeframe.seconds) {
            // For seconds, fetch last few minutes of data
            return `${Math.max(300, timeframe.seconds * 100)}s`; // At least 5 minutes
        } else if (timeframe.minutes) {
            // For minutes, fetch proportional hours
            const hours = Math.max(4, timeframe.minutes * 4);
            return `${hours}h`;
        } else if (timeframe.hours) {
            // For hours, fetch proportional days
            const days = Math.max(1, Math.ceil(timeframe.hours * 3));
            return `${days}d`;
        } else if (timeframe.days) {
            // For days, fetch proportional period
            if (timeframe.days <= 3) {
                return `${timeframe.days * 7}d`; // Show more context
            } else if (timeframe.days === 7) {
                return '2M'; // 2 months for weekly
            } else {
                return '6M'; // 6 months for monthly
            }
        }
        return '30d'; // Default fallback
    };

    // Enhanced timeframe change handler
    const handleTimeframeChange = useCallback((timeframe: TimeframeOption) => {
        setSelectedTimeframe(timeframe);
        // Immediately load new data for the selected timeframe
        setTimeout(() => loadChartData(false), 100);
    }, [loadChartData]);

    // Add toggle for auto-update
    const toggleAutoUpdate = useCallback(() => {
        setIsAutoUpdateEnabled(prev => !prev);
    }, []);


    // Load token metadata
    useEffect(() => {
        if (!tokenAddress) return;

        setIsLoadingToken(true);
        fetch(`${API}/api/tokens`)
            .then(res => res.json())
            .then((all: TokenMetadata[]) => {
                const match = all.find(
                    t => t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
                );
                setToken(match ?? null);
            })
            .catch(() => setToken(null))
            .finally(() => setIsLoadingToken(false));
    }, [tokenAddress, API]);

    // Check approval needs
    useEffect(() => {
        if (mode === 'sell' && allowance !== undefined && amount && !isLoadingAllowance) {
            try {
                const parsedAmount = ethers.parseEther(amount);
                setNeedsApproval(allowance < parsedAmount);
            } catch {
                setNeedsApproval(false);
            }
        } else {
            setNeedsApproval(false);
        }
    }, [allowance, amount, isLoadingAllowance, mode]);

    // Handle transaction errors
    useEffect(() => {
        if (error) {
            setIsProcessingTxn(false);
        }
    }, [error]);

    // Reset processing state
    useEffect(() => {
        if (!txHash) {
            setIsProcessingTxn(false);
        }
    }, [txHash]);

    // Handle transaction confirmation
    useEffect(() => {
        if (isConfirmed && txHash) {
            refetchInfoData();
            refetchLatestETHPrice();
            refetchAmountOut();
            refetchBalance();
            refetchAllowance();
            setIsProcessingTxn(false);

            // Immediate chart update after successful transaction
            if (lastTxnType === "buy" || lastTxnType === "sell") {
                console.log('Transaction confirmed, updating chart immediately');
                // Small delay to ensure backend has processed the transaction
                setTimeout(() => {
                    loadChartData(true);
                }, 2000);
            }


            if (lastTxnType === "addToWhitelist") {
                setWhitelistAddresses('');
            }
        }
    }, [isConfirmed, txHash, lastTxnType, loadChartData, refetchInfoData, refetchAmountOut, refetchBalance, refetchAllowance, refetchLatestETHPrice, lastTxnType]);

    // Log transactions
    useEffect(() => {
        if (isConfirmed && result && tokenAddress && (lastTxnType === "buy" || lastTxnType === "sell")) {
            (async () => {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const block = await provider.getBlock(result.blockNumber);

                    let timestamp = "";
                    if (block?.timestamp) {
                        timestamp = new Date(block.timestamp * 1000).toISOString();
                    }

                    const type = lastTxnType;
                    const inputAmountStr = type === 'buy'
                        ? ethers.formatEther(ethValue)
                        : ethers.formatEther(tokenValue);

                    const outputAmountStr = amountOut
                        ? (Number(amountOut.toString()) / 1e18).toString()
                        : '0';

                    const body = {
                        tokenAddress,
                        type,
                        ethAmount: type === 'buy' ? inputAmountStr : outputAmountStr,
                        tokenAmount: type === 'buy' ? outputAmountStr : inputAmountStr,
                        timestamp,
                        txnHash: txHash,
                        wallet: result.from,
                    };

                    const response = await fetch(`${API}/api/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    });
                    if (!response.ok) {
                        if (response.status === 409) {
                            console.warn('Transaction already logged; skipping duplicate.');
                        } else {
                            console.error('Error logging transaction:', response.status, await response.text());
                        }
                    }
                } catch (error) {
                    console.error('Error logging transaction:', error);
                }
            })();
        }
    }, [isConfirmed, lastTxnType, tokenAddress, txHash, ethValue, tokenValue, API, amountOut, result]);

    // Enhanced fetchLogs with callback for chart update
    const fetchLogsWithCallback = useCallback(async () => {
        if (!tokenAddress) return;

        try {
            const response = await fetch(`${API}/api/transactions/${tokenAddress}`);
            const all: TxLog[] = await response.json();
            const filtered = all.filter(tx => tx.type === 'buy' || tx.type === 'sell');

            // Check if we have new transactions
            const hasNewTransactions = filtered.length > txLogs.length;
            setTxLogs(filtered);

            // If we have new transactions and auto-update is enabled, refresh chart
            if (hasNewTransactions && isAutoUpdateEnabled && filtered.length > 0) {
                console.log('New transactions detected, updating chart');
                setTimeout(() => loadChartData(true), 1000);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    }, [tokenAddress, API, txLogs.length, isAutoUpdateEnabled, loadChartData]);


    // Replace the existing fetchLogs effect
    useEffect(() => {
        fetchLogsWithCallback();

        // Set up periodic log fetching to catch external transactions
        const logInterval = setInterval(fetchLogsWithCallback, 15000); // Check every 15 seconds

        return () => clearInterval(logInterval);
    }, [fetchLogsWithCallback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);


    // Volume calculations
    const now = Date.now();
    const startOfToday = getStartOfCurrentDay();
    const logs1d = txLogs.filter(tx => new Date(tx.timestamp).getTime() >= startOfToday);
    const logs7d = txLogs.filter(tx => new Date(tx.timestamp).getTime() >= now - 7 * 24 * 60 * 60 * 1000);

    const sumVolume = (logs: TxLog[]) => logs.reduce((sum, tx) => sum + parseFloat(tx.ethAmount), 0);
    const volume1dEth = sumVolume(logs1d);
    const volume7dEth = sumVolume(logs7d);
    const volumeAllEth = sumVolume(txLogs);

    const volume1dUsd = volume1dEth * infoETHCurrentPrice;
    const volume7dUsd = volume7dEth * infoETHCurrentPrice;
    const volumeAllUsd = volumeAllEth * infoETHCurrentPrice;

    // const totals = txLogs.reduce((acc, tx) => {
    //     acc.totalEthSpent += parseFloat(tx.ethAmount);
    //     acc.totalTokensTraded += parseFloat(tx.tokenAmount);
    //     return acc;
    // }, { totalEthSpent: 0, totalTokensTraded: 0 });

    // Event handlers
    const handleMode = useCallback((m: 'buy' | 'sell') => {
        setMode(m);
        setAmount('');
        setErrorMsg('');
    }, []);

    const handleMaxClick = useCallback(() => {
        if (mode === 'sell' && getBalance) {
            const maxAmount = ethers.formatEther(getBalance.toString());
            setAmount(maxAmount);
        }
    }, [mode, getBalance]);

    const validateWhitelistAddresses = useCallback((addresses: string): string[] | null => {
        const addressList = addresses
            .split(',')
            .map(addr => addr.trim())
            .filter(addr => addr.length > 0);

        if (addressList.length === 0) return null;

        const invalidAddresses = addressList.filter(addr => !isValidEthereumAddress(addr));
        if (invalidAddresses.length > 0) {
            setErrorMsg(`Invalid Ethereum addresses: ${invalidAddresses.join(', ')}`);
            return null;
        }

        return addressList;
    }, []);

    // Contract interaction handlers
    const handleApprove = useCallback(() => {
        if (!tokenAddress || isLoadingAllowance || isConfirming || mode !== 'sell' || !amount) {
            setErrorMsg("Invalid approval request");
            return;
        }

        setErrorMsg("");
        setLastTxnType("approval");

        writeContract({
            ...TOKEN_ABI,
            functionName: "approve",
            address: tokenAddress,
            args: [SAFU_LAUNCHER_CA as `0x${string}`, tokenValue],
        });
        setIsProcessingTxn(true);
    }, [isLoadingAllowance, isConfirming, amount, tokenValue, writeContract, tokenAddress, mode]);

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (!tokenAddress || isConfirming) return;

        setErrorMsg("");
        setLastTxnType(mode);

        writeContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: mode,
            args: mode === 'sell' ? [tokenAddress, tokenValue] : [tokenAddress],
            value: mode === 'buy' ? ethValue : undefined,
        });
        setIsProcessingTxn(true);
    }, [isConfirming, writeContract, tokenAddress, mode, tokenValue, ethValue]);

    const handleSellProcess = useCallback(() => {
        if (needsApproval) {
            handleApprove();
        } else {
            handleSubmit({ preventDefault: () => { } } as FormEvent);
        }
    }, [needsApproval, handleApprove, handleSubmit]);

    // Admin handlers
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
    }, [writeContract, tokenAddress, isTokenCreator]);

    const handleAddToWhitelist = useCallback(() => {
        if (!tokenAddress || !isTokenCreator || !whitelistAddresses.trim()) {
            setErrorMsg("Please enter valid addresses to whitelist");
            return;
        }

        const addresses = validateWhitelistAddresses(whitelistAddresses);
        if (!addresses) return;

        setErrorMsg("");
        setLastTxnType("addToWhitelist");

        writeContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: 'addToWhitelist',
            args: [tokenAddress as `0x${string}`, addresses as `0x${string}`[]]
        });
        setIsProcessingTxn(true);
    }, [writeContract, tokenAddress, isTokenCreator, whitelistAddresses, validateWhitelistAddresses]);

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
    }, [writeContract, tokenAddress, isTokenCreator]);

    const handleButtonClick = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (mode === 'buy') {
            handleSubmit(e);
        } else {
            handleSellProcess();
        }
    }, [mode, handleSubmit, handleSellProcess]);

    // UI helper functions
    const getButtonText = () => {
        if (isWritePending) return 'Confirming...';
        if (isConfirming) return 'Processing...';
        return mode === 'buy' ? 'Buy' : (needsApproval ? 'Approve' : 'Sell');
    };

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

    // Loading state
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

    return (
        <div className="container">
            <h1>Trade • {token.name} ({token.symbol})</h1>

            <div className="token-info">
                <p>Token Price: {tokenPriceUSD > 0 ? `$${tokenPriceUSD}` : 'Calculating...'}</p>
                <p>Token supply: {formatTokenAmount(tokenSupply / 1e18)}</p>
                <p>Market Cap: {marketCapUSD > 0 ? `$${formatTokenAmount(marketCapUSD)}` : 'Calculating...'}</p>
                <p>Trading started: {isStartTrading ? 'Yes' : 'No'}</p>
                <p>Whitelist ongoing: {isWhiteListOngoing ? 'Yes' : 'No'}</p>
                <p>Listed on Uniswap: {isListed ? 'Yes' : 'No'}</p>
            </div>

            <div className="tx-summary">
                <p>Volume (Today): {volume1dEth.toFixed(4)} ETH (${volume1dUsd.toLocaleString()})</p>
                <p>Volume (7d): {volume7dEth.toFixed(4)} ETH (${volume7dUsd.toLocaleString()})</p>
                <p>Volume (All Time): {volumeAllEth.toFixed(4)} ETH (${volumeAllUsd.toLocaleString()})</p>
            </div>

            {/* Admin Panel */}
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
                <div className="chart-header">
                    <h3>Price Chart</h3>
                    <div className="chart-controls">
                        <TimeframeSelector
                            selectedTimeframe={selectedTimeframe}
                            onTimeframeChange={handleTimeframeChange}
                            disabled={isLoadingChart}
                        />
                        <button
                            className={`auto-update-toggle ${isAutoUpdateEnabled ? 'active' : ''}`}
                            onClick={toggleAutoUpdate}
                            title={isAutoUpdateEnabled ? 'Disable auto-update' : 'Enable auto-update'}
                        >
                            {isAutoUpdateEnabled ? '🔄 Auto' : '⏸️ Manual'}
                        </button>
                        <div className="last-update">
                            Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    {isLoadingChart ? (
                        <div className="chart-loading">
                            <div className="spinner"></div>
                            <p>Loading chart data...</p>
                        </div>
                    ) : (
                        <LightweightChart
                            data={ohlc}
                            timeframe={selectedTimeframe.resolution}
                            height={500}
                            ethToUsdRate={infoETHCurrentPrice}
                            totalSupply={tokenSupply / 1e18}
                            symbol={token.symbol}
                        />
                    )}

                    {/* Auto-update indicator */}
                    {isAutoUpdateEnabled && (
                        <div className="auto-update-indicator">
                            <span className="pulse-dot"></span>
                            Live
                        </div>
                    )}
                </div>

                <div className="trade-widget">
                    <div className="action-toggle">
                        <button
                            className={mode === 'buy' ? 'active' : ''}
                            onClick={() => handleMode('buy')}
                            disabled={isTransactionPending}
                        >
                            Buy
                        </button>
                        <button
                            className={mode === 'sell' ? 'active' : ''}
                            onClick={() => handleMode('sell')}
                            disabled={isTransactionPending}
                        >
                            Sell
                        </button>
                    </div>

                    {mode === 'sell' && (
                        <div className="balance-display">
                            Balance: {isLoadingBalance ? (
                                <span className="loading-text">Loading...</span>
                            ) : (
                                `${formatTokenAmount(tokenBalance)} ${token.symbol}`
                            )}
                        </div>
                    )}

                    <form className="trade-form" onSubmit={handleButtonClick}>
                        <label htmlFor="amount-input">
                            Amount ({mode === 'buy' ? 'ETH' : token.symbol})
                        </label>
                        <div className="input-container">
                            <input
                                id="amount-input"
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
                            {isLoadingAmountOutSelect ? (
                                <span className="loading-text">Calculating...</span>
                            ) : (
                                <>
                                    You will receive {
                                        amountOutSelect
                                            ? formatTokenAmount(Number(amountOutSelect.toString()) / 1e18, mode === 'sell' ? 8 : 2)
                                            : '0'
                                    } {mode === 'buy' ? token.symbol : 'ETH'}
                                </>
                            )}
                        </div>

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

                    {/* Transaction Status Messages */}
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
    );
}