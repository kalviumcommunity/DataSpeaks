import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const processPDF = async (filePath) => {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
  return await splitter.splitDocuments(docs);
};

Designed and implemented a pipeline to ingest PDFs, chunk & embed content, and deliver real-time semantic Q&A via web chat and CLI.