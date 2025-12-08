import { ChatOllama } from '@langchain/ollama';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class SQLQueryService {
  constructor() {
    this.model = new ChatOllama({
      model: 'mistral',
      baseUrl: 'http://localhost:11434',
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

  // Explain query results in natural language with insights
  async explainResults(query, results, question, dbType = 'mysql') {
    const resultsArray = Array.isArray(results) ? results : [results];
    const dataAnalysis = this.analyzeData(resultsArray);
    
    const prompt = `You are a data analyst explaining SQL query results to a non-technical business user.

DATABASE CONTEXT:
- Database Type: ${dbType.toUpperCase()}
- Original Question: "${question}"
- SQL Query: ${query}

RESULTS SUMMARY:
- Total Records: ${resultsArray.length}
- Column Count: ${dataAnalysis.columnCount}
- Sample Data: ${JSON.stringify(resultsArray.slice(0, 5), null, 2)}

DATA ANALYSIS:
${JSON.stringify(dataAnalysis, null, 2)}

YOUR TASK:
1. Answer the original question directly in plain English
2. Highlight key insights, trends, or patterns you notice
3. Mention notable numbers (totals, averages, top values)
4. If there are percentage changes or comparisons, explain them
5. Point out any surprises or interesting findings
6. Keep it conversational and business-focused (not technical)

FORMAT YOUR RESPONSE AS:
📊 **Direct Answer**: [One sentence answering the question]

💡 **Key Insights**:
- [Insight 1 with specific numbers]
- [Insight 2 with context]
- [Insight 3 if applicable]

📈 **What This Means**: [Brief business context or recommendation]

Keep under 200 words. Use emojis sparingly. Be specific with numbers.`;

    try {
      const response = await this.model.invoke(prompt);
      return { 
        success: true, 
        explanation: response.content,
        analysis: dataAnalysis
      };
    } catch (error) {
      console.error('SQL explanation error:', error);
      return { 
        success: false, 
        explanation: `✅ Query executed successfully and returned ${resultsArray.length} result(s).\n\n${this.generateBasicInsight(resultsArray, question)}`,
        analysis: dataAnalysis
      };
    }
  }

  // Analyze data to find patterns and insights
  analyzeData(results) {
    if (!results || results.length === 0) {
      return { columnCount: 0, hasData: false };
    }

    const firstRow = results[0];
    const columns = Object.keys(firstRow);
    const analysis = {
      columnCount: columns.length,
      rowCount: results.length,
      hasData: true,
      columns: {},
      patterns: []
    };

    // Analyze each column
    columns.forEach(col => {
      const values = results.map(row => row[col]).filter(v => v !== null && v !== undefined);
      const uniqueValues = [...new Set(values)];
      
      analysis.columns[col] = {
        type: this.detectColumnType(values),
        uniqueCount: uniqueValues.length,
        hasNulls: values.length < results.length,
      };

      // Add statistics for numeric columns
      if (this.detectColumnType(values) === 'numeric') {
        const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          analysis.columns[col].min = Math.min(...numbers);
          analysis.columns[col].max = Math.max(...numbers);
          analysis.columns[col].avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          analysis.columns[col].sum = numbers.reduce((a, b) => a + b, 0);
        }
      }

      // Find top values for categorical columns
      if (this.detectColumnType(values) === 'categorical' && uniqueValues.length <= 20) {
        const frequency = {};
        values.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
        analysis.columns[col].topValues = Object.entries(frequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count, percentage: ((count / results.length) * 100).toFixed(1) }));
      }
    });

    // Detect patterns
    if (results.length > 1) {
      // Check for time series
      const dateColumns = columns.filter(col => 
        this.detectColumnType(results.map(r => r[col])) === 'date'
      );
      if (dateColumns.length > 0) {
        analysis.patterns.push('time_series');
      }

      // Check for aggregations (single row with aggregate functions)
      if (results.length === 1 && columns.some(col => 
        col.toLowerCase().includes('count') || 
        col.toLowerCase().includes('sum') || 
        col.toLowerCase().includes('avg') ||
        col.toLowerCase().includes('total')
      )) {
        analysis.patterns.push('aggregation');
      }

      // Check for ranking (has sequential or ranked data)
      if (columns.some(col => col.toLowerCase().includes('rank') || col.toLowerCase().includes('top'))) {
        analysis.patterns.push('ranking');
      }
    }

    return analysis;
  }

  // Detect column data type
  detectColumnType(values) {
    if (!values || values.length === 0) return 'unknown';
    
    const sampleValues = values.slice(0, Math.min(100, values.length));
    
    // Check if numeric
    const numericCount = sampleValues.filter(v => 
      !isNaN(parseFloat(v)) && isFinite(v)
    ).length;
    if (numericCount / sampleValues.length > 0.8) return 'numeric';
    
    // Check if date
    const dateCount = sampleValues.filter(v => {
      const d = new Date(v);
      return d instanceof Date && !isNaN(d);
    }).length;
    if (dateCount / sampleValues.length > 0.8) return 'date';
    
    // Check if boolean
    const boolCount = sampleValues.filter(v => 
      v === true || v === false || v === 0 || v === 1 || 
      (typeof v === 'string' && ['true', 'false', 'yes', 'no'].includes(v.toLowerCase()))
    ).length;
    if (boolCount / sampleValues.length > 0.8) return 'boolean';
    
    // Check if categorical (limited unique values)
    const uniqueValues = [...new Set(sampleValues)];
    if (uniqueValues.length <= Math.min(20, sampleValues.length * 0.5)) {
      return 'categorical';
    }
    
    return 'text';
  }

  // Generate basic insight when AI fails
  generateBasicInsight(results, question) {
    if (!results || results.length === 0) {
      return '📭 No data found matching your criteria.';
    }

    const columns = Object.keys(results[0]);
    const insights = [];

    // Count insight
    if (results.length === 1 && columns.some(col => col.toLowerCase().includes('count'))) {
      const countCol = columns.find(col => col.toLowerCase().includes('count'));
      insights.push(`💡 Found ${results[0][countCol]} records.`);
    } else if (results.length > 1) {
      insights.push(`📊 Found ${results.length} records.`);
    }

    // Numeric insights
    columns.forEach(col => {
      const values = results.map(row => row[col]).filter(v => v !== null);
      if (values.length > 0 && !isNaN(parseFloat(values[0]))) {
        const numbers = values.map(v => parseFloat(v));
        const sum = numbers.reduce((a, b) => a + b, 0);
        const avg = sum / numbers.length;
        const max = Math.max(...numbers);
        const min = Math.min(...numbers);
        
        if (col.toLowerCase().includes('total') || col.toLowerCase().includes('sum')) {
          insights.push(`💰 Total ${col}: ${sum.toLocaleString()}`);
        } else if (col.toLowerCase().includes('avg') || col.toLowerCase().includes('average')) {
          insights.push(`📊 Average ${col}: ${avg.toFixed(2)}`);
        } else if (results.length > 5) {
          insights.push(`📈 ${col} ranges from ${min} to ${max} (avg: ${avg.toFixed(2)})`);
        }
      }
    });

    return insights.length > 0 ? insights.join('\n') : '📋 Data retrieved successfully.';
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
