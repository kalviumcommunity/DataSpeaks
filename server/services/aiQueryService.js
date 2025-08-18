import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { config } from 'dotenv';

config();

class AIQueryService {
  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash',
      temperature: 0.1,
    });
  }

  // Convert natural language to MongoDB query
  async naturalLanguageToMongoDB(question, collections, databaseSchema = {}) {
    const prompt = this.buildPrompt(question, collections, databaseSchema);
    
    try {
      const response = await this.model.invoke(prompt);
      const queryResult = this.parseAIResponse(response.content);
      
      return {
        success: true,
        mongoQuery: queryResult.query,
        explanation: queryResult.explanation,
        collection: queryResult.collection,
        operation: queryResult.operation,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Build comprehensive prompt for AI
  buildPrompt(question, collections, databaseSchema) {
    return `You are a MongoDB query expert. Convert the following natural language question into a MongoDB query.

Available Collections: ${collections.map(c => c.name).join(', ')}

Database Schema Context: ${JSON.stringify(databaseSchema, null, 2)}

Question: "${question}"

IMPORTANT RULES:
1. ONLY use read-only operations: find, findOne, countDocuments, distinct, aggregate
2. NO write operations (insert, update, delete, drop)
3. Return JSON response in this exact format:
{
  "collection": "collection_name",
  "operation": "find|findOne|countDocuments|distinct|aggregate",
  "query": {
    "operation": "find",
    "filter": {},
    "options": {},
    "pipeline": []
  },
  "explanation": "Clear explanation of what this query does",
  "mongoShell": "db.collection.find({})"
}

Examples:
- "How many users are there?" → countDocuments on users collection
- "Find all active users" → find with filter {active: true}
- "Get unique cities" → distinct operation
- "Show recent orders" → find with sort and limit

Respond with valid JSON only:`;
  }

  // Parse AI response and validate
  parseAIResponse(response) {
    try {
      // Clean response (remove markdown if present)
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);

      // Validate required fields
      if (!parsed.collection || !parsed.operation || !parsed.query) {
        throw new Error('Invalid response format from AI');
      }

      // Validate operation is read-only
      const allowedOps = ['find', 'findOne', 'countDocuments', 'distinct', 'aggregate'];
      if (!allowedOps.includes(parsed.operation)) {
        throw new Error('Unsafe operation detected');
      }

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // Generate sample questions for a database
  async generateSampleQuestions(collections, databaseSchema = {}) {
    const prompt = `Given these MongoDB collections: ${collections.map(c => c.name).join(', ')}

Generate 5 sample natural language questions that users might ask about this database. 
Make them realistic and diverse (counting, filtering, aggregating, etc.).

Return as JSON array of strings:
["question1", "question2", ...]`;

    try {
      const response = await this.model.invoke(prompt);
      const questions = JSON.parse(response.content);
      return { success: true, questions };
    } catch (error) {
      // Fallback sample questions
      return {
        success: true,
        questions: [
          'How many documents are in the database?',
          'Show me the most recent records',
          'What are the unique values in the status field?',
          'Count documents by category',
          'Find records from the last 30 days',
        ],
      };
    }
  }

  // Explain query results
  async explainResults(query, results, question) {
    const prompt = `Explain these MongoDB query results in natural language:

Original Question: "${question}"
Query Used: ${JSON.stringify(query, null, 2)}
Results: ${JSON.stringify(results, null, 2)}

Provide a clear, concise explanation of what the results mean in the context of the original question.
Keep it under 100 words and make it user-friendly.`;

    try {
      const response = await this.model.invoke(prompt);
      return { success: true, explanation: response.content };
    } catch (error) {
      return { success: false, explanation: 'Results retrieved successfully.' };
    }
  }
}

export default new AIQueryService();
