// src/pages/Trade.tsx

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
    useAccount,
    useWriteContract,
    useReadContract,
    useWaitForTransactionReceipt,
} from 'wagmi';
import { SAFU_LAUNCHER_CA, LAUNCHER_ABI, TOKEN_ABI } from '../web3/config';
import { ethers } from 'ethers';
import '../App.css';

interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
}

export default function Trade() {
    const { address } = useAccount();
    const { tokenAddress } = useParams<{ tokenAddress: `0x${string}` }>();
    const [token, setToken] = useState<TokenMetadata | null>(null);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [amount, setAmount] = useState<string>('');
    const [isLoadingToken, setIsLoadingToken] = useState(true);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isProcessingTxn, setIsProcessingTxn] = useState(false);

    // Admin function states
    const [whitelistAddresses, setWhitelistAddresses] = useState<string>('');
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    // Track the type of the last transaction: 'approval', 'sell', or admin functions
    const [lastTxnType, setLastTxnType] = useState<"approval" | "sell" | "startTrading" | "addToWhitelist" | "disableWhitelist" | null>(
        null
    );

    // Check if current user is the token creator
    const isTokenCreator = address && token && address.toLowerCase() === token.tokenCreator.toLowerCase();

    // Wagmi hooks
    const { data: txHash, writeContract, isPending: isWritePending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
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
    }, [writeContract, tokenAddress, isTokenCreator]);

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
    }, [writeContract, tokenAddress, isTokenCreator, whitelistAddresses]);

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
    }, [writeContract, tokenAddress, isTokenCreator]);

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

    // Explicitly type infoData as an array of unknowns (or the correct type if known)
    const infoData = infoDataRaw as unknown[] | undefined;

    const tokenSupply = infoData ? Number(infoData[7]) : 0;
    const tokenSold = infoData ? Number(infoData[10]) : 0;
    const isStartTrading = infoData ? Number(infoData[1]) : 0;
    const isListed = infoData ? Number(infoData[2]) : 0;

    const curvePercent = infoData
        ? (Number(tokenSold) / (0.75 * Number(tokenSupply))) * 100
        : 0;

    // Check if transaction is in progress
    const isTransactionPending = isWritePending || isConfirming;

    // Convert balance to readable format
    const tokenBalance = getBalance ? ethers.formatEther(getBalance.toString()) : '0';

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

        // Mark this txn as a sell txn.
        setLastTxnType("sell");
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
    }, [isConfirming, writeContract, tokenAddress, mode, tokenValue, ethValue]);

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
    }, [isConfirmed, txHash, refetchInfoData, refetchAmountOut, refetchBalance, refetchAllowance, lastTxnType]);

    const API = `https://safulauncher-production.up.railway.app`;

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
                <p>Trade trading start: {isStartTrading}</p>
                <p>Trade is listed on uniswap: {isListed}</p>

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
                                        disabled={isTransactionPending || isStartTrading === 1}
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
                                            disabled={isTransactionPending}
                                        />
                                        <button
                                            className="admin-btn add-whitelist"
                                            onClick={handleAddToWhitelist}
                                            disabled={isTransactionPending || !whitelistAddresses.trim()}
                                        >
                                            Add to Whitelist
                                        </button>
                                    </div>
                                    <button
                                        className="admin-btn disable-whitelist"
                                        onClick={handleDisableWhitelist}
                                        disabled={isTransactionPending}
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
                        <div className="volume">24 h Volume: TODO</div>
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
                                        You will receive {amountOut && mode === 'buy' ? (Number(amountOut.toString()) / 1e18).toLocaleString() : amountOut && mode === 'sell' ? (Number(amountOut.toString()) / 1e18).toFixed(8) : 0} {mode === 'buy' ? token.symbol : 'ETH'}
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
                                            ? "Sell confirmed!"
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
                            `${curvePercent.toFixed(0)}%`
                        )}
                    </div>
                    <div className="progress">
                        <div
                            className={`progress-bar ${isLoadingInfoData ? 'loading' : ''}`}
                            style={{ width: isLoadingInfoData ? '0%' : `${curvePercent}%` }}
                        />
                        {isLoadingInfoData && <div className="progress-loading"></div>}
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
                                    <th>Date / Time</th>
                                </tr>
                            </thead>
                            <tbody id="txBody">
                                {/* TODO: map transactions */}
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