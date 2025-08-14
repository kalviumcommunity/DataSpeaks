import { getRetriever } from "../utils/embeddingsStore.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RetrievalQAChain } from "langchain/chains";

export const queryFile = async (req, res) => {
  try {
    const { question } = req.body;
    const retriever = getRetriever();

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-2.0-flash",
    });

    const chain = RetrievalQAChain.fromLLM(model, retriever);
    const result = await chain.call({
      query: `Answer in JSON format with fields: {
        "answer": "",
        "summary": "",
        "key_points": []
      }
      Question: ${question}`
    });

    res.json({ result: result.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
