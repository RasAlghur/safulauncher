// src/pages/Tokens.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
}

export default function Tokens() {
    const [tokens, setTokens] = useState<TokenMetadata[]>([]);

    useEffect(() => {
        fetch('/api/tokens')
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
                                {t.logoFilename && <img src={`/uploads/${t.logoFilename}`} width={64} alt="logo" />}
                                <h3>{t.name} ({t.symbol})</h3>
                                <p>Address: {t.tokenAddress}</p>
                                {t.website && <p>Website: <a href={t.website}>{t.website}</a></p>}
                                {t.description && <p>{t.description}</p>}
                                <p>Token Creator: {t.tokenCreator}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}