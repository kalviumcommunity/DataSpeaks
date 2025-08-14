import xlsx from "xlsx";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const processExcel = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  let text = "";

  workbook.SheetNames.forEach(sheet => {
    const sheetData = xlsx.utils.sheet_to_csv(workbook.Sheets[sheet]);
    text += `\n${sheet}: \n${sheetData}`;
  });

  const docs = [new Document({ pageContent: text })];
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
  return await splitter.splitDocuments(docs);
};
