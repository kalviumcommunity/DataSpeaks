import { config } from 'dotenv';
config({ path: '../.env' });
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"; 
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

// 1. Load PDF
const loader = new PDFLoader("./HARISHB.pdf");
const docs = await loader.load();
console.log(`📄 Loaded ${docs.length} document(s)`);

// 2. Split into chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50
});
const chunks = await splitter.splitDocuments(docs);
console.log(`✂️ Split into ${chunks.length} chunks`);

// 3. Convert to embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "text-embedding-004"
});
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

console.log("✅ PDF loaded & embedded in memory!");
