/* eslint-disable @typescript-eslint/no-explicit-any */
import Moralis from "moralis";

const CHAIN_HEX_MAP: Record<number, string> = {
  1: "0x1", // Mainnet
  56: "0x38", // BSC
  97: "0x61", // BSC Testnet
  11155111: "0xaa36a7", // Sepolia
  // add other supported chains here...
};

async function startMoralisIfNeeded(): Promise<void> {
  try {
    const apiKey = import.meta.env.VITE_MORALIS_API_KEY;
    if (!apiKey) {
      console.warn("VITE_MORALIS_API_KEY not set — Moralis calls will fail.");
      return;
    }

    // v2 exposes Core.isStarted
    if ((Moralis as any)?.Core) {
      if (!(Moralis as any).Core.isStarted) {
        await Moralis.start({ apiKey });
      }
    } else {
      // fallback to older startup checks (idempotent)
      if (!(Moralis as any).started) {
        await Moralis.start?.({ apiKey });
      }
    }
  } catch (err) {
    console.warn("Moralis.start() failed:", err);
  }
}

/**
 * Fetch holders count for a token using Moralis EvmApi.
 *
 * @param tokenAddress - token contract address (0x...)
 * @param chainId - numeric chainId
 * @param fetchAll - if true, will follow pagination cursors to fetch ALL owners (slower)
 * @param perPageLimit - per-request limit (Moralis supports up to 100 or more depending on plan; keep reasonable)
 * @returns number of holders (0 on error)
 */
export async function getHoldersFromMoralis(
  tokenAddress: string,
  chainId: number,
  fetchAll: boolean = false,
  perPageLimit: number = 100
): Promise<number> {
  try {
    // basic validation
    if (!tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      console.warn(
        "Invalid tokenAddress passed to getHoldersFromMoralis:",
        tokenAddress
      );
      return 0;
    }

    await startMoralisIfNeeded();

    // map chain id to Moralis chain hex string
    const chain = CHAIN_HEX_MAP[chainId] ?? `0x${chainId.toString(16)}`;
    if (!/^0x[0-9a-fA-F]+$/.test(chain)) {
      console.warn("Invalid chain hex for Moralis:", chain);
      return 0;
    }

    let totalCount = 0;
    let cursor: string | undefined = undefined;

    // loop at least once; follow Moralis cursor while fetchAll === true
    do {
      const params: any = {
        chain,
        tokenAddress,
        order: "DESC",
      };
      if (cursor) params.cursor = cursor;

      const response = await Moralis.EvmApi.token.getTokenOwners(params);

      // robustly read results
      const raw =
        typeof response?.raw === "function" ? response.raw() : response;
      const owners = Array.isArray(raw?.result)
        ? raw.result
        : raw?.result ?? [];

      totalCount += owners.length;

      // attempt to read the cursor for next page; only access from raw if present
      cursor =
        raw && typeof raw === "object" && "cursor" in raw
          ? (raw as { cursor?: string }).cursor
          : undefined;

      // break if not fetching all
      if (!fetchAll) break;

      // safety: stop if no cursor or fewer returned than requested
      if (!cursor || owners.length < perPageLimit) break;
    } while (fetchAll);

    return totalCount;
  } catch (error) {
    console.error(
      "Failed to fetch holders from Moralis for",
      tokenAddress,
      error
    );
    return 0;
  }
}
