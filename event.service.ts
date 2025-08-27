//api/src/global/service/event.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, ethers } from 'ethers';
import { TokensGateway } from 'src/app/tokens/tokens.gateway';
import { TokensService } from 'src/app/tokens/tokens.service';
import { TransactionType } from 'src/app/transaction/entities';
import { TransactionService, VolumeService } from 'src/app/transaction/service';
import { UserService } from 'src/app/user/user.service';
import { BlockTracker } from './block-tracker.service';

const launcherAbi = [
  'event TokenDeployed(address indexed token, address creator, string myIndex)',
  'event Trade(address indexed user, address indexed token, bool buy, uint256 inAmt, uint256 outAmt)',
  'function getAmountOut(address tok, uint256 amountIn, bool isBuy) external view returns (uint256)',
  'function getCurrentTokenPrice(address tok) external view returns (uint256 priceInETH, uint256 priceInUSD)',
];
const priceFeedAbi = [
  'function getLatestETHPrice(address _priceFeed) external view returns (uint256)',
];

const erc20Abi = [
  'function totalSupply() external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];
const CONFIRMATIONS = 5;
const SCAN_INTERVAL = 10;
const CHUNK_SIZE = 250;
let scanActive = false;
let processedTx = new Set();
const RATE_LIMIT_DELAY = 5000;

@Injectable()
export class TransactionEventService implements OnModuleInit {
  private readonly launcherV1: Contract;
  private readonly launcherV2: Contract;
  private readonly priceFeed: Contract;
  private readonly providerV1: JsonRpcProvider; //WebSocketProvider;
  private readonly providerV2: JsonRpcProvider;
  private readonly providerPriceFeed: JsonRpcProvider;

  constructor(
    private readonly tokenService: TokensService,
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly volumeService: VolumeService,
    private readonly tokenGateway: TokensGateway,
    private configService: ConfigService,
    private blockTracker: BlockTracker,
  ) {
    this.providerV1 = new JsonRpcProvider(
      this.configService.getOrThrow('INFURA_RPC_V1'),
    );
    this.providerV2 = new JsonRpcProvider(
      this.configService.getOrThrow('INFURA_RPC_V2'),
    );
    this.providerPriceFeed = new JsonRpcProvider(
      this.configService.getOrThrow('ALCHEMY_HTTP'),
    );
    // WebSocketProvider(
    //   this.configService.getOrThrow('INFURA_RPC'),
    // );
    this.launcherV1 = new Contract(
      this.configService.getOrThrow('LAUNCHER_ADDRESS_V1'),
      launcherAbi,
      this.providerV1,
    );

    this.launcherV2 = new Contract(
      this.configService.getOrThrow('LAUNCHER_ADDRESS_V2'),
      launcherAbi,
      this.providerV2,
    );

    this.priceFeed = new Contract(
      this.configService.getOrThrow('PRICE_FEED_ADDRESS'),
      priceFeedAbi,
      this.providerPriceFeed,
    );
  }

  onModuleInit() {
    this.triggerHistoricalScan();
    console.log('eventListener started');
    this.eventListener().catch((err) => {
      console.log(err);
      process.exit(1);
    });
  }
  transactionHashes = this.blockTracker.loadTransactionHashes();
  async eventListener() {
    this.volumeService.saveToFile({
      start: 'Server is Live',
      timestamp: new Date(),
      eventType: 'track',
    });

    await this.launcherV1.on(
      'TokenDeployed',
      async (tokenAddr, creator, myIndex, event) => {
        // console.log(`New TokenDeployed by ${creator} at ${myIndex}`);
        console.log('Events on TokenDeployed', event);
        const data = await this.tokenService.update(
          {
            tokenAddress: tokenAddr,
            tokenCreator: creator,
            transactionHash: event.log.transactionHash,
          },
          myIndex,
        );

        // console.log({ data });
        const savedata = {
          name: data?.name,
          symbol: data?.symbol,
          tokenAddress: data?.tokenAddress,
          identifier: data?.identifier,
          creator: data?.tokenCreator,
          eventType: 'deployment',
          timestamp: new Date(),
        };

        this.volumeService.saveToFile(savedata);

        this.tokenGateway.broadcastEvent('token_deployment', data);
        setTimeout(async () => {
          const result = await this.volumeService.verifyTransaction(
            tokenAddr,
            myIndex,
          );
          // console.log(result);
        }, 120000);
      },
    );

    // await this.launcherV2.on(
    //   'TokenDeployed',
    //   async (tokenAddr, creator, myIndex, event) => {
    //     // console.log(`New TokenDeployed by ${creator} at ${myIndex}`);
    //     console.log('Events on TokenDeployed', event);
    //     const data = await this.tokenService.update(
    //       {
    //         tokenAddress: tokenAddr,
    //         tokenCreator: creator,
    //         transactionHash: event.log.transactionHash,
    //       },
    //       myIndex,
    //     );

    //     // console.log({ data });
    //     const savedata = {
    //       name: data?.name,
    //       symbol: data?.symbol,
    //       tokenAddress: data?.tokenAddress,
    //       identifier: data?.identifier,
    //       creator: data?.tokenCreator,
    //       eventType: 'deployment',
    //       timestamp: new Date(),
    //     };

    //     this.volumeService.saveToFile(savedata);

    //     this.tokenGateway.broadcastEvent('token_deployment', data);
    //     setTimeout(async () => {
    //       const result = await this.volumeService.verifyTransaction(
    //         tokenAddr,
    //         myIndex,
    //       );
    //       // console.log(result);
    //     }, 120000);
    //   },
    // );

    await this.launcherV1.on(
      'Trade',
      async (user, tokenAddr, buy, inAmt, outAmt, event) => {
        console.log('v1', event);
        const oldMarketCap = await this.handleTokenV1(
          tokenAddr,
          event.log.transactionHash,
          event.log.blockNumber,
        );

        this.saveTrade(
          user,
          tokenAddr,
          buy,
          inAmt,
          outAmt,
          oldMarketCap,
          event.log.transactionHash,
          event.log.blockNumber,
        );
      },
    );

    await this.launcherV2.on(
      'Trade',
      async (user, tokenAddr, buy, inAmt, outAmt, event) => {
        console.log('v2', event);
        const oldMarketCap = await this.handleTokenV2(
          tokenAddr,
          event.log.transactionHash,
          event.log.blockNumber,
        );

        await this.saveTrade(
          user,
          tokenAddr,
          buy,
          inAmt,
          outAmt,
          oldMarketCap,
          event.log.transactionHash,
          event.log.blockNumber,
        );
      },
    );

    await this.providerV1.on('block', async (blockNumber) => {
      if (blockNumber % SCAN_INTERVAL === 0) {
        await this.triggerHistoricalScan();
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      this.providerV1.removeAllListeners();
      process.exit(0);
    });
  }

  async processEventsInRange(
    startBlock: number,
    endBlock: number,
    chunkSize: number,
    version: string,
  ) {
    for (
      let fromBlock = startBlock;
      fromBlock <= endBlock;
      fromBlock += chunkSize
    ) {
      const toBlock = Math.min(fromBlock + chunkSize - 1, endBlock);
      console.log(`Processing ${version} blocks ${fromBlock}-${toBlock}`);

      const contract = version === 'V1' ? this.launcherV1 : this.launcherV2;

      const address = await contract.getAddress();
      // If this version's contract is the zero address, skip processing for this chunk.
      if (address === this.configService.get('LAUNCHER_ADDRESS_V2')) {
        console.log(
          `Skipping processing for ${version} because contract is zero address`,
        );
        // still advance the saved last block so we don't repeatedly try to scan it
        this.blockTracker.saveLastBlock(toBlock + 1, version);
        continue;
      }
      await Promise.all([
        this.processContractEvents(
          contract,
          'TokenDeployed',
          fromBlock,
          toBlock,
        ),
        this.processContractEvents(contract, 'Trade', fromBlock, toBlock),
      ]);

      this.blockTracker.saveLastBlock(toBlock + 1, version);
    }
  }

  async processContractEvents(
    contract: Contract,
    eventName: string,
    fromBlock: number,
    toBlock: number,
    retries = 0,
  ) {
    const MAX_RETRIES = 3;
    try {
      const events: any = await contract.queryFilter(
        eventName,
        fromBlock,
        toBlock,
      );
      console.log(`Found ${events.length} ${eventName} events`);

      for (const event of events) {
        if (eventName === 'TokenDeployed') {
          await this.handleTokenDeployed(event);
        } else {
          await this.handleTrade(event, contract);
        }
      }
      console.log(
        `Waiting ${RATE_LIMIT_DELAY / 1000} seconds to avoid rate limits...`,
      );
      await this.sleep(RATE_LIMIT_DELAY);
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`Retrying ${eventName} (${retries + 1})...`);
        await new Promise((resolve) =>
          setTimeout(resolve, 120000 * (retries + 1)),
        );
        return this.processContractEvents(
          contract,
          eventName,
          fromBlock,
          toBlock,
          retries + 1,
        );
      }
      console.error(`Failed ${eventName}: ${error.message}`);
    }
  }

  async triggerHistoricalScan() {
    if (scanActive) return;
    scanActive = true;
    try {
      const currentBlock = await this.providerV2.getBlockNumber();
      const targetBlock = currentBlock - CONFIRMATIONS;

      await Promise.allSettled([
        this.scanVersion('V1', targetBlock),
        this.scanVersion('V2', targetBlock),
      ]);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      scanActive = false;
    }
  }

  async scanVersion(version: string, targetBlock: number) {
    const startBlock = this.blockTracker.getLastBlock(version);
    const toBlock = this.blockTracker.getToBlock(version);
    const toBlockReached = this.blockTracker.isToBlockReached(version);

    if (startBlock >= targetBlock) return;

    const ZERO_ADDRESS = this.configService.get('LAUNCHER_ADDRESS_V2');
    const v1 = await this.launcherV1.getAddress();
    const v2 = await this.launcherV2.getAddress();
    // console.log({ v1, v2 });
    // Skip scanning entirely if the launcher for this version is the zero address
    if (version === 'V1' && v1 === ZERO_ADDRESS) {
      console.log(
        `Skipping ${version} scan because launcherV1 is zero address`,
      );
      this.blockTracker.saveLastBlock(targetBlock, version);
      return;
    }
    if (version === 'V2' && v2 === ZERO_ADDRESS) {
      console.log(
        `Skipping ${version} scan because launcherV2 is zero address`,
      );
      this.blockTracker.saveLastBlock(targetBlock, version);
      return;
    }

    console.log(
      `Starting ${version} scan from ${startBlock} to ${targetBlock}`,
    );

    if (!toBlockReached) {
      // Phase 1: Process up to TO_BLOCK
      const phase1End = Math.min(toBlock, targetBlock);
      if (startBlock <= phase1End) {
        await this.processEventsInRange(startBlock, phase1End, CHUNK_SIZE, version);
        this.blockTracker.saveLastBlock(phase1End + 1, version);

        // Check if we reached TO_BLOCK
        if (phase1End >= toBlock) {
          this.blockTracker.setToBlockReached(version, true);
        }
      }
    }

    // Phase 2: Process beyond TO_BLOCK if needed
    if (toBlockReached || this.blockTracker.isToBlockReached(version)) {
      const phase2Start = Math.max(this.blockTracker.getLastBlock(version), toBlock + 1);
      if (phase2Start <= targetBlock) {
        await this.processEventsInRange(phase2Start, targetBlock, CHUNK_SIZE, version);
        this.blockTracker.saveLastBlock(targetBlock + 1, version);
      }
    }
  }

  async handleTokenDeployed(event: ethers.EventLog) {
    if (processedTx.has(event.transactionHash)) return;

    const [tokenAddr, creator, myIndex] = event.args;
    const exists = await this.tokenService.exists(tokenAddr);
    if (exists) return;

    console.log(`Processing historical TokenDeployed: ${tokenAddr}`);
    await this.tokenService.update(
      {
        tokenAddress: tokenAddr,
        tokenCreator: creator,
        transactionHash: event.transactionHash,
      },
      myIndex,
    );
    this.blockTracker.saveTransactionHash(
      'TokenDeployed',
      event.transactionHash,
      event.blockNumber,
      tokenAddr,
    );
    processedTx.add(event.transactionHash);
  }

  async handleTrade(event: ethers.EventLog, contract: Contract) {
    if (processedTx.has(event.transactionHash)) return;
    const [user, tokenAddr, buy, inAmt, outAmt] = event.args;
    // Check if transaction exists
    // console.log(event);

    const exists = await this.transactionService.exists(
      event.transactionHash,
      user,
    );
    if (exists) return;

    console.log(`Processing historical Trade: ${event.transactionHash}`);
    const isV1 = contract.address === this.launcherV1.address;
    const oldMarketCap = isV1
      ? await this.handleTokenV1(
        tokenAddr,
        event.transactionHash,
        event.blockNumber,
      )
      : await this.handleTokenV2(
        tokenAddr,
        event.transactionHash,
        event.blockNumber,
      );

    await this.saveTrade(
      user,
      tokenAddr,
      buy,
      inAmt,
      outAmt,
      oldMarketCap,
      event.transactionHash,
      event.blockNumber,
    );

    this.blockTracker.saveTransactionHash(
      'Trade',
      event.transactionHash,
      event.blockNumber,
      tokenAddr,
    );
    processedTx.add(event.transactionHash);
  }

  private async saveTrade(
    user: string,
    tokenAddr: string,
    buy: boolean,
    inAmt: any,
    outAmt: any,
    oldMarketCap: number,
    transactionHash: string,
    blockNumber: number,
  ) {
    try {
      const data = {
        user,
        tokenAddr,
        buy,
        inAmt: inAmt.toString() / 1e18,
        outAmt: outAmt.toString() / 1e18,
        timestamp: new Date(),
      };

      console.log({ blockNumber });
      const timestamp = await this.getBlockWithRetry(blockNumber);

      // console.log({ timestamp });

      const action = buy ? 'buy' : 'sell';
      await this.userService.create({ wallet: user });

      const outAmount = outAmt.toString() / 1e18;
      const inAmount = inAmt.toString() / 1e18;
      await this.transactionService.create({
        tokenAddress: tokenAddr,
        tokenAmount: buy ? outAmount : inAmount,
        wallet: user,
        type: TransactionType[action],
        ethAmount: buy ? inAmount : outAmount,
        oldMarketCap,
        txnHash: transactionHash,
        bundleIndex: null,
        timestamp,
        isBundleTransaction: false,
        originalTxnHash: '',
      });

      this.volumeService.saveToFile({ ...data, eventType: 'trade' });
    } catch (err) {
      throw err;
    }
  }

  private async getBlockWithRetry(
    blockNumber: number,
    retries = 3,
    delay = 1000,
  ) {
    try {
      const currentBlock = await this.providerV2.getBlock(blockNumber);
      console.log({ currentBlock });
      const tradeTime = currentBlock.timestamp * 1000;
      return new Date(tradeTime).toISOString();
    } catch (error) {
      if (retries > 0) {
        console.log('retrying block number....');
        await new Promise((res) => setTimeout(res, delay));
        return this.getBlockWithRetry(blockNumber, retries - 1, delay * 2);
      }
      if (error.code === 'UNKNOWN_ERROR' && error.error?.code === -32000) {
        console.error('Node internal error, try again later');
      }
      throw error;
    }
  }
  private async handleTokenV1(
    tokenAddr: string,
    txHash: string,
    logBlock: number,
  ) {
    // 1. Get totalSupply & decimals
    const token = new ethers.Contract(tokenAddr, erc20Abi, this.providerV1);
    const [rawSupply, decimals] = await Promise.all([
      token.totalSupply(),
      token.decimals(),
    ]);
    const supply = Number(ethers.formatUnits(rawSupply, decimals));

    let priceUSD: number;
    const rawTokenPerETH = await this.launcherV1.getAmountOut(
      tokenAddr,
      1000000000000000000n,
      false,
    );
    // console.log('rawTokenPerETH', rawTokenPerETH);

    const tokenPerETH = Number(ethers.formatUnits(rawTokenPerETH, 18));
    // console.log('tokenPerETH', tokenPerETH);
    const rawETHUSD = await this.priceFeed.getLatestETHPrice(
      this.configService.getOrThrow('PRICE_GETTER_CHAINLINK'),
    );
    // console.log('rawETHUSD', rawETHUSD);
    const ethUsd = Number(ethers.formatUnits(rawETHUSD, 8));
    // console.log('ethUsd', ethUsd);
    priceUSD = ethUsd * tokenPerETH;
    console.log('priceUSD', priceUSD);

    // 3. Compute market cap
    const marketCapUSD = supply * priceUSD;
    // console.log('marketCapUSD', marketCapUSD);

    // console.log(`↪ Token: ${tokenAddr}`);
    // console.log(` • Block: ${logBlock}, Tx: ${txHash}`);
    // console.log(`• Total Supply: ${supply.toLocaleString()}`);
    // console.log(`  • Price USD: $${priceUSD.toFixed(4)}`);
    // console.log(
    //   `  • Market Cap: $${marketCapUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    // );

    return marketCapUSD;
  }

  private async handleTokenV2(
    tokenAddr: string,
    txHash: string,
    logBlock: number,
  ) {
    // 1. Get totalSupply & decimals
    const token = new ethers.Contract(tokenAddr, erc20Abi, this.providerV2);
    const [rawSupply, decimals] = await Promise.all([
      token.totalSupply(),
      token.decimals(),
    ]);
    const supply = Number(ethers.formatUnits(rawSupply, decimals));

    let priceUSD: number;
    const rawTokenPerETH = await this.launcherV2.getAmountOut(
      tokenAddr,
      1000000000000000000n,
      false,
    );

    const tokenPerETH = Number(ethers.formatUnits(rawTokenPerETH, 18));
    const rawETHUSD = await this.priceFeed.getLatestETHPrice(
      this.configService.getOrThrow('PRICE_GETTER_CHAINLINK'),
    );
    const ethUsd = Number(ethers.formatUnits(rawETHUSD, 8));
    priceUSD = ethUsd * tokenPerETH;

    // 3. Compute market cap
    const marketCapUSD = supply * priceUSD;

    return marketCapUSD;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
