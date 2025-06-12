import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';

interface TokenMetadata {
    name: string;
    symbol: string;
    website?: string;
    description?: string;
    tokenAddress: string;
    tokenCreator: string;
    logoFilename?: string;
    createdAt: string;  // Now required - ISO timestamp string
    volume24h?: number; // Optional, can be used to store 24h volume
}

const app = express();
// const ALLOWED = process.env.ALLOWED_ORIGINS?.split(',') || [];
// app.use(cors({ origin: ALLOWED }));
app.use(cors()); // completely open CORS


app.use(express.json());

// Upload setup
const uploadDir = path.resolve(__dirname, '..', 'public', 'uploads');
// expose the uploads folder so <img src="/uploads/…"> works
app.use('/uploads', express.static(uploadDir));

fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-z0-9.]/gi, '_');
        cb(null, `${Date.now()}_${safe}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb: FileFilterCallback) => {
        // accept images only
        if (/image\/.+/.test(file.mimetype)) cb(null, true);
        else cb(null, false);  // not cb(new Error(...))
    }
});

// Data file
const dataDir = path.resolve(__dirname, '..', 'data');
const jsonFile = path.join(dataDir, 'tokens.json');
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(jsonFile)) fs.writeFileSync(jsonFile, '[]');

// GET
app.get('/api/tokens', (_req: Request, res: Response) => {
    const raw = fs.readFileSync(jsonFile, 'utf8');
    const tokens = JSON.parse(raw) as TokenMetadata[];
    
    // Sort by creation time (newest first) - optional but useful
    tokens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(tokens);
});

// POST
app.post(
    '/api/tokens',
    upload.single('logo'),
    (req: Request, res: Response) => {
        try {
            const { name, symbol, website, description, tokenAddress, tokenCreator, createdAt } = req.body as Record<string, string>;
            
            const newMeta: TokenMetadata = { 
                name, 
                symbol, 
                tokenAddress, 
                tokenCreator,
                createdAt, // Server sets the timestamp
            };
            
            if (website) newMeta.website = website;
            if (description) newMeta.description = description;
            if (req.file) newMeta.logoFilename = req.file.filename;

            const arr = JSON.parse(fs.readFileSync(jsonFile, 'utf8')) as TokenMetadata[];
            arr.push(newMeta);
            fs.writeFileSync(jsonFile, JSON.stringify(arr, null, 2), 'utf8');

            res.json({ success: true, metadata: newMeta });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed saving metadata' });
        }
    }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));