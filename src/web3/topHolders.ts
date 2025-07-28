const apiKey = import.meta.env.VITE_MORALIS_API_KEY;

import Moralis from "moralis";

export async function addMain() {
  try {
    await Moralis.start({
      apiKey: apiKey,
    });

    const response = await Moralis.EvmApi.token.getTokenOwners({
      chain: "0xaa36a7",
      order: "DESC",
      tokenAddress: "0xA8aA7671563F04841A40270a0764fF0fCfE8019a",
    });

    console.log(response.raw());
  } catch (e) {
    console.error(e);
  }
}

addMain().catch(console.error);
