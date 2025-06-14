import { useEffect, useState } from 'react';

interface TxLog {
    tokenAddress: string;
    type: 'buy' | 'sell';
    ethAmount: string;
    tokenAmount: string;
    timestamp: string;
    txnHash: string;
    wallet: string;
}

interface TokenMetadata {
    name: string;
    symbol: string;
    tokenAddress: string;
    logoFilename?: string;
}

interface LeaderboardEntry {
    wallet: string;
    volume: number;
    lastTokenAddress: string;
    lastPurchaseTs: string;
}

const ITEMS_PER_PAGE = 25;

export default function Leaderboard() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [tokensMap, setTokensMap] = useState<Record<string, TokenMetadata>>({});
    const [page, setPage] = useState(1);

    const API = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        // Fetch token metadata map
        async function loadTokens() {
            const res = await fetch(`${API}/api/tokens`);
            const tokens: TokenMetadata[] = await res.json();
            const map: Record<string, TokenMetadata> = {};
            tokens.forEach(t => { map[t.tokenAddress.toLowerCase()] = t; });
            setTokensMap(map);
        }

        // Fetch all transactions and build leaderboard
        async function loadLeaderboard() {
            const res = await fetch(`${API}/api/transactions`);
            const allTx: TxLog[] = await res.json();

            const map: Record<string, { volume: number; lastTs: string; lastToken: string }> = {};
            allTx.forEach(tx => {
                if (tx.type !== 'buy') return;
                const vol = parseFloat(tx.ethAmount);
                const key = tx.wallet.toLowerCase();
                const existing = map[key] || { volume: 0, lastTs: '', lastToken: '' };
                existing.volume += vol;
                if (!existing.lastTs || new Date(tx.timestamp) > new Date(existing.lastTs)) {
                    existing.lastTs = tx.timestamp;
                    existing.lastToken = tx.tokenAddress.toLowerCase();
                }
                map[key] = existing;
            });

            const arr = Object.entries(map)
                .map(([wallet, { volume, lastTs, lastToken }]) => ({
                    wallet,
                    volume,
                    lastTokenAddress: lastToken,
                    lastPurchaseTs: lastTs,
                }))
                .sort((a, b) => b.volume - a.volume);

            setEntries(arr);
        }

        loadTokens().catch(console.error);
        loadLeaderboard().catch(console.error);
    }, []);

    const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
    const display = entries.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    function formatUTC(iso: string) {
        return new Date(iso).toLocaleString('en-GB', {
            timeZone: 'UTC',
            hour12: true,
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: 'numeric', minute: '2-digit', second: '2-digit',
        });
    }

    return (
        <div className="container">
            <h1>Leaderboard</h1>
            <div className="leaderboard-wrapper">
                <table className="leaderboard">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Wallet</th>
                            <th>Volume (ETH)</th>
                            <th>Last Purchase</th>
                        </tr>
                    </thead>
                    <tbody>
                        {display.map((entry, idx) => {
                            const tokenMeta = tokensMap[entry.lastTokenAddress];
                            return (
                                <tr key={entry.wallet}>
                                    <td>{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                    <td>
                                        <a href="#" className="wallet-link" data-wallet={entry.wallet}>
                                            {entry.wallet}
                                        </a>
                                    </td>
                                    <td>{entry.volume.toFixed(4)}</td>
                                    <td>
                                        {tokenMeta ? (
                                            <div className="token-cell">
                                                {tokenMeta.logoFilename && (
                                                    <img
                                                        src={`${API}/uploads/${tokenMeta.logoFilename}`}
                                                        alt={tokenMeta.symbol}
                                                    />
                                                )}
                                                <div className="token-info">
                                                    <span className="token-name">{tokenMeta.name}</span>
                                                    <span className="token-ticker">({tokenMeta.symbol})</span>
                                                </div>
                                                <div className="purchase-time">
                                                    <small>at {formatUTC(entry.lastPurchaseTs)}</small>
                                                </div>
                                            </div>
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            className={i + 1 === page ? 'active' : ''}
                            onClick={() => setPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
