// query-pdf.js
import { config } from 'dotenv';
config({ path: '../.env' });

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RetrievalQAChain } from "langchain/chains";
import fs from "fs";
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// 1. Embed PDF content into memory vector store
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY, model: "text-embedding-004" });
const loader = new PDFLoader("./HARISHB.pdf");
const docs = await loader.load();
console.log(`📄 Loaded ${docs.length} document(s)`);
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
const chunks = await splitter.splitDocuments(docs);
console.log(`✂️ Split into ${chunks.length} chunks`);
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
console.log("📦 Built vector store from PDF");

// Create retriever and QA chain
const retriever = vectorStore.asRetriever();
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.0-flash",
});

const chain = RetrievalQAChain.fromLLM(model, retriever);

// CLI interface using promise-based readline
const rl = readline.createInterface({ input, output });
(async () => {
  while (true) {
    const question = await rl.question("\n💬 Ask about your PDF: ");
    if (question.toLowerCase() === "exit") {
      break;
    }
    const res = await chain.call({
      query: `Answer in JSON format with fields: {
        "answer": "",
        "summary": "",
        "key_points": []
      }
      Question: ${question}`
    });
    console.log("\n📑 AI Response:");
    console.log(res.text);
  }
  rl.close();
})();
