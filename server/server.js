import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { RetrievalQAChain } from 'langchain/chains';
import mongoRoutes from './routes/mongoRoutes.js';
import sqlRoutes from './routes/sqlRoutes.js';
import { processPDF } from './utils/pdfProcessor.js';
import { storeEmbeddings } from './utils/embeddingsStore.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

console.log('🔑 API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app (for production)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  console.log('📦 Serving static files from:', clientBuildPath);
  app.use(express.static(clientBuildPath, {
    setHeaders: (res, filepath) => {
      // Set correct MIME types for JS modules
      if (filepath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filepath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filepath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
} else {
  console.log('⚠️  Client build not found. Run `npm run build` in client directory.');
}

// File upload setup
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });

// In-memory vector stores
const vectorStores = {};

// MongoDB routes
app.use('/api/mongo', mongoRoutes);

// SQL routes
app.use('/api/sql', sqlRoutes);

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 File upload started...');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('📄 Processing file:', req.file.originalname);
    const filePath = req.file.path;
    
    const chunks = await processPDF(filePath);
    console.log(`✂️ Split into ${chunks.length} chunks`);
    
    const vectorStore = await storeEmbeddings(chunks);
    vectorStores[req.file.filename] = vectorStore;
    console.log('✅ Vector store created for file:', req.file.filename);
    
    res.json({ fileId: req.file.filename });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { fileId, question } = req.body;
    const vectorStore = vectorStores[fileId];
    if (!vectorStore) return res.status(404).json({ error: 'File not found' });
    const retriever = vectorStore.asRetriever();
    const model = new ChatGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY, model: 'gemini-2.0-flash' });
    const qaChain = RetrievalQAChain.fromLLM(model, retriever);
    const result = await qaChain.call({ query: question });
    res.json({ answer: result.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle client-side routing - must be after API routes
if (fs.existsSync(clientBuildPath)) {
  app.get('/*', (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    res.sendFile(indexPath);
  });
} else {
  console.log('⚠️  Skipping client routing - build not found');
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
