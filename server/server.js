import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RetrievalQAChain } from 'langchain/chains';

// Load environment from parent directory
config({ path: '../.env' });

console.log('🔑 API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');

const app = express();
app.use(cors());
app.use(express.json());

// File upload setup
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });

// In-memory vector stores
const vectorStores = {};

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 File upload started...');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('📄 Processing file:', req.file.originalname);
    const filePath = req.file.path;
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    console.log(`📄 Loaded ${docs.length} document(s)`);
    
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
    const chunks = await splitter.splitDocuments(docs);
    console.log(`✂️ Split into ${chunks.length} chunks`);
    
    const embeddings = new GoogleGenerativeAIEmbeddings({ 
      apiKey: process.env.GEMINI_API_KEY, 
      model: 'text-embedding-004' 
    });
    
    const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
