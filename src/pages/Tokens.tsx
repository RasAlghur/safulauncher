// safu-dapp/src/pages/Tokens.tsx
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import { pureInfoDataRaw, pureGetLatestETHPrice, pureAmountOutMarketCap } from '../web3/readContracts';
import { ETH_USDT_PRICE_FEED } from '../web3/config';

interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
    createdAt?: string;
    expiresAt?: string;
}

export default function Tokens() {
    const [tokens, setTokens] = useState<TokenMetadata[]>([]);
    const [curveProgressMap, setCurveProgressMap] = useState<Record<string, number>>({});
    const [marketCapMap, setMarketCapMap] = useState<Record<string, number>>({});
    const [volume24hMap, setVolume24hMap] = useState<Record<string, number>>({});
    const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);

    // Filter & sort state
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchField, setSearchField] = useState<'all' | 'address' | 'creator' | 'name'>('all');
    const [sortField, setSortField] = useState<'volume' | 'createdAt' | 'progress'>('volume');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const API = import.meta.env.VITE_API_BASE_URL;

    // Fetch list of tokens
    useEffect(() => {
        fetch(`${API}/api/tokens`)
            .then(res => res.json())
            .then((data: TokenMetadata[]) => setTokens(data))
            .catch(console.error);
    }, []);

    // Fetch on-chain and API data for each token when list updates
    useEffect(() => {
        if (tokens.length === 0) return;

        async function fetchTokenMetrics() {
            // Get ETH price
            try {
                const raw = await pureGetLatestETHPrice(ETH_USDT_PRICE_FEED!);
                const price = (typeof raw === 'number' ? raw : Number(raw)) / 1e8;
                setEthPriceUSD(price);
            } catch {
                console.error('Failed to fetch ETH price');
            }

            const newCurve: Record<string, number> = {};
            const newMarketCap: Record<string, number> = {};
            const newVolume: Record<string, number> = {};
            const now = Date.now();
            const since24h = now - 24 * 60 * 60 * 1000;

            await Promise.all(tokens.map(async token => {
                try {
                    // Fetch bonding curve data
                    const info = await pureInfoDataRaw(token.tokenAddress);
                    if (Array.isArray(info)) {
                        const supply = Number(info[7]);
                        const sold = Number(info[10]);
                        const percent = (sold / (0.75 * supply)) * 100;
                        newCurve[token.tokenAddress] = Math.min(Math.max(percent, 0), 100);

                        // Price per token in ETH
                        const rawAmt = await pureAmountOutMarketCap(token.tokenAddress);
                        const pricePerToken = rawAmt ? Number(rawAmt.toString()) / 1e18 : 0;
                        // Market cap USD
                        newMarketCap[token.tokenAddress] = pricePerToken * (supply / 1e18) * ethPriceUSD;
                    }

                    // Fetch transaction logs
                    const res = await fetch(`${API}/api/transactions/${token.tokenAddress}`);
                    const logs: { ethAmount: string; timestamp: string }[] = await res.json();
                    const volEth = logs
                        .filter(tx => new Date(tx.timestamp).getTime() >= since24h)
                        .reduce((sum, tx) => sum + parseFloat(tx.ethAmount), 0);
                    newVolume[token.tokenAddress] = volEth * ethPriceUSD;
                } catch (e) {
                    console.error(`Error for ${token.tokenAddress}:`, e);
                }
            }));

            setCurveProgressMap(newCurve);
            setMarketCapMap(newMarketCap);
            setVolume24hMap(newVolume);
        }

        fetchTokenMetrics();
    }, [tokens, ethPriceUSD]);

    // Filter tokens based on search state
    const filtered = tokens.filter(token => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        switch (searchField) {
            case 'address': return token.tokenAddress.toLowerCase().includes(term);
            case 'creator': return token.tokenCreator.toLowerCase().includes(term);
            case 'name':
                return token.name.toLowerCase().includes(term) || token.symbol.toLowerCase().includes(term);
            case 'all':
            default:
                return [token.tokenAddress, token.tokenCreator, token.name, token.symbol]
                    .some(field => field.toLowerCase().includes(term));
        }
    });

    // Sort filtered tokens
    const sortedTokens = [...filtered].sort((a, b) => {
        let aVal: number | Date = 0;
        let bVal: number | Date = 0;
        if (sortField === 'volume') {
            aVal = volume24hMap[a.tokenAddress] || 0;
            bVal = volume24hMap[b.tokenAddress] || 0;
        } else if (sortField === 'progress') {
            aVal = curveProgressMap[a.tokenAddress] || 0;
            bVal = curveProgressMap[b.tokenAddress] || 0;
        } else if (sortField === 'createdAt') {
            aVal = a.createdAt ? new Date(a.createdAt) : new Date(0);
            bVal = b.createdAt ? new Date(b.createdAt) : new Date(0);
        }
        if (aVal instanceof Date && bVal instanceof Date) {
            return sortOrder === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
        }
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return (
        <div className="tokens-list">
            <h2>Launched Tokens</h2>

            {/* Search & Sort Controls */}
            <div className="controls" style={{ marginBottom: '1em', display: 'flex', gap: '1em' }}>
                <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
                <select value={searchField} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSearchField(e.target.value as any)}>
                    <option value="all">All</option>
                    <option value="address">Address</option>
                    <option value="creator">Creator</option>
                    <option value="name">Name/Symbol</option>
                </select>
                <select value={sortField} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortField(e.target.value as any)}>
                    <option value="volume">24h Volume (USD)</option>
                    <option value="progress">Curve Progress</option>
                    <option value="createdAt">Date Created</option>
                </select>
                <select value={sortOrder} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value as any)}>
                    <option value="desc">High → Low / New → Old</option>
                    <option value="asc">Low → High / Old → New</option>
                </select>
            </div>

            {sortedTokens.length === 0 ? (
                <p>No tokens found.</p>
            ) : (
                <ul>
                    {sortedTokens.map((t, idx) => (
                        <li key={idx} className="token-item">
                            <Link to={`/trade/${t.tokenAddress}`} className="token-link">
                                {t.logoFilename && <img src={`${API}/uploads/${t.logoFilename}`} width={64} alt={`${t.symbol} logo`} />}
                                <div className="token-info">
                                    <h3>{t.name} ({t.symbol})</h3>
                                    <p>Address: {t.tokenAddress}</p>
                                    {t.website && <p>Website: <a href={t.website}>{t.website}</a></p>}
                                    {t.description && <p>{t.description}</p>}
                                    <p>Creator: {t.tokenCreator}</p>
                                    {t.createdAt && <p>Created At: {t.createdAt}</p>}
                                </div>
                            </Link>
                            <div className="token-stats">
                                <p>24h Volume (USD): ${volume24hMap[t.tokenAddress]?.toFixed(2) ?? '0.00'}</p>
                                <p>Market Cap (USD): ${marketCapMap[t.tokenAddress]?.toFixed(2) ?? '0.00'}</p>
                                <p>Bonding Curve Progress: {curveProgressMap[t.tokenAddress]?.toFixed(2) ?? '0'}%</p>
                                <div className="progress-bar">
                                    <div style={{ background: '#eee', borderRadius: 4, overflow: 'hidden', height: 10, marginTop: 8 }}>
                                        <div style={{ width: `${curveProgressMap[t.tokenAddress] || 0}%`, background: '#4caf50', height: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
