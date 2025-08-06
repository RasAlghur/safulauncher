import { ethers } from "ethers";
import fs from 'fs';

const launcherAbi = [
    "event TokenDeployed(address indexed token, address creator, string myIndex)",
    "event Trade(address indexed user, address indexed token, bool buy, uint256 inAmt, uint256 outAmt)",
    "function getAmountOut(address tok, uint256 amountIn, bool isBuy) external view returns (uint256)",
];

const priceFeedAbi = [
    "function getLatestETHPrice(address _priceFeed) external view returns (uint256)"
];

const erc20Abi = [
    "function totalSupply() external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

const CONFIRMATIONS = 5;  // Safe block confirmations
const SCAN_INTERVAL = 10; // Block interval for historical scans
const CHUNK_SIZE = 500;  // Max blocks per historical request
const STATE_FILE = 'state.json';
const START_BLOCK = 23078000;    // Contract deployment block

const LAUNCHER_ADDRESS = "0x8899EE4869eA410970eDa6b9D5a4a8Cee1148b87";
const PRICE_FEED_ADDRESS = "0x4603276A9A90382A1aD8Af9aE56133b905bF8AAf";
const PRICE_GETTER_CHAINLINK = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

const ALCHEMY_HTTP = `https://eth-mainnet.g.alchemy.com/v2/GBBggRps7baCsfF4zFXWG`
const provider = new ethers.JsonRpcProvider(ALCHEMY_HTTP);
const launcher = new ethers.Contract(LAUNCHER_ADDRESS, launcherAbi, provider);
const priceFeed = new ethers.Contract(PRICE_FEED_ADDRESS, priceFeedAbi, provider);

// State management
let state = {
    lastProcessedBlock: START_BLOCK
};
let processedTx = new Set();
let isHistoricalScanActive = false;

// Load/save state from disk
function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE));
    } catch {
        return { lastProcessedBlock: START_BLOCK };
    }
}

function saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}


async function handleToken(tokenAddr, txHash, logBlock) {
    // 1. Get totalSupply & decimals
    const token = new ethers.Contract(tokenAddr, erc20Abi, provider);
    const [rawSupply, decimals] = await Promise.all([
        token.totalSupply(),
        token.decimals()
    ]);
    const supply = Number(ethers.formatUnits(rawSupply, decimals));

    let priceUSD;
    const rawTokenPerETH = await launcher.getAmountOut(tokenAddr, 1000000000000000000n, false);
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

// Process events from a block range
async function processBlockRange(fromBlock, toBlock) {
    console.log(`Scanning blocks ${fromBlock}-${toBlock}...`);

    const tokenEvents = await launcher.queryFilter("TokenDeployed", fromBlock, toBlock);
    const tradeEvents = await launcher.queryFilter("Trade", fromBlock, toBlock);

    for (const event of [...tokenEvents, ...tradeEvents]) {
        if (processedTx.has(event.transactionHash)) continue;

        const tokenAddr = event.args.tokenAddr || event.args.token;
        console.log(`Processing historical event in tx ${event.transactionHash}`);
        await handleToken(tokenAddr, event.transactionHash, event.blockNumber);
    }
}

// Chunk processor for large ranges
async function processHistoricalEvents(targetBlock) {
    if (isHistoricalScanActive) return;
    isHistoricalScanActive = true;

    try {
        let currentBlock = state.lastProcessedBlock + 1;
        const safeTarget = targetBlock - CONFIRMATIONS;

        while (currentBlock <= safeTarget) {
            const chunkEnd = Math.min(currentBlock + CHUNK_SIZE - 1, safeTarget);
            await processBlockRange(currentBlock, chunkEnd);
            state.lastProcessedBlock = chunkEnd;
            saveState();
            currentBlock = chunkEnd + 1;
        }
    } catch (error) {
        console.error("Historical scan error:", error);
    } finally {
        isHistoricalScanActive = false;
    }
}

// Main function with enhanced logic
async function main() {
    console.log('Server starting...');
    state = loadState();

    // Initial historical catch-up
    const currentBlock = await provider.getBlockNumber();
    await processHistoricalEvents(currentBlock);

    // Real-time event listeners
    launcher.on("TokenDeployed", (tokenAddr, creator, myIndex, event) => {
        processedTx.add(event.log.transactionHash);
        console.log(`New token deployed by ${creator}: ${tokenAddr}`);
        handleToken(tokenAddr, event.log.transactionHash, event.log.blockNumber);
    });

    launcher.on("Trade", (user, tokenAddr, buy, inAmt, outAmt, event) => {
        processedTx.add(event.log.transactionHash);
        console.log(`New trade: ${buy ? 'BUY' : 'SELL'} ${tokenAddr}`);
        handleToken(tokenAddr, event.log.transactionHash, event.log.blockNumber);
    });

    // Periodic historical scan trigger
    provider.on('block', async (blockNumber) => {
        if (blockNumber % SCAN_INTERVAL === 0) {
            console.log(`Triggering historical scan at block ${blockNumber}`);
            await processHistoricalEvents(blockNumber);
        }
    });

    // Clean shutdown handler
    process.on("SIGINT", () => {
        console.log("\nShutting down...");
        provider.removeAllListeners();
        saveState();
        process.exit(0);
    });
}

main().catch(console.error);
