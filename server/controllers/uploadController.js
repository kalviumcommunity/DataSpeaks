import { processPDF } from "../utils/pdfProcessor.js";
import { processExcel } from "../utils/excelProcessor.js";
import { storeEmbeddings } from "../utils/embeddingsStore.js";
import path from "path";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let docs;

    if (ext === ".pdf") {
      docs = await processPDF(req.file.path);
    } else if (ext === ".xlsx" || ext === ".xls") {
      docs = await processExcel(req.file.path);
    } else {
      return res.status(400).json({ error: "Unsupported file format" });
    }

    await storeEmbeddings(docs);
    res.json({ message: "File processed & embeddings stored" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
