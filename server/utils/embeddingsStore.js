import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

let vectorStore;

export const storeEmbeddings = async (chunks) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "text-embedding-004"
  });
  vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
};

export const getRetriever = () => {
  if (!vectorStore) throw new Error("No vector store found. Upload file first.");
  return vectorStore.asRetriever();
};
