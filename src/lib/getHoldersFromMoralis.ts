import Moralis from "moralis";

export async function getHoldersFromMoralis(
  tokenAddress: string
): Promise<number> {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({ apiKey: import.meta.env.VITE_MORALIS_API_KEY });
    }

    const response = await Moralis.EvmApi.token.getTokenOwners({
      chain: "0xaa36a7", // Sepolia
      order: "DESC",
      tokenAddress,
    });

    const holders = response.raw().result;
    return holders.length;
  } catch (error) {
    console.error(
      "Failed to fetch holders from Moralis for",
      tokenAddress,
      error
    );
    return 0; // fallback
  }
}
