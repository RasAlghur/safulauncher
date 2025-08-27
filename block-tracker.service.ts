// api/src/global/service/block-tracker.service.ts

import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';

dotenv.config();
interface VersionState {
  lastProcessedBlock: number;
  toProcessedBlock: number;
  toBlockReached: boolean;
}

interface BlockTrackerState {
  V1: VersionState;
  V2: VersionState;
}

const TXN_HASH_FILE = 'transaction_hashes.json';
let transactionHashes = {
  TokenDeployed: [],
  Trade: [],
};

@Injectable()
export class BlockTracker {
  private state: BlockTrackerState;
  private filePath: string;
  private isDev: boolean;
  constructor(private configService: ConfigService) {
    try {
      // Initialize environment
      const environment = process.env.NODE_ENV;
      this.isDev = environment === 'development';
      this.filePath = 'state.json';

      // Validate and load initial state
      this.state = this.loadInitialState();
      this.loadState();

      console.log(`BlockTracker initialized in ${environment} mode`, {
        V1: this.state.V1,
        V2: this.state.V2,
      });
    } catch (error) {
      console.error('Failed to initialize BlockTracker:', error);
      throw new Error('BlockTracker initialization failed');
    }
  }

  private loadInitialState(): BlockTrackerState {
    // Helper function to safely get and parse block numbers
    const getBlockNumber = (envPrefix: string, version: string): number => {
      const key = `${envPrefix}_${version}`;
      const value = this.configService.getOrThrow(key);
      const blockNumber = parseInt(value, 10);

      if (isNaN(blockNumber) || blockNumber < 0) {
        throw new Error(`Invalid block number in config for ${key}: ${value}`);
      }

      return blockNumber;
    };

    const getToBlock = (envPrefix: string, version: string): number => {
      const key = `${envPrefix}_TO_BLOCK_${version}`;
      const value = this.configService.get(key, '0');
      const blockNumber = parseInt(value, 10);

      if (isNaN(blockNumber) || blockNumber < 0) {
        return 0; // Default to 0 if not set or invalid
      }

      return blockNumber;
    };

    const prefix = this.isDev ? 'BLOCK_NUMBER_TESTNET' : 'BLOCK_NUMBER_MAINNET';
    const toBlockPrefix = this.isDev ? 'TO_BLOCK_TESTNET' : 'TO_BLOCK_MAINNET';

    return {
      V1: {
        lastProcessedBlock: getBlockNumber(prefix, 'V1'),
        toProcessedBlock: getToBlock(toBlockPrefix, 'V1'),
        toBlockReached: false
      },
      V2: {
        lastProcessedBlock: getBlockNumber(prefix, 'V2'),
        toProcessedBlock: getToBlock(toBlockPrefix, 'V2'),
        toBlockReached: false
      }
    };
  }


  private loadState(): void {
    try {
      if (existsSync(this.filePath)) {
        const data = readFileSync(this.filePath, 'utf8');
        const savedState = JSON.parse(data) as BlockTrackerState;

        // Validate loaded state
        if (savedState.V1 && savedState.V1.lastProcessedBlock > this.state.V1.lastProcessedBlock) {
          this.state.V1.lastProcessedBlock = savedState.V1.lastProcessedBlock;
        }
        if (savedState.V1 && savedState.V1.toProcessedBlock > this.state.V1.toProcessedBlock) {
          this.state.V1.toProcessedBlock = savedState.V1.toProcessedBlock;
        }
        if (savedState.V1 && savedState.V1.toBlockReached) {
          this.state.V1.toBlockReached = savedState.V1.toBlockReached;
        }

        if (savedState.V2 && savedState.V2.lastProcessedBlock > this.state.V2.lastProcessedBlock) {
          this.state.V2.lastProcessedBlock = savedState.V2.lastProcessedBlock;
        }
        if (savedState.V2 && savedState.V2.toProcessedBlock > this.state.V2.toProcessedBlock) {
          this.state.V2.toProcessedBlock = savedState.V2.toProcessedBlock;
        }
        if (savedState.V2 && savedState.V2.toBlockReached) {
          this.state.V2.toBlockReached = savedState.V2.toBlockReached;
        }

        console.log('Loaded saved state:', this.state);
      }
    } catch (error) {
      console.warn('Failed to load saved state, using defaults:', error);
    }
  }

  getToBlock(version: string) {
    return this.state[version].toProcessedBlock;
  }

  isToBlockReached(version: string) {
    return this.state[version].toBlockReached;
  }

  setToBlockReached(version: string, reached: boolean) {
    this.state[version].toBlockReached = reached;
    this.saveState();
  }

  loadTransactionHashes() {
    try {
      return JSON.parse(JSON.stringify(readFileSync(TXN_HASH_FILE)));
    } catch {
      return { TokenDeployed: [], Trade: [] };
    }
  }


  saveTransactionHash(
    eventType: string,
    txHash: string,
    blockNumber: number,
    tokenAddr: string,
  ) {
    const txData = {
      hash: txHash,
      block: blockNumber,
      token: tokenAddr,
      timestamp: new Date().toISOString(),
    };

    transactionHashes[eventType].push(txData);
    this.saveTransactionHashes();
    console.log(`Saved ${eventType} transaction: ${txHash}`);
  }

  private saveTransactionHashes() {
    writeFileSync(TXN_HASH_FILE, JSON.stringify(transactionHashes, null, 2));
  }

  saveState() {
    writeFileSync(this.filePath, JSON.stringify(this.state));
  }

  // Update getter and setter methods
  getLastBlock(version: string) {
    return this.state[version].lastProcessedBlock;
  }

  saveLastBlock(blockNumber: number, version: string) {
    this.state[version].lastProcessedBlock = blockNumber;
    this.saveState();
  }
}
