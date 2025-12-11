import { ChatOllama } from '@langchain/ollama';
import dotenv from 'dotenv';

dotenv.config();

class MongoDBQueryService {
  constructor() {
    this.model = new ChatOllama({
      model: 'mistral',
      baseUrl: 'http://localhost:11434',
      temperature: 0.1,
    });
  }

  // Convert natural language to MongoDB query
  async naturalLanguageToMQL(question, collections, schema = {}) {
    const prompt = this.buildMQLPrompt(question, collections, schema);
    
    try {
      const response = await this.model.invoke(prompt);
      const queryResult = this.parseAIResponse(response.content, collections);
      
      return {
        success: true,
        query: queryResult.query,
        explanation: queryResult.explanation,
        collection: queryResult.collection,
        operation: queryResult.operation,
      };
    } catch (error) {
      console.error('AI MongoDB Query generation error:', error);
      return {
        success: false,
        error: error.message,
        fallbackQuery: this.generateFallbackQuery(question, collections),
      };
    }
  }

  // Build MongoDB query prompt
  buildMQLPrompt(question, collections, schema) {
    const collectionList = collections && collections.length > 0 
      ? collections.map(c => c.name || c).join(', ')
      : 'No collections found';
    
    // Find best matching collection for context
    const bestMatch = this.findBestCollection(question, collections);
    
    return `You are a MongoDB query expert. Convert this question into a MongoDB query.

Available Collections: ${collectionList}

Question: "${question}"

CRITICAL RULES:
- ONLY use collections from the Available Collections list above
- NEVER use system collections (system.*, admin, local, config)
- If question asks about "database" or "all data", count documents in ONE collection
- Choose the BEST matching collection from the list

Collection Matching:
- If question mentions "user", use "users" collection
- If question mentions "contract", use "contracts" collection  
- If question mentions "message", use "messages" collection
- Match singular to plural (profile → profiles, project → projects)

Query Rules:
- Only operations: find, count, aggregate, distinct
- Add limit: 100 for find operations
- Return ONLY valid JSON, no explanation outside JSON

Required format:
{
  "collection": "exact_collection_name_from_list",
  "operation": "find",
  "query": {
    "filter": {},
    "limit": 100
  },
  "explanation": "What the query does"
}

Examples:
Q: "How many users?" → {"collection":"users","operation":"count","query":{"filter":{}},"explanation":"Count all users"}
Q: "Show contract" → {"collection":"contracts","operation":"find","query":{"filter":{},"limit":100},"explanation":"Show all contracts"}
Q: "Find active profiles" → {"collection":"profiles","operation":"find","query":{"filter":{"status":"active"},"limit":100},"explanation":"Get active profiles"}

Your JSON response:`;
  }

  // Parse AI response
  parseAIResponse(response, collections = []) {
    try {
      console.log('Raw AI Response:', response);
      
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      console.log('Cleaned Response:', cleanResponse);

      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!parsed.collection) {
        throw new Error('Missing collection name in AI response');
      }
      if (!parsed.operation) {
        throw new Error('Missing operation in AI response');
      }
      if (!parsed.query && parsed.operation !== 'count') {
        throw new Error('Missing query object in AI response');
      }

      // Validate collection exists (try to match if not exact)
      const availableCollections = collections.map(c => c.name || c);
      const collectionLower = parsed.collection.toLowerCase();
      
      // Block system collections
      if (parsed.collection.startsWith('system.') || 
          parsed.collection === 'admin' || 
          parsed.collection === 'local' || 
          parsed.collection === 'config') {
        console.warn(`AI attempted to query system collection: ${parsed.collection}`);
        // Use first available collection instead
        if (availableCollections.length > 0) {
          parsed.collection = availableCollections[0];
          console.log(`Redirected to: ${parsed.collection}`);
        } else {
          throw new Error('No valid collections available');
        }
      }
      
      if (!availableCollections.includes(parsed.collection)) {
        // Try to find a match
        const match = availableCollections.find(c => 
          c.toLowerCase() === collectionLower ||
          c.toLowerCase() === collectionLower + 's' ||
          c.toLowerCase() + 's' === collectionLower ||
          c.toLowerCase().includes(collectionLower)
        );
        
        if (match) {
          console.log(`Collection mismatch: "${parsed.collection}" → "${match}"`);
          parsed.collection = match;
        } else {
          console.warn(`Collection "${parsed.collection}" not found. Available: ${availableCollections.join(', ')}`);
          // Fallback to first available collection
          if (availableCollections.length > 0) {
            parsed.collection = availableCollections[0];
            console.log(`Using fallback collection: ${parsed.collection}`);
          } else {
            throw new Error('No valid collections available');
          }
        }
      }

      // Ensure read-only operations
      const allowedOps = ['find', 'aggregate', 'count', 'distinct'];
      if (!allowedOps.includes(parsed.operation)) {
        throw new Error('Only read-only operations are allowed');
      }

      // Ensure query object exists
      if (!parsed.query) {
        parsed.query = { filter: {} };
      }

      // Ensure limits are applied for find operations
      if (parsed.operation === 'find') {
        if (typeof parsed.query === 'object' && !parsed.query.limit) {
          parsed.query.limit = 100;
        }
      }

      // Ensure explanation exists
      if (!parsed.explanation) {
        parsed.explanation = `Execute ${parsed.operation} operation on ${parsed.collection} collection`;
      }

      return parsed;
    } catch (error) {
      console.error('Parse error:', error);
      console.error('Response that failed:', response);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // Find best matching collection name
  findBestCollection(question, collections) {
    const lowerQuestion = question.toLowerCase();
    const words = lowerQuestion.split(/\s+/);
    
    // Try to find exact match
    for (const coll of collections) {
      const collName = (coll.name || coll).toLowerCase();
      if (words.includes(collName)) {
        return coll.name || coll;
      }
    }
    
    // Try singular/plural matching
    for (const word of words) {
      for (const coll of collections) {
        const collName = (coll.name || coll).toLowerCase();
        // Check if word matches collection (with or without 's')
        if (collName === word || collName === word + 's' || collName + 's' === word) {
          return coll.name || coll;
        }
        // Check if collection name contains the word
        if (collName.includes(word) && word.length > 3) {
          return coll.name || coll;
        }
      }
    }
    
    // Default to first collection
    return collections[0]?.name || collections[0] || 'collection';
  }

  // Generate fallback query
  generateFallbackQuery(question, collections) {
    const lowerQuestion = question.toLowerCase();
    const bestCollection = this.findBestCollection(question, collections);
    
    if (lowerQuestion.includes('count') || lowerQuestion.includes('how many')) {
      return {
        collection: bestCollection,
        operation: 'count',
        query: { filter: {} },
        explanation: `Count all documents in ${bestCollection} collection`,
      };
    }
    
    if (lowerQuestion.includes('all') || lowerQuestion.includes('show')) {
      return {
        collection: bestCollection,
        operation: 'find',
        query: {
          filter: {},
          projection: {},
          sort: {},
          limit: 100,
        },
        explanation: `Show all documents from ${bestCollection} collection`,
      };
    }

    return {
      collection: bestCollection,
      operation: 'find',
      query: {
        filter: {},
        projection: {},
        sort: {},
        limit: 10,
      },
      explanation: `Show sample documents from ${bestCollection} collection`,
    };
  }

  // Generate sample questions
  generateSampleQuestions(collections, schema = {}) {
    const samples = [
      'How many documents are in the database?',
      'Show me the first 10 documents',
      'What fields are in each collection?',
    ];

    collections.forEach(collection => {
      samples.push(`How many documents are in ${collection.name}?`);
      samples.push(`Show me recent documents from ${collection.name}`);
    });

    // Schema-aware questions
    if (schema && Object.keys(schema).length > 0) {
      Object.entries(schema).forEach(([collName, fields]) => {
        const fieldNames = fields.map(f => f.name);
        
        if (fieldNames.some(f => f.includes('date') || f.includes('created') || f.includes('updated'))) {
          samples.push(`Show recent ${collName} sorted by date`);
        }
        if (fieldNames.some(f => f.includes('status'))) {
          samples.push(`What are the different status values in ${collName}?`);
        }
        if (fieldNames.some(f => f.includes('name') || f.includes('title'))) {
          samples.push(`Find ${collName} with specific names`);
        }
        if (fieldNames.some(f => f.includes('price') || f.includes('amount'))) {
          samples.push(`What's the average price in ${collName}?`);
        }
      });
    }

    return {
      success: true,
      questions: samples.slice(0, 8),
    };
  }

  // Explain query results
  async explainResults(query, results, question) {
    const resultsArray = Array.isArray(results) ? results : [results];
    const dataAnalysis = this.analyzeData(resultsArray);
    
    const prompt = `You are a data analyst explaining MongoDB query results to a non-technical business user.

DATABASE CONTEXT:
- Database Type: MongoDB (NoSQL)
- Original Question: "${question}"
- MongoDB Query: ${JSON.stringify(query, null, 2)}

RESULTS SUMMARY:
- Total Documents: ${resultsArray.length}
- Field Count: ${dataAnalysis.fieldCount}
- Sample Data: ${JSON.stringify(resultsArray.slice(0, 3), null, 2)}

DATA ANALYSIS:
${JSON.stringify(dataAnalysis, null, 2)}

YOUR TASK:
1. Answer the original question directly in plain English
2. Highlight key insights, trends, or patterns
3. Mention notable numbers (totals, averages, top values)
4. Point out any surprises or interesting findings
5. Keep it conversational and business-focused

FORMAT:
📊 **Direct Answer**: [One sentence]

💡 **Key Insights**:
- [Insight 1]
- [Insight 2]

📈 **What This Means**: [Brief context]

Keep under 200 words.`;

    try {
      const response = await this.model.invoke(prompt);
      return { 
        success: true, 
        explanation: response.content,
        analysis: dataAnalysis
      };
    } catch (error) {
      console.error('MongoDB explanation error:', error);
      return { 
        success: false, 
        explanation: `✅ Query executed successfully and returned ${resultsArray.length} document(s).`,
        analysis: dataAnalysis
      };
    }
  }

  // Analyze MongoDB data
  analyzeData(results) {
    if (!results || results.length === 0) {
      return { fieldCount: 0, hasData: false };
    }

    const firstDoc = results[0];
    const fields = Object.keys(firstDoc);
    const analysis = {
      fieldCount: fields.length,
      documentCount: results.length,
      hasData: true,
      fields: {},
      patterns: []
    };

    fields.forEach(field => {
      const values = results.map(doc => doc[field]).filter(v => v !== null && v !== undefined);
      const uniqueValues = [...new Set(values.map(v => JSON.stringify(v)))].map(v => JSON.parse(v));
      
      analysis.fields[field] = {
        type: this.detectFieldType(values),
        uniqueCount: uniqueValues.length,
        hasNulls: values.length !== results.length,
        sample: uniqueValues.slice(0, 3),
      };

      if (uniqueValues.length === 1) {
        analysis.patterns.push(`${field} has constant value: ${JSON.stringify(uniqueValues[0])}`);
      }
    });

    return analysis;
  }

  // Detect field type
  detectFieldType(values) {
    if (values.length === 0) return 'unknown';
    
    const sample = values[0];
    if (Array.isArray(sample)) return 'array';
    if (sample instanceof Date) return 'date';
    if (typeof sample === 'object' && sample !== null) return 'object';
    if (typeof sample === 'number') {
      return Number.isInteger(sample) ? 'integer' : 'number';
    }
    if (typeof sample === 'boolean') return 'boolean';
    if (typeof sample === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(sample)) return 'date-string';
      if (/^[a-f0-9]{24}$/i.test(sample)) return 'objectid';
      return 'string';
    }
    return typeof sample;
  }
}

export default new MongoDBQueryService();
