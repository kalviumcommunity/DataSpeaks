import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import sqlService from '../services/sqlService.js';
import sqlQueryService from '../services/sqlQueryService.js';

const router = express.Router();

// Test SQL database connection
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 SQL connection test request received');
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string is required' });
    }

    console.log('🔗 Testing SQL connection...');
    const result = await sqlService.testConnection(connectionString);
    
    console.log('✅ SQL test result:', result);
    res.json(result);
  } catch (error) {
    console.error('💥 SQL test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Connect to SQL database
router.post('/connect', async (req, res) => {
  try {
    console.log('📡 SQL connection request received');
    const { connectionString } = req.body;
    
    if (!connectionString) {
      console.log('❌ No connection string provided');
      return res.status(400).json({ error: 'Connection string is required' });
    }

    console.log('🔗 Attempting to connect to SQL database...');
    
    const result = await sqlService.connect(connectionString);
    
    console.log('🔌 SQL Connection result:', result);
    
    if (result.success) {
      // Get tables info
      console.log('📋 Getting SQL tables...');
      const tablesResult = await sqlService.getTables(result.connectionId);
      
      console.log('✅ SQL Tables result:', tablesResult);
      
      res.json({
        success: true,
        connectionId: result.connectionId,
        databaseType: result.databaseType,
        databaseName: result.databaseName,
        ...tablesResult,
      });
    } else {
      console.log('❌ SQL Connection failed:', result.message);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('💥 SQL Connect endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tables for a SQL connection
router.get('/:connectionId/tables', async (req, res) => {
  try {
    console.log('📋 Getting tables for SQL connection:', req.params.connectionId);
    const { connectionId } = req.params;
    const result = await sqlService.getTables(connectionId);
    res.json(result);
  } catch (error) {
    console.error('❌ Get SQL tables error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get schema for a SQL connection
router.get('/:connectionId/schema', async (req, res) => {
  try {
    console.log('📊 Getting schema for SQL connection:', req.params.connectionId);
    const { connectionId } = req.params;
    const result = await sqlService.getSchema(connectionId);
    res.json(result);
  } catch (error) {
    console.error('❌ Get SQL schema error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Natural language SQL query
router.post('/:connectionId/query', async (req, res) => {
  try {
    console.log('🤖 SQL Natural language query request');
    const { connectionId } = req.params;
    const { question, tables, schema } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('📝 Question:', question);
    console.log('📋 Available tables:', tables?.length || 0);

    // Get connection info to determine database type
    const connectionInfo = sqlService.getConnectionInfo(connectionId);
    if (!connectionInfo) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const dbType = connectionInfo.databaseType;
    console.log('🗄️ Database type:', dbType);

    // Convert natural language to SQL using AI
    console.log('🧠 Converting natural language to SQL...');
    const aiResult = await sqlQueryService.naturalLanguageToSQL(
      question, 
      tables || [], 
      schema || {},
      dbType
    );
    
    console.log('✅ AI SQL conversion result:', aiResult);

    if (!aiResult.success) {
      return res.status(400).json({
        error: 'Failed to generate SQL query',
        details: aiResult.error,
        fallbackQuery: aiResult.fallbackQuery
      });
    }

    // Validate SQL query for security
    const securityCheck = sqlQueryService.validateSQLSecurity(aiResult.sqlQuery);
    if (!securityCheck.valid) {
      console.error('🚫 SQL Security validation failed:', securityCheck.reason);
      return res.status(403).json({
        error: 'Query rejected for security reasons',
        reason: securityCheck.reason
      });
    }

    // Execute the SQL query
    console.log('🔍 Executing SQL query...');
    const queryResult = await sqlService.executeQuery(
      connectionId, 
      aiResult.sqlQuery, 
      aiResult.parameters || []
    );
    
    console.log('📊 SQL Query execution result:', {
      success: queryResult.success,
      rowCount: queryResult.rowCount
    });

    if (!queryResult.success) {
      return res.status(500).json({
        error: 'Query execution failed',
        details: queryResult.message,
        query: aiResult.sqlQuery
      });
    }

    // Get AI explanation of results
    console.log('💭 Getting AI explanation of results...');
    const explanationResult = await sqlQueryService.explainResults(
      aiResult.sqlQuery,
      queryResult.data,
      question,
      dbType
    );

    res.json({
      success: true,
      question: question,
      sqlQuery: aiResult.sqlQuery,
      explanation: aiResult.explanation,
      results: queryResult.data,
      rowCount: queryResult.rowCount,
      databaseType: dbType,
      aiExplanation: explanationResult.success ? explanationResult.explanation : null,
      metadata: {
        operation: aiResult.operation,
        table: aiResult.table,
        queryType: aiResult.queryType || 'simple',
        executionTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 SQL Query endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error during query processing',
      details: error.message 
    });
  }
});

// Execute raw SQL query (for advanced users)
router.post('/:connectionId/execute', async (req, res) => {
  try {
    console.log('⚡ Raw SQL execution request');
    const { connectionId } = req.params;
    const { query, parameters } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    // Validate SQL query for security
    const securityCheck = sqlQueryService.validateSQLSecurity(query);
    if (!securityCheck.valid) {
      console.error('🚫 Raw SQL Security validation failed:', securityCheck.reason);
      return res.status(403).json({
        error: 'Query rejected for security reasons',
        reason: securityCheck.reason
      });
    }

    console.log('🔍 Executing raw SQL query...');
    const result = await sqlService.executeQuery(connectionId, query, parameters || []);
    
    if (result.success) {
      res.json({
        success: true,
        results: result.data,
        rowCount: result.rowCount,
        query: query,
        executionTime: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Query execution failed',
        details: result.message,
        query: query
      });
    }
  } catch (error) {
    console.error('💥 Raw SQL execution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate sample questions based on database schema
router.get('/:connectionId/sample-questions', async (req, res) => {
  try {
    console.log('❓ Generating sample questions for SQL connection:', req.params.connectionId);
    const { connectionId } = req.params;
    
    // Get tables and schema
    const tablesResult = await sqlService.getTables(connectionId);
    const schemaResult = await sqlService.getSchema(connectionId);
    
    if (!tablesResult.success) {
      return res.status(500).json({ error: 'Failed to get database tables' });
    }

    const sampleQuestions = sqlQueryService.generateSampleQuestions(
      tablesResult.tables,
      schemaResult.success ? schemaResult.schema : {}
    );
    
    res.json(sampleQuestions);
  } catch (error) {
    console.error('❌ Sample questions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get connection info
router.get('/:connectionId/info', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const info = sqlService.getConnectionInfo(connectionId);
    
    if (!info) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.json(info);
  } catch (error) {
    console.error('❌ Get SQL connection info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect from SQL database
router.delete('/:connectionId/disconnect', async (req, res) => {
  try {
    console.log('🔌 SQL Disconnection request for:', req.params.connectionId);
    const { connectionId } = req.params;
    const result = await sqlService.disconnect(connectionId);
    res.json(result);
  } catch (error) {
    console.error('❌ SQL Disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all SQL connections
router.get('/connections/list', async (req, res) => {
  try {
    const connections = sqlService.listConnections();
    res.json({
      success: true,
      connections: connections,
      count: connections.length
    });
  } catch (error) {
    console.error('❌ List SQL connections error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
