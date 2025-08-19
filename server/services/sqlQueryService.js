import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class SQLQueryService {
  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash',
      temperature: 0.1,
    });
  }

  // Convert natural language to SQL query
  async naturalLanguageToSQL(question, tables, databaseSchema = {}, dbType = 'mysql') {
    const prompt = this.buildSQLPrompt(question, tables, databaseSchema, dbType);
    
    try {
      const response = await this.model.invoke(prompt);
      const queryResult = this.parseAIResponse(response.content);
      
      return {
        success: true,
        sqlQuery: queryResult.query,
        explanation: queryResult.explanation,
        table: queryResult.table,
        operation: queryResult.operation,
        parameters: queryResult.parameters || [],
      };
    } catch (error) {
      console.error('AI SQL Query generation error:', error);
      return {
        success: false,
        error: error.message,
        fallbackQuery: this.generateFallbackQuery(question, tables),
      };
    }
  }

  // Build comprehensive SQL prompt
  buildSQLPrompt(question, tables, databaseSchema, dbType) {
    const dbSpecificSyntax = this.getDBSpecificSyntax(dbType);
    
    return `You are a ${dbType.toUpperCase()} SQL expert. Convert the following natural language question into a safe SQL query.

Available Tables: ${tables.map(t => t.name).join(', ')}

Database Type: ${dbType.toUpperCase()}
Database Schema: ${JSON.stringify(databaseSchema, null, 2)}

Question: "${question}"

IMPORTANT SAFETY RULES:
1. ONLY use READ-ONLY operations: SELECT queries only
2. NO write operations (INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE)
3. Use prepared statement placeholders for dynamic values
4. Apply LIMIT clauses to prevent large result sets (default: LIMIT 100)
5. Use proper JOIN syntax when querying multiple tables
6. Include proper error handling considerations

Database-Specific Syntax for ${dbType.toUpperCase()}:
${dbSpecificSyntax}

Return JSON response in this exact format:
{
  "table": "primary_table_name",
  "operation": "SELECT",
  "query": "SELECT * FROM table_name WHERE condition LIMIT 100",
  "explanation": "Clear explanation of what this query does",
  "parameters": [],
  "estimatedRows": "estimated number of rows this might return",
  "queryType": "simple|join|aggregate|subquery"
}

Examples based on question type:
- "How many users are there?" → SELECT COUNT(*) FROM users
- "Find all active users" → SELECT * FROM users WHERE status = 'active' LIMIT 100
- "Show recent orders with customer names" → SELECT o.*, c.name FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 50
- "Top 10 products by sales" → SELECT product_name, SUM(quantity) as total_sales FROM order_items GROUP BY product_name ORDER BY total_sales DESC LIMIT 10

Respond with valid JSON only:`;
  }

  // Database-specific syntax helpers
  getDBSpecificSyntax(dbType) {
    const syntaxGuides = {
      mysql: `
- Use backticks for identifiers: \`table_name\`
- Date functions: NOW(), DATE_SUB(), YEAR(), MONTH()
- String functions: CONCAT(), SUBSTRING(), LOWER()
- Limit syntax: LIMIT 100
- Case insensitive by default`,
      
      postgresql: `
- Use double quotes for identifiers: "table_name"
- Date functions: NOW(), CURRENT_DATE, EXTRACT()
- String functions: CONCAT(), SUBSTRING(), LOWER()
- Limit syntax: LIMIT 100
- Case sensitive identifiers`,
      
      sqlite: `
- Simple identifier quoting: [table_name] or "table_name"
- Date functions: datetime('now'), date()
- String functions: || for concatenation, substr(), lower()
- Limit syntax: LIMIT 100
- Dynamic typing`,
      
      mssql: `
- Use square brackets: [table_name]
- Date functions: GETDATE(), DATEADD(), YEAR()
- String functions: CONCAT(), SUBSTRING(), LOWER()
- Limit syntax: TOP 100 or OFFSET/FETCH
- Case insensitive by default`
    };

    return syntaxGuides[dbType] || syntaxGuides.mysql;
  }

  // Parse AI response and validate
  parseAIResponse(response) {
    try {
      // Clean response (remove markdown if present)
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```sql\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!parsed.query || !parsed.operation || !parsed.table) {
        throw new Error('Invalid response format from AI');
      }

      // Security validation - ensure only SELECT queries
      if (!parsed.query.trim().toUpperCase().startsWith('SELECT')) {
        throw new Error('Only SELECT queries are allowed for security');
      }

      // Add safety limit if not present
      if (!parsed.query.toUpperCase().includes('LIMIT') && 
          !parsed.query.toUpperCase().includes('TOP ')) {
        parsed.query += ' LIMIT 100';
      }

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // Generate fallback query for common questions
  generateFallbackQuery(question, tables) {
    const lowerQuestion = question.toLowerCase();
    const firstTable = tables[0]?.name || 'table';
    
    if (lowerQuestion.includes('count') || lowerQuestion.includes('how many')) {
      return {
        query: `SELECT COUNT(*) as total FROM ${firstTable}`,
        explanation: 'Count all records in the table',
        operation: 'SELECT',
        table: firstTable,
      };
    }
    
    if (lowerQuestion.includes('all') || lowerQuestion.includes('show')) {
      return {
        query: `SELECT * FROM ${firstTable} LIMIT 100`,
        explanation: 'Show all records with limit',
        operation: 'SELECT',
        table: firstTable,
      };
    }

    return {
      query: `SELECT * FROM ${firstTable} LIMIT 10`,
      explanation: 'Default query to show sample data',
      operation: 'SELECT',
      table: firstTable,
    };
  }

  // Generate sample questions based on database schema
  generateSampleQuestions(tables, databaseSchema = {}) {
    const samples = [
      'How many records are in the database?',
      'Show me the first 10 records',
      'What are the column names in each table?',
    ];

    // Add table-specific questions
    tables.forEach(table => {
      samples.push(`How many records are in ${table.name}?`);
      samples.push(`Show me recent records from ${table.name}`);
    });

    // Add schema-aware questions if we have column information
    if (databaseSchema && Object.keys(databaseSchema).length > 0) {
      Object.entries(databaseSchema).forEach(([tableName, columns]) => {
        if (columns.some(col => col.name.includes('created') || col.name.includes('date'))) {
          samples.push(`Show recent records from ${tableName} ordered by date`);
        }
        if (columns.some(col => col.name.includes('status'))) {
          samples.push(`What are the different status values in ${tableName}?`);
        }
        if (columns.some(col => col.name.includes('name') || col.name.includes('title'))) {
          samples.push(`Find records in ${tableName} with specific names`);
        }
      });
    }

    return {
      success: true,
      questions: samples.slice(0, 8), // Limit to 8 sample questions
    };
  }

  // Explain query results in natural language
  async explainResults(query, results, question, dbType = 'mysql') {
    const prompt = `Explain these SQL query results in natural language:

Database Type: ${dbType.toUpperCase()}
Original Question: "${question}"
SQL Query Used: ${query}
Number of Results: ${Array.isArray(results) ? results.length : 1}
Sample Results: ${JSON.stringify(Array.isArray(results) ? results.slice(0, 3) : results, null, 2)}

Provide a clear, concise explanation of what the results mean in the context of the original question.
Include insights about the data if apparent from the results.
Keep it under 150 words and make it user-friendly.`;

    try {
      const response = await this.model.invoke(prompt);
      return { success: true, explanation: response.content };
    } catch (error) {
      console.error('SQL explanation error:', error);
      return { 
        success: false, 
        explanation: `Query executed successfully and returned ${Array.isArray(results) ? results.length : 1} result(s).`
      };
    }
  }

  // Validate SQL query for security
  validateSQLSecurity(query) {
    const dangerousKeywords = [
      'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 
      'TRUNCATE', 'REPLACE', 'MERGE', 'EXEC', 'EXECUTE',
      'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK'
    ];

    const upperQuery = query.toUpperCase();
    
    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        return {
          valid: false,
          reason: `Query contains prohibited keyword: ${keyword}. Only SELECT queries are allowed.`
        };
      }
    }

    if (!upperQuery.trim().startsWith('SELECT')) {
      return {
        valid: false,
        reason: 'Query must start with SELECT. Only read-only operations are allowed.'
      };
    }

    return { valid: true };
  }
}

export default new SQLQueryService();
