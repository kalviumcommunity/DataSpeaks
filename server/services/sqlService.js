import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

class SQLService {
  constructor() {
    this.connections = new Map();
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Encrypt connection string
  encrypt(text) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plain text (not recommended for production)
    }
  }

  // Decrypt connection string
  decrypt(encryptedString) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const parts = encryptedString.split(':');
      if (parts.length !== 2) return encryptedString;
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedString; // Fallback to treating as plain text
    }
  }

  // Parse connection string to determine database type
  parseConnectionString(connectionString) {
    if (connectionString.startsWith('mysql://')) {
      return { type: 'mysql', connectionString };
    } else {
      // Default to MySQL and assume it's a MySQL connection string
      return { type: 'mysql', connectionString };
    }
  }

  // Test connection to MySQL database
  async testConnection(connectionString) {
    try {
      console.log(`🧪 Testing MySQL connection...`);
      return await this.testMySQLConnection(connectionString);
    } catch (error) {
      console.error('❌ MySQL Connection test failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Test MySQL connection
  async testMySQLConnection(connectionString) {
    const connection = await mysql.createConnection(connectionString);
    await connection.execute('SELECT 1');
    await connection.end();
    return { success: true, message: 'MySQL connection successful' };
  }

  // Connect and store connection
  async connect(connectionString) {
    try {
      console.log('🔌 SQLService: Starting MySQL connection...');
      
      const connectionId = uuidv4();
      const connection = await this.connectMySQL(connectionString);
      const databaseName = this.extractDatabaseName(connectionString) || 'mysql';
      
      console.log(`✅ SQLService: Connected to MySQL successfully`);
      
      // Store connection
      this.connections.set(connectionId, {
        connection,
        type: 'mysql',
        databaseName,
        connectionString: this.encrypt(connectionString),
        connectedAt: new Date(),
      });
      
      return { 
        success: true, 
        connectionId,
        databaseType: 'mysql',
        databaseName
      };
    } catch (error) {
      console.error('❌ SQLService: MySQL connection failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Create MySQL connection
  async connectMySQL(connectionString) {
    return await mysql.createConnection(connectionString);
  }

  // Extract database name from connection string
  extractDatabaseName(connectionString) {
    try {
      if (connectionString.includes('Database=')) {
        const match = connectionString.match(/Database=([^;]+)/i);
        return match ? match[1] : null;
      }
      
      const url = new URL(connectionString);
      return url.pathname ? url.pathname.substring(1) : null;
    } catch {
      return null;
    }
  }

  // Get available tables from MySQL
  async getTables(connectionId) {
    try {
      console.log('📋 SQLService: Getting tables for connection:', connectionId);
      
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        throw new Error('Connection not found');
      }

      const { connection, databaseName } = connectionData;
      
      // Get MySQL tables
      const [mysqlRows] = await connection.execute('SHOW TABLES');
      const tables = mysqlRows.map(row => ({
        name: Object.values(row)[0],
        type: 'table'
      }));
      
      console.log(`✅ SQLService: Found ${tables.length} tables`);
      
      return {
        success: true,
        tables,
        databaseName,
        databaseType: 'mysql',
      };
    } catch (error) {
      console.error('❌ SQLService: Get tables failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Execute MySQL query
  async executeQuery(connectionId, query, parameters = []) {
    try {
      console.log('🔍 SQLService: Executing query:', query);
      
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        throw new Error('Connection not found');
      }

      const { connection } = connectionData;
      
      // Execute MySQL query
      const [mysqlRows] = await connection.execute(query, parameters);
      const result = Array.isArray(mysqlRows) ? mysqlRows : [mysqlRows];
      
      console.log(`✅ SQLService: Query executed successfully, ${result.length || 0} rows`);
      
      return {
        success: true,
        data: result,
        rowCount: Array.isArray(result) ? result.length : 1,
        query: query,
      };
    } catch (error) {
      console.error('❌ SQLService: Query execution failed:', error.message);
      return { 
        success: false, 
        message: error.message,
        query: query,
      };
    }
  }

  // Get MySQL database schema information
  async getSchema(connectionId) {
    try {
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        throw new Error('Connection not found');
      }

      const { connection } = connectionData;
      const schema = {};
      
      const tablesResult = await this.getTables(connectionId);
      if (!tablesResult.success) {
        throw new Error('Failed to get tables');
      }

      for (const table of tablesResult.tables) {
        schema[table.name] = await this.getTableColumns(connectionId, table.name, connection);
      }
      
      return {
        success: true,
        schema,
        databaseType: 'mysql',
      };
    } catch (error) {
      console.error('❌ SQLService: Get schema failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Get columns for a specific MySQL table
  async getTableColumns(connectionId, tableName, connection) {
    try {
      // Get MySQL table columns
      const [mysqlCols] = await connection.execute(`DESCRIBE ${tableName}`);
      const columns = mysqlCols.map(col => ({
        name: col.Field,
        type: col.Type,
        nullable: col.Null === 'YES',
        key: col.Key,
        default: col.Default,
      }));
      
      return columns;
    } catch (error) {
      console.error(`❌ SQLService: Failed to get columns for table ${tableName}:`, error.message);
      return [];
    }
  }

  // Disconnect from MySQL database
  async disconnect(connectionId) {
    try {
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        return { success: false, message: 'Connection not found' };
      }

      const { connection } = connectionData;
      
      // Close MySQL connection
      await connection.end();
      
      this.connections.delete(connectionId);
      console.log(`✅ SQLService: Disconnected MySQL connection`);
      
      return { success: true, message: 'Disconnected successfully' };
    } catch (error) {
      console.error('❌ SQLService: Disconnect failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Get connection info
  getConnectionInfo(connectionId) {
    const connectionData = this.connections.get(connectionId);
    if (!connectionData) {
      return null;
    }

    return {
      connectionId,
      databaseType: 'mysql',
      databaseName: connectionData.databaseName,
      connectedAt: connectionData.connectedAt,
      isConnected: true,
    };
  }

  // List all active connections
  listConnections() {
    const connections = [];
    for (const [id, data] of this.connections) {
      connections.push({
        connectionId: id,
        databaseType: 'mysql',
        databaseName: data.databaseName,
        connectedAt: data.connectedAt,
      });
    }
    return connections;
  }
}

export default new SQLService();
