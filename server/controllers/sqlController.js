import sqlService from '../services/sql.service.js';
import sqlQueryService from '../services/sqlQuery.service.js';

/**
 * SQL Controller - Handles HTTP requests for SQL database operations
 * Single Responsibility: Request/Response handling for SQL endpoints
 */

/**
 * Test SQL database connection
 */
export const testConnection = async (req, res) => {
  try {
    console.log('🧪 SQL connection test request received');
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string is required' });
    }

    const result = await sqlService.testConnection(connectionString);
    res.json(result);
  } catch (error) {
    console.error('❌ SQL test error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Connect to SQL database
 */
export const connect = async (req, res) => {
  try {
    console.log('📡 SQL connection request received');
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string is required' });
    }

    const result = await sqlService.connect(connectionString);
    
    if (result.success) {
      const tablesResult = await sqlService.getTables(result.connectionId);
      
      res.json({
        success: true,
        connectionId: result.connectionId,
        databaseType: result.databaseType,
        databaseName: result.databaseName,
        ...tablesResult,
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ SQL connect error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get tables for a SQL connection
 */
export const getTables = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const result = await sqlService.getTables(connectionId);
    res.json(result);
  } catch (error) {
    console.error('❌ Get tables error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get schema for a SQL connection
 */
export const getSchema = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const result = await sqlService.getSchema(connectionId);
    res.json(result);
  } catch (error) {
    console.error('❌ Get schema error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Execute natural language SQL query
 */
export const executeQuery = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { question, tables, schema } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const connectionInfo = sqlService.getConnectionInfo(connectionId);
    if (!connectionInfo) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const dbType = connectionInfo.databaseType;

    // Convert natural language to SQL using AI
    const aiResult = await sqlQueryService.naturalLanguageToSQL(
      question, 
      tables || [], 
      schema || {},
      dbType
    );

    if (!aiResult.success) {
      return res.status(400).json({
        error: 'Failed to generate SQL query',
        details: aiResult.error
      });
    }

    // Validate SQL query for security
    const securityCheck = sqlQueryService.validateSQLSecurity(aiResult.sqlQuery);
    if (!securityCheck.valid) {
      return res.status(403).json({
        error: 'Query rejected for security reasons',
        reason: securityCheck.reason
      });
    }

    // Execute the SQL query
    const queryResult = await sqlService.executeQuery(
      connectionId, 
      aiResult.sqlQuery, 
      aiResult.parameters || []
    );

    if (!queryResult.success) {
      return res.status(500).json({
        error: 'Query execution failed',
        details: queryResult.message
      });
    }

    // Get AI explanation of results
    const explanationResult = await sqlQueryService.explainResults(
      aiResult.sqlQuery,
      queryResult.data,
      question,
      dbType
    );

    res.json({
      success: true,
      question,
      sqlQuery: aiResult.sqlQuery,
      explanation: aiResult.explanation,
      results: queryResult.data,
      rowCount: queryResult.rowCount,
      databaseType: dbType,
      aiExplanation: explanationResult.success ? explanationResult.explanation : null,
      metadata: {
        operation: aiResult.operation,
        table: aiResult.table,
        executionTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ SQL query error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Execute raw SQL query
 */
export const executeRawQuery = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { query, parameters } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    // Validate SQL query for security
    const securityCheck = sqlQueryService.validateSQLSecurity(query);
    if (!securityCheck.valid) {
      return res.status(403).json({
        error: 'Query rejected for security reasons',
        reason: securityCheck.reason
      });
    }

    const result = await sqlService.executeQuery(connectionId, query, parameters || []);
    
    if (result.success) {
      res.json({
        success: true,
        results: result.data,
        rowCount: result.rowCount,
        query
      });
    } else {
      res.status(500).json({
        error: 'Query execution failed',
        details: result.message
      });
    }
  } catch (error) {
    console.error('❌ Raw SQL execution error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get sample questions
 */
export const getSampleQuestions = async (req, res) => {
  try {
    const { connectionId } = req.params;
    
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
};

/**
 * Get connection info
 */
export const getConnectionInfo = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const info = sqlService.getConnectionInfo(connectionId);
    
    if (!info) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.json(info);
  } catch (error) {
    console.error('❌ Get connection info error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Disconnect from SQL database
 */
export const disconnect = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const result = await sqlService.disconnect(connectionId);
    res.json(result);
  } catch (error) {
    console.error('❌ SQL disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * List all SQL connections
 */
export const listConnections = async (req, res) => {
  try {
    const connections = sqlService.listConnections();
    res.json({
      success: true,
      connections,
      count: connections.length
    });
  } catch (error) {
    console.error('❌ List connections error:', error);
    res.status(500).json({ error: error.message });
  }
};
