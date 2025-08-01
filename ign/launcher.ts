
const LAUNCHER_ADDRESS_V1 = "0x9138a694C3B806e26a02554280805FdDeB46fF3F";
const LAUNCHER_ADDRESS_V2 = "0xF2aE04bC24ee9fa6f2ea3a2b5f7845809234BC01";

const launcherV1 = new ethers.Contract(LAUNCHER_ADDRESS_V1, launcherAbi, provider);
const launcherV2 = new ethers.Contract(LAUNCHER_ADDRESS_V2, launcherAbi, provider);
const priceFeed = new ethers.Contract(PRICE_FEED_ADDRESS, priceFeedAbi, provider);


async function handleTokenV1(tokenAddr, txHash, logBlock) {
    // 1. Get totalSupply & decimals
    const token = new ethers.Contract(tokenAddr, erc20Abi, provider);
    const [rawSupply, decimals] = await Promise.all([
        token.totalSupply(),
        token.decimals()
    ]);
    const supply = Number(ethers.formatUnits(rawSupply, decimals));

    let priceUSD;
    const rawTokenPerETH = await launcherV1.getAmountOut(tokenAddr, 1000000000000000000n, false);
    console.log("rawTokenPerETH", rawTokenPerETH)

    const tokenPerETH = Number(ethers.formatUnits(rawTokenPerETH, 18));
    console.log("tokenPerETH", tokenPerETH)
    const rawETHUSD = await priceFeed.getLatestETHPrice(PRICE_GETTER_CHAINLINK);
    console.log("rawETHUSD", rawETHUSD)
    const ethUsd = Number(ethers.formatUnits(rawETHUSD, 8));
    console.log("ethUsd", ethUsd)
    priceUSD = ethUsd * tokenPerETH;
    console.log("priceUSD", priceUSD)

    // 3. Compute market cap
    const marketCapUSD = supply * priceUSD;
    console.log("marketCapUSD", marketCapUSD);

    console.log(`↪ Token: ${tokenAddr}`);
    console.log(` • Block: ${logBlock}, Tx: ${txHash}`);
    console.log(`• Total Supply: ${supply.toLocaleString()}`);
    console.log(`  • Price USD: $${priceUSD.toFixed(4)}`);
    console.log(`  • Market Cap: $${marketCapUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
}

async function handleTokenV2(tokenAddr, txHash, logBlock) {
    // 1. Get totalSupply & decimals
    const token = new ethers.Contract(tokenAddr, erc20Abi, provider);
    const [rawSupply, decimals] = await Promise.all([
        token.totalSupply(),
        token.decimals()
    ]);
    const supply = Number(ethers.formatUnits(rawSupply, decimals));

    let priceUSD;
    const rawTokenPerETH = await launcherV2.getAmountOut(tokenAddr, 1000000000000000000n, false);
    console.log("rawTokenPerETH", rawTokenPerETH)

    const tokenPerETH = Number(ethers.formatUnits(rawTokenPerETH, 18));
    console.log("tokenPerETH", tokenPerETH)
    const rawETHUSD = await priceFeed.getLatestETHPrice(PRICE_GETTER_CHAINLINK);
    console.log("rawETHUSD", rawETHUSD)
    const ethUsd = Number(ethers.formatUnits(rawETHUSD, 8));
    console.log("ethUsd", ethUsd)
    priceUSD = ethUsd * tokenPerETH;
    console.log("priceUSD", priceUSD)

    // 3. Compute market cap
    const marketCapUSD = supply * priceUSD;
    console.log("marketCapUSD", marketCapUSD);

    console.log(`↪ Token: ${tokenAddr}`);
    console.log(` • Block: ${logBlock}, Tx: ${txHash}`);
    console.log(`• Total Supply: ${supply.toLocaleString()}`);
    console.log(`  • Price USD: $${priceUSD.toFixed(4)}`);
    console.log(`  • Market Cap: $${marketCapUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
}

async function main() {
    console.log('Server is now Live..... Calling Events');
    launcherV2.on("TokenDeployed", async (tokenAddr, creator, myIndex, event) => {
        console.log(`New TokenDeployed by ${creator} at ${myIndex}`);
        console.log("Events on TokenDeployed", event);
        await handleTokenV2(tokenAddr, event.log.transactionHash, event.log.blockNumber);
    });

    launcherV1.on("Trade", async (user, tokenAddr, buy, inAmt, outAmt, event) => {
        console.log("Events on Trade", event);
        console.log(`Trade ${buy ? "BUY" : "SELL"} by ${user}`);
        await handleTokenV1(tokenAddr, event.log.transactionHash, event.log.blockNumber);
    });
    
    launcherV2.on("Trade", async (user, tokenAddr, buy, inAmt, outAmt, event) => {
        console.log("Events on Trade", event);
        console.log(`Trade ${buy ? "BUY" : "SELL"} by ${user}`);
        await handleTokenV2(tokenAddr, event.log.transactionHash, event.log.blockNumber);
    });

    process.on("SIGINT", () => {
        console.log("\nShutting down…");
        provider.removeAllListeners();
        process.exit(0);
    });
}
