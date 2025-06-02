import React, { useEffect, useState, useCallback, type FormEvent } from 'react';
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
    const {address} = useAccount();
    const { tokenAddress } = useParams<{ tokenAddress: `0x${string}` }>();
    const [token, setToken] = useState<TokenMetadata | null>(null);
    const [mode, setMode] = useState<'buy' | 'sell'>('buy');
    const [amount, setAmount] = useState<string>('');
    const [isLoadingToken, setIsLoadingToken] = useState(true);

    // Wagmi hooks
    const { data: txHash, writeContract, isPending: isWritePending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash: txHash });

    // Compute parsed values
    const ethValue = ethers.parseEther(mode === 'buy' ? amount || '0' : '0');
    const tokenValue = ethers.parseEther(mode === 'sell' ? amount || '0' : '0');

    const { data: getBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract(
        tokenAddress && address
            ? {
                ...TOKEN_ABI,
                address: tokenAddress,
                functionName: 'balanceOf',
                args: [address as `0x${string}`]
            }
            : undefined
    );
    
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
    };

    const handleMaxClick = useCallback(() => {
        if (mode === 'sell' && getBalance) {
            const maxAmount = ethers.formatEther(getBalance.toString());
            setAmount(maxAmount);
        }
    }, [mode, getBalance]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!tokenAddress) return;
        writeContract({
            ...LAUNCHER_ABI,
            address: SAFU_LAUNCHER_CA,
            functionName: mode,
            args: mode === 'sell'
                ? [tokenAddress, tokenValue]
                : [tokenAddress],
            value: mode === 'buy' ? ethValue : undefined,
        });
    };

    useEffect(() => {
        if (isConfirmed && txHash) {
            refetchInfoData();
            refetchAmountOut();
            refetchBalance();
        }
    }, [isConfirmed,
        txHash,
        refetchInfoData,
        refetchAmountOut,
        refetchBalance
    ])

    // Load token metadata
    useEffect(() => {
        setIsLoadingToken(true);
        fetch('/api/tokens')
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

    return (
        <>
            <div className="container">
                <h1>Trade • {token.name} ({token.symbol})</h1>
                <p>Token supply: {(tokenSupply / 1e18).toLocaleString()}</p>
                <p>Trade trading start: {isStartTrading}</p>
                <p>Trade is listed on uniswap: {isListed}</p>

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
                        
                        <form className="trade-form" onSubmit={handleSubmit}>
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
                                        You will receive {amountOut ? (Number(amountOut.toString()) / 1e18).toLocaleString() : '0'} {mode === 'buy' ? token.symbol : 'ETH'}
                                    </>
                                )}
                            </div>
                            <button
                                type="submit"
                                className={`submit ${isTransactionPending ? 'loading' : ''}`}
                                disabled={isTransactionPending || !amount || parseFloat(amount) <= 0}
                            >
                                {isWritePending ? 'Confirming...' :
                                    isConfirming ? 'Processing...' :
                                        'Confirm'}
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
                        {isConfirmed && (
                            <div className="status-message success">
                                Transaction confirmed successfully!
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