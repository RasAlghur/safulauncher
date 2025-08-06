To implement historical event fetching and avoid duplicates, we'll add a block tracker service and modify the event listener to process past events. Here's the step-by-step solution:

1. **Create Block Tracker Service**:
```typescript
// block-tracker.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';

@Injectable()
export class BlockTrackerService {
  private filePath: string;

  constructor(private configService: ConfigService) {
    this.filePath = this.configService.get('BLOCK_TRACKER_FILE') || 'lastBlock.json';
  }

  getLastBlock(): number {
    try {
      if (existsSync(this.filePath)) {
        const data = JSON.parse(readFileSync(this.filePath, 'utf8'));
        return data.lastBlock || 23078000;
      }
    } catch (err) {
      console.error('Error reading last block:', err);
    }
    return 23078000; // Default starting block
  }

  saveLastBlock(blockNumber: number): void {
    try {
      writeFileSync(this.filePath, JSON.stringify({ lastBlock: blockNumber }));
    } catch (err) {
      console.error('Error saving last block:', err);
    }
  }
}
```

2. **Update TransactionEventService**:
```typescript
import { BlockTrackerService } from './block-tracker.service';

// Add to imports
const CHUNK_SIZE = 2000; // Process blocks in chunks

@Injectable()
export class TransactionEventService implements OnModuleInit {
  constructor(
    // ...existing dependencies
    private blockTracker: BlockTrackerService,
  ) { 
    // ...existing constructor
  }

  async onModuleInit() {
    console.log('Fetching historical events');
    await this.fetchHistoricalEvents();
    console.log('Starting live event listeners');
    this.eventListener().catch((err) => {
      console.error('Event listener error:', err);
      process.exit(1);
    });
  }

  async fetchHistoricalEvents() {
    const startBlock = this.blockTracker.getLastBlock();
    const currentBlock = await this.provider.getBlockNumber();
    console.log(`Processing blocks from ${startBlock} to ${currentBlock}`);

    await this.processEventsInRange(
      startBlock,
      currentBlock,
      CHUNK_SIZE
    );

    this.blockTracker.saveLastBlock(currentBlock);
  }

  private async processEventsInRange(
    startBlock: number,
    endBlock: number,
    chunkSize: number
  ) {
    for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += chunkSize) {
      const toBlock = Math.min(fromBlock + chunkSize - 1, endBlock);
      console.log(`Processing blocks ${fromBlock} to ${toBlock}`);

      await Promise.all([
        this.processContractEvents(this.launcherV1, 'TokenDeployed', fromBlock, toBlock),
        this.processContractEvents(this.launcherV1, 'Trade', fromBlock, toBlock),
        this.processContractEvents(this.launcherV2, 'TokenDeployed', fromBlock, toBlock),
        this.processContractEvents(this.launcherV2, 'Trade', fromBlock, toBlock),
      ]);

      // Save progress after each chunk
      this.blockTracker.saveLastBlock(toBlock + 1);
    }
  }

  private async processContractEvents(
    contract: Contract,
    eventName: string,
    fromBlock: number,
    toBlock: number
  ) {
    try {
      const events = await contract.queryFilter(eventName, fromBlock, toBlock);
      console.log(`Found ${events.length} ${eventName} events`);

      for (const event of events) {
        if (eventName === 'TokenDeployed') {
          await this.processTokenDeployedEvent(event);
        } else if (eventName === 'Trade') {
          await this.processTradeEvent(event, contract);
        }
      }
    } catch (error) {
      console.error(`Error processing ${eventName} events:`, error);
    }
  }

  private async processTokenDeployedEvent(event: ethers.EventLog) {
    const [tokenAddr, creator, myIndex] = event.args;
    
    // Check if token exists
    const exists = await this.tokenService.exists(tokenAddr);
    if (exists) return;

    console.log(`Processing historical TokenDeployed: ${tokenAddr}`);
    await this.tokenService.update(
      {
        tokenAddress: tokenAddr,
        tokenCreator: creator,
        transactionHash: event.log.transactionHash,
      },
      myIndex
    );
  }

  private async processTradeEvent(event: ethers.EventLog, contract: Contract) {
    const [user, tokenAddr, buy, inAmt, outAmt] = event.args;
    
    // Check if transaction exists
    const exists = await this.transactionService.exists(
      event.log.transactionHash,
      event.log.index
    );
    if (exists) return;

    console.log(`Processing historical Trade: ${event.log.transactionHash}`);
    const isV1 = contract.address === this.launcherV1.address;
    const oldMarketCap = isV1
      ? await this.handleTokenV1(tokenAddr, event.log.transactionHash, event.log.blockNumber)
      : await this.handleTokenV2(tokenAddr, event.log.transactionHash, event.log.blockNumber);

    await this.saveTrade(
      user,
      tokenAddr,
      buy,
      inAmt,
      outAmt,
      oldMarketCap,
      event.log.transactionHash,
      event.log.index // Add logIndex parameter
    );
  }

  // Update saveTrade to include logIndex
  private async saveTrade(
    user: string,
    tokenAddr: string,
    buy: boolean,
    inAmt: any,
    outAmt: any,
    oldMarketCap: number,
    transactionHash: string,
    logIndex: number // Add this parameter
  ) {
    try {
      // ... existing save logic

      await this.transactionService.create({
        tokenAddress: tokenAddr,
        tokenAmount: buy ? outAmount : inAmount,
        wallet: user,
        type: TransactionType[action],
        ethAmount: buy ? inAmount : outAmount,
        oldMarketCap,
        txnHash: transactionHash,
        logIndex, // Store logIndex
        // ... other fields
      });
    } catch (err) {
      console.error('Error saving trade:', err);
    }
  }
}
```

3. **Update Transaction Service**:
```typescript
// Add to TransactionService
async exists(txnHash: string, logIndex: number): Promise<boolean> {
  const count = await this.transactionRepository.count({
    where: { txnHash, logIndex },
  });
  return count > 0;
}
```

4. **Update Transaction Entity**:
```typescript
// Add to Transaction entity
@Column()
logIndex: number;
```

**Key Improvements**:
1. **Block Tracking**: Uses a file to persist the last processed block
2. **Chunk Processing**: Processes blocks in manageable chunks (2000 blocks)
3. **Duplicate Prevention**: Checks database using transaction hash + log index
4. **Progress Saving**: Saves progress after each chunk to prevent re-processing
5. **Concurrent Processing**: Processes events from both contracts in parallel
6. **Error Handling**: Robust error handling for individual event processing

**To use this**:
1. Create the new `BlockTrackerService`
2. Add `logIndex` to your Transaction entity and run a database migration
3. Inject `BlockTrackerService` into `TransactionEventService`
4. Update `saveTrade` calls to include `event.log.index` from event objects

This solution will:
- Fetch all historical events from your starting block
- Skip already processed events using transaction hash + log index
- Save progress periodically to prevent re-processing
- Resume from the last processed block on restart
- Continue listening for new events after historical processing
