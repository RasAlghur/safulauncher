// safu-dapp/backend/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import { ethers } from 'ethers';

// ----- Interfaces -----
interface TokenMetadata {
  name: string;
  symbol: string;
  website?: string;
  description?: string;
  tokenAddress: string;
  tokenCreator: string;
  logoFilename?: string;
  createdAt: string;  // ISO timestamp
  expiresAt?: string;
}

interface TxLog {
  tokenAddress: string;
  type: 'buy' | 'sell';
  ethAmount: string;    // ETH spent (buy) or received (sell)
  tokenAmount: string;  // tokens received (buy) or sold (sell)
  timestamp: string;    // ISO
  txnHash: string;
  wallet: string;
}

// ----- Setup -----
const app = express();
app.use(cors());
app.use(express.json());

const dataDir = path.resolve(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const tokensFile = path.join(dataDir, 'tokens.json');
const txFile = path.join(dataDir, 'transactions.json');
if (!fs.existsSync(tokensFile)) fs.writeFileSync(tokensFile, '[]', 'utf8');
if (!fs.existsSync(txFile)) fs.writeFileSync(txFile, '[]', 'utf8');

// File uploads
const uploadDir = path.resolve(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname.replace(/[^a-z0-9.]/gi, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    cb(null, /image\/.+/.test(file.mimetype));
  }
});

// ----- Token Endpoints -----
app.get('/api/tokens', (_req: Request, res: Response) => {
  const tokens: TokenMetadata[] = JSON.parse(fs.readFileSync(tokensFile, 'utf8'));
  tokens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(tokens);
});

app.post('/api/tokens', upload.single('logo'), (req: Request, res: Response) => {
  const { name, symbol, website, description, tokenAddress, tokenCreator, createdAt, expiresAt } = req.body;
  if (!name || !symbol || !tokenAddress || !tokenCreator || !createdAt) {
    return res.status(400).json({ error: 'Missing required token metadata' });
  }
  const newToken: TokenMetadata = { name, symbol, tokenAddress, tokenCreator, createdAt };
  if (website) newToken.website = website;
  if (description) newToken.description = description;
  if (expiresAt) newToken.expiresAt = expiresAt;
  if (req.file) newToken.logoFilename = req.file.filename;
  const arr = JSON.parse(fs.readFileSync(tokensFile, 'utf8')) as TokenMetadata[];
  arr.push(newToken);
  fs.writeFileSync(tokensFile, JSON.stringify(arr, null, 2), 'utf8');
  res.json({ success: true, metadata: newToken });
});

// Enhanced server-side validation for transactions endpoint
app.post('/api/transactions', (req: Request, res: Response) => {
  const { tokenAddress, type, ethAmount, tokenAmount, timestamp, txnHash, wallet } = req.body as TxLog;

  // Basic field validation
  if (!tokenAddress || !type || !ethAmount || !tokenAmount || !timestamp || !txnHash || !wallet) {
    return res.status(400).json({ error: 'Missing transaction fields' });
  }

  // Validate transaction type
  if (type !== 'buy' && type !== 'sell') {
    return res.status(400).json({ error: 'Invalid transaction type. Must be "buy" or "sell"' });
  }

  // Validate timestamp
  if (isNaN(Date.parse(timestamp))) {
    return res.status(400).json({ error: 'Invalid timestamp' });
  }

  // Validate numeric amounts
  const ethAmountNum = parseFloat(ethAmount);
  const tokenAmountNum = parseFloat(tokenAmount);

  if (isNaN(ethAmountNum) || ethAmountNum < 0) {
    return res.status(400).json({ error: 'Invalid ETH amount. Must be a valid positive number' });
  }

  if (isNaN(tokenAmountNum) || tokenAmountNum < 0) {
    return res.status(400).json({ error: 'Invalid token amount. Must be a valid positive number' });
  }

  // Validate addresses (basic hex check)
  if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid token address format' });
  }

  if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  if (!txnHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    return res.status(400).json({ error: 'Invalid transaction hash format' });
  }

  // Check for duplicate transactions
  const txArr = JSON.parse(fs.readFileSync(txFile, 'utf8')) as TxLog[];
  const duplicate = txArr.find(tx => tx.txnHash === txnHash);

  if (duplicate) {
    return res.status(409).json({ error: 'Transaction already exists' });
  }

  // Create the entry with validated data
  const entry: TxLog = {
    tokenAddress: tokenAddress.toLowerCase(), // Normalize to lowercase
    type,
    ethAmount: ethAmountNum.toString(), // Normalize the number format
    tokenAmount: tokenAmountNum.toString(),
    timestamp,
    txnHash,
    wallet: wallet.toLowerCase()
  };

  try {
    txArr.push(entry);
    fs.writeFileSync(txFile, JSON.stringify(txArr, null, 2), 'utf8');
    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// Get *all* transactions
app.get('/api/transactions', (_req: Request, res: Response) => {
  try {
    const txArr = JSON.parse(fs.readFileSync(txFile, 'utf8')) as TxLog[];
    // Optionally sort newest first:
    txArr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(txArr);
  } catch (err) {
    console.error('Error reading transactions:', err);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});


// Get transactions for a token
app.get('/api/transactions/:tokenAddress', (req: Request, res: Response) => {
  const addr = req.params.tokenAddress.toLowerCase();
  const allTx = JSON.parse(fs.readFileSync(txFile, 'utf8')) as any[];
  const filtered = allTx
    .filter(t => t.tokenAddress.toLowerCase() === addr)
    .filter(t => t.type === 'buy' || t.type === 'sell')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(filtered);
});

// Get 24h volume
app.get('/api/volume/:tokenAddress', async (req: Request, res: Response) => {
  try {
    const addr = req.params.tokenAddress.toLowerCase();
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const block = await provider.getBlock('latest');
    if (!block) {
      return res.status(500).json({ error: 'Could not fetch latest block' });
    }
    const cutoff = (block.timestamp * 1000) - 24 * 60 * 60 * 1000;
    const allTx = JSON.parse(fs.readFileSync(txFile, 'utf8')) as TxLog[];
    const recent = allTx.filter(tx =>
      tx.tokenAddress.toLowerCase() === addr &&
      new Date(tx.timestamp).getTime() >= cutoff
    );
    const volume = recent.reduce((acc, tx) => {
      acc.totalEth += parseFloat(tx.ethAmount);
      acc.totalTokens += parseFloat(tx.tokenAmount);
      if (tx.type === 'buy') acc.buyEth += parseFloat(tx.ethAmount);
      if (tx.type === 'sell') acc.sellTokens += parseFloat(tx.tokenAmount);
      return acc;
    }, { totalEth: 0, totalTokens: 0, buyEth: 0, sellTokens: 0 });
    res.json({ tokenAddress: addr, period: '24h', volume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not compute volume' });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
