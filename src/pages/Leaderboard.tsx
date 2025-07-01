import { useEffect, useState } from "react";
import { base } from "../lib/api";

/**
 * Description placeholder
 *
 * @interface TxLog
 * @typedef {TxLog}
 */
interface TxLog {
  /**
   * Description placeholder
   *
   * @type {string}
   */
  tokenAddress: string;
  /**
   * Description placeholder
   *
   * @type {('buy' | 'sell')}
   */
  type: "buy" | "sell";
  /**
   * Description placeholder
   *
   * @type {string}
   */
  ethAmount: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  tokenAmount: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  timestamp: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  txnHash: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  wallet: string;
}

/**
 * Description placeholder
 *
 * @interface TokenMetadata
 * @typedef {TokenMetadata}
 */
interface TokenMetadata {
  /**
   * Description placeholder
   *
   * @type {string}
   */
  name: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  symbol: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  tokenAddress: string;
  /**
   * Description placeholder
   *
   * @type {?string}
   */
  tokenImageId?: string;
  image: {
    id: string;
    mimetype: string;
    name: string;
    path: string;
    size: string | number;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Description placeholder
 *
 * @interface LeaderboardEntry
 * @typedef {LeaderboardEntry}
 */
interface LeaderboardEntry {
  /**
   * Description placeholder
   *
   * @type {string}
   */
  wallet: string;
  /**
   * Description placeholder
   *
   * @type {number}
   */
  volume: number;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  lastTokenAddress: string;
  /**
   * Description placeholder
   *
   * @type {string}
   */
  lastPurchaseTs: string;
}

/**
 * Description placeholder
 *
 * @type {25}
 */
const ITEMS_PER_PAGE = 25;

/**
 * Description placeholder
 *
 * @export
 * @returns {*}
 */
export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tokensMap, setTokensMap] = useState<Record<string, TokenMetadata>>({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Fetch token metadata map
    async function loadTokens() {
      const res = await base.get("token/get-many?include=image");
      const tokens: TokenMetadata[] = await res.data.data.data;
      const map: Record<string, TokenMetadata> = {};
      tokens.forEach((t) => {
        map[t.tokenAddress.toLowerCase()] = t;
      });
      setTokensMap(map);
    }

    // Fetch all transactions and build leaderboard
    async function loadLeaderboard() {
      const res = await base.get("transaction/get-many");
      const allTx: TxLog[] = await res.data.data.data;

      const map: Record<
        string,
        { volume: number; lastTs: string; lastToken: string }
      > = {};
      allTx.forEach((tx) => {
        if (tx.type !== "buy") return;
        const vol = parseFloat(tx.ethAmount);
        const key = tx.wallet.toLowerCase();
        const existing = map[key] || { volume: 0, lastTs: "", lastToken: "" };
        existing.volume += vol;
        if (
          !existing.lastTs ||
          new Date(tx.timestamp) > new Date(existing.lastTs)
        ) {
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
  const display = entries.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  function formatUTC(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "UTC",
      hour12: true,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
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
                    <a
                      href="#"
                      className="wallet-link"
                      data-wallet={entry.wallet}
                    >
                      {entry.wallet}
                    </a>
                  </td>
                  <td>{entry.volume.toFixed(4)}</td>
                  <td>
                    {tokenMeta ? (
                      <div className="token-cell">
                        {tokenMeta.tokenImageId && (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}token/${
                              tokenMeta.image.path
                            }`}
                            alt={tokenMeta.symbol}
                            crossOrigin="anonymous"
                            width={20}
                          />
                        )}
                        <div className="token-info">
                          <span className="token-name">{tokenMeta.name}</span>
                          <span className="token-ticker">
                            ({tokenMeta.symbol})
                          </span>
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
              className={i + 1 === page ? "active" : ""}
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
