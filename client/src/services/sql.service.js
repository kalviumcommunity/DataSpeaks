import { apiCall, API_ENDPOINTS } from '../config/api.config';

/**
 * SQL Service - Handles all SQL-related API calls
 * Single Responsibility: SQL API communication
 */

export const sqlService = {
  /**
   * Test SQL connection
   */
  testConnection: async (connectionString) => {
    return await apiCall(API_ENDPOINTS.SQL.TEST, {
      method: 'POST',
      body: JSON.stringify({ connectionString }),
    });
  },

  /**
   * Connect to SQL database
   */
  connect: async (connectionString) => {
    return await apiCall(API_ENDPOINTS.SQL.CONNECT, {
      method: 'POST',
      body: JSON.stringify({ connectionString }),
    });
  },

  /**
   * Get tables for a connection
   */
  getTables: async (connectionId) => {
    return await apiCall(API_ENDPOINTS.SQL.TABLES(connectionId));
  },

  /**
   * Get database schema
   */
  getSchema: async (connectionId) => {
    return await apiCall(API_ENDPOINTS.SQL.SCHEMA(connectionId));
  },

  /**
   * Execute natural language query
   */
  query: async (connectionId, question, tables, schema) => {
    return await apiCall(API_ENDPOINTS.SQL.QUERY(connectionId), {
      method: 'POST',
      body: JSON.stringify({ question, tables, schema }),
    });
  },

  /**
   * Execute raw SQL query
   */
  executeRaw: async (connectionId, query, parameters) => {
    return await apiCall(API_ENDPOINTS.SQL.EXECUTE(connectionId), {
      method: 'POST',
      body: JSON.stringify({ query, parameters }),
    });
  },

  /**
   * Get sample questions
   */
  getSampleQuestions: async (connectionId) => {
    return await apiCall(API_ENDPOINTS.SQL.SAMPLES(connectionId));
  },

  /**
   * Get connection info
   */
  getConnectionInfo: async (connectionId) => {
    return await apiCall(API_ENDPOINTS.SQL.INFO(connectionId));
  },

  /**
   * Disconnect from SQL database
   */
  disconnect: async (connectionId) => {
    return await apiCall(API_ENDPOINTS.SQL.DISCONNECT(connectionId), {
      method: 'DELETE',
    });
  },

  /**
   * List all connections
   */
  listConnections: async () => {
    return await apiCall(API_ENDPOINTS.SQL.LIST);
  },
};

export default sqlService;
