// src/pages/Tokens.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import { pureInfoDataRaw } from '../web3/readContracts';

interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
    createdAt?: string;  // Optional, can be used to store creation timestamp
    volume24h?: number; // Optional, can be used to store 24h volume
}

export default function Tokens() {
    const [tokens, setTokens] = useState<TokenMetadata[]>([]);
    const [curveProgressMap, setCurveProgressMap] = useState<Record<string, number>>({});


    useEffect(() => {
        async function fetchCurveData() {
            const curveMap: Record<string, number> = {};
            for (const token of tokens) {
                const data = await pureInfoDataRaw(token.tokenAddress);
                if (Array.isArray(data)) {
                    const tokenSupply = Number(data[7]);
                    const tokenSold = Number(data[10]);
                    const curvePercent = (tokenSold / (0.75 * tokenSupply)) * 100;
                    const clamped = Math.min(Math.max(curvePercent, 0), 100);
                    curveMap[token.tokenAddress] = clamped;
                }
            }
            setCurveProgressMap(curveMap);
        }

        if (tokens.length > 0) {
            fetchCurveData();
        }
    }, [tokens]);

    // const isStartTrading = infoData ? Number(infoData[1]) : 0;
    // const isListed = infoData ? Number(infoData[2]) : 0;
    // const isWhiteListOngoing = infoData ? Number(infoData[3]) : 0;



    const API = `https://safulauncher-production.up.railway.app`;
    useEffect(() => {
        fetch(`${API}/api/tokens`)
            .then(res => res.json())
            .then((data: TokenMetadata[]) => setTokens(data));
    }, []);

    return (
        <div>
            <h2>Launched Tokens</h2>
            {tokens.length === 0 ? (<p>No tokens yet.</p>) : (
                <ul>
                    {tokens.map((t, i) => (
                        <li key={i} style={{ margin: '1rem 0', border: '1px solid #ddd', padding: '1rem' }}>
                            <Link to={`/trade/${t.tokenAddress}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {t.logoFilename && (
                                    <img
                                        src={`${API}/uploads/${t.logoFilename}`}
                                        width={64}
                                        alt={`${t.symbol} logo`}
                                    />
                                )}
                                <h3>{t.name} ({t.symbol})</h3>
                                <p>Address: {t.tokenAddress}</p>
                                {t.website && <p>Website: <a href={t.website}>{t.website}</a></p>}
                                {t.description && <p>{t.description}</p>}
                                <p>Token Creator: {t.tokenCreator}</p>
                                <p>Created At: {t.createdAt}</p>
                                <p>Volume 24 hrs: {t.volume24h}</p>
                            </Link>
                            <p>Bonding Curve Progress: {curveProgressMap[t.tokenAddress]?.toFixed(2) ?? '0'}%</p>
                            <div style={{ background: '#eee', borderRadius: 4, overflow: 'hidden', height: 10, marginTop: 8 }}>
                                <div style={{
                                    width: `${curveProgressMap[t.tokenAddress] || 0}%`,
                                    background: '#4caf50',
                                    height: '100%'
                                }} />
                            </div>
                        </li>
                    ))}


                </ul>
            )}
        </div>
    );
}