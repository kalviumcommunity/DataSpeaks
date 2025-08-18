import mysql from 'mysql2/promise';
import postgres from 'pg';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mssql from 'mssql';
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
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
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
      const decipher = crypto.createDecipher(algorithm, key);
      
      let decrypted = decipher.update(encryptedString, 'hex', 'utf8');
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
    } else if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
      return { type: 'postgresql', connectionString };
    } else if (connectionString.startsWith('sqlite://') || connectionString.endsWith('.db') || connectionString.endsWith('.sqlite')) {
      return { type: 'sqlite', connectionString };
    } else if (connectionString.startsWith('mssql://') || connectionString.includes('sqlserver://')) {
      return { type: 'mssql', connectionString };
    } else {
      // Try to guess from connection string format
      if (connectionString.includes('Host=') && connectionString.includes('Database=')) {
        return { type: 'postgresql', connectionString };
      } else if (connectionString.includes('Server=') && connectionString.includes('Database=')) {
        return { type: 'mssql', connectionString };
      } else {
        return { type: 'mysql', connectionString }; // Default to MySQL
      }
    }
  }

  // Test connection to SQL database
  async testConnection(connectionString) {
    try {
      const { type } = this.parseConnectionString(connectionString);
      console.log(`🧪 Testing ${type.toUpperCase()} connection...`);
      
      switch (type) {
        case 'mysql':
          return await this.testMySQLConnection(connectionString);
        case 'postgresql':
          return await this.testPostgreSQLConnection(connectionString);
        case 'sqlite':
          return await this.testSQLiteConnection(connectionString);
        case 'mssql':
          return await this.testMSSQLConnection(connectionString);
        default:
          throw new Error('Unsupported database type');
      }
    } catch (error) {
      console.error('❌ SQL Connection test failed:', error);
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

  // Test PostgreSQL connection
  async testPostgreSQLConnection(connectionString) {
    const client = new postgres.Client(connectionString);
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return { success: true, message: 'PostgreSQL connection successful' };
  }

  // Test SQLite connection
  async testSQLiteConnection(connectionString) {
    const dbPath = connectionString.replace('sqlite://', '');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    await db.get('SELECT 1');
    await db.close();
    return { success: true, message: 'SQLite connection successful' };
  }

  // Test MS SQL Server connection
  async testMSSQLConnection(connectionString) {
    const pool = await mssql.connect(connectionString);
    await pool.request().query('SELECT 1');
    await pool.close();
    return { success: true, message: 'SQL Server connection successful' };
  }

  // Connect and store connection
  async connect(connectionString) {
    try {
      console.log('🔌 SQLService: Starting connection...');
      
      const { type } = this.parseConnectionString(connectionString);
      const connectionId = uuidv4();
      
      let connection;
      let databaseName = 'unknown';
      
      switch (type) {
        case 'mysql':
          connection = await this.connectMySQL(connectionString);
          databaseName = this.extractDatabaseName(connectionString) || 'mysql';
          break;
        case 'postgresql':
          connection = await this.connectPostgreSQL(connectionString);
          databaseName = this.extractDatabaseName(connectionString) || 'postgres';
          break;
        case 'sqlite':
          connection = await this.connectSQLite(connectionString);
          databaseName = connectionString.split('/').pop() || 'sqlite';
          break;
        case 'mssql':
          connection = await this.connectMSSQL(connectionString);
          databaseName = this.extractDatabaseName(connectionString) || 'mssql';
          break;
        default:
          throw new Error('Unsupported database type');
      }
      
      console.log(`✅ SQLService: Connected to ${type.toUpperCase()} successfully`);
      
      // Store connection
      this.connections.set(connectionId, {
        connection,
        type,
        databaseName,
        connectionString: this.encrypt(connectionString),
        connectedAt: new Date(),
      });
      
      return { 
        success: true, 
        connectionId,
        databaseType: type,
        databaseName
      };
    } catch (error) {
      console.error('❌ SQLService: Connection failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Create MySQL connection
  async connectMySQL(connectionString) {
    return await mysql.createConnection(connectionString);
  }

  // Create PostgreSQL connection
  async connectPostgreSQL(connectionString) {
    const client = new postgres.Client(connectionString);
    await client.connect();
    return client;
  }

  // Create SQLite connection
  async connectSQLite(connectionString) {
    const dbPath = connectionString.replace('sqlite://', '');
    return await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }

  // Create MS SQL Server connection
  async connectMSSQL(connectionString) {
    return await mssql.connect(connectionString);
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

  // Get available tables
  async getTables(connectionId) {
    try {
      console.log('📋 SQLService: Getting tables for connection:', connectionId);
      
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        throw new Error('Connection not found');
      }

      const { connection, type, databaseName } = connectionData;
      let tables = [];
      
      switch (type) {
        case 'mysql':
          const [mysqlRows] = await connection.execute('SHOW TABLES');
          tables = mysqlRows.map(row => ({
            name: Object.values(row)[0],
            type: 'table'
          }));
          break;
          
        case 'postgresql':
          const pgResult = await connection.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          `);
          tables = pgResult.rows.map(row => ({
            name: row.table_name,
            type: row.table_type.toLowerCase()
          }));
          break;
          
        case 'sqlite':
          const sqliteResult = await connection.all(`
            SELECT name, type FROM sqlite_master 
            WHERE type IN ('table', 'view') 
            AND name NOT LIKE 'sqlite_%'
          `);
          tables = sqliteResult.map(row => ({
            name: row.name,
            type: row.type
          }));
          break;
          
        case 'mssql':
          const mssqlResult = await connection.request().query(`
            SELECT TABLE_NAME, TABLE_TYPE 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
          `);
          tables = mssqlResult.recordset.map(row => ({
            name: row.TABLE_NAME,
            type: 'table'
          }));
          break;
      }
      
      console.log(`✅ SQLService: Found ${tables.length} tables`);
      
      return {
        success: true,
        tables,
        databaseName,
        databaseType: type,
      };
    } catch (error) {
      console.error('❌ SQLService: Get tables failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Execute SQL query
  async executeQuery(connectionId, query, parameters = []) {
    try {
      console.log('🔍 SQLService: Executing query:', query);
      
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        throw new Error('Connection not found');
      }

      const { connection, type } = connectionData;
      let result;
      
      switch (type) {
        case 'mysql':
          const [mysqlRows] = await connection.execute(query, parameters);
          result = Array.isArray(mysqlRows) ? mysqlRows : [mysqlRows];
          break;
          
        case 'postgresql':
          const pgResult = await connection.query(query, parameters);
          result = pgResult.rows;
          break;
          
        case 'sqlite':
          if (query.trim().toUpperCase().startsWith('SELECT')) {
            result = await connection.all(query, parameters);
          } else {
            result = await connection.run(query, parameters);
          }
          break;
          
        case 'mssql':
          const mssqlResult = await connection.request().query(query);
          result = mssqlResult.recordset;
          break;
          
        default:
          throw new Error('Unsupported database type for query execution');
      }
      
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

  // Get database schema information
  async getSchema(connectionId) {
    try {
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        throw new Error('Connection not found');
      }

      const { connection, type } = connectionData;
      const schema = {};
      
      const tablesResult = await this.getTables(connectionId);
      if (!tablesResult.success) {
        throw new Error('Failed to get tables');
      }

      for (const table of tablesResult.tables) {
        schema[table.name] = await this.getTableColumns(connectionId, table.name, type, connection);
      }
      
      return {
        success: true,
        schema,
        databaseType: type,
      };
    } catch (error) {
      console.error('❌ SQLService: Get schema failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Get columns for a specific table
  async getTableColumns(connectionId, tableName, type, connection) {
    try {
      let columns = [];
      
      switch (type) {
        case 'mysql':
          const [mysqlCols] = await connection.execute(`DESCRIBE ${tableName}`);
          columns = mysqlCols.map(col => ({
            name: col.Field,
            type: col.Type,
            nullable: col.Null === 'YES',
            key: col.Key,
            default: col.Default,
          }));
          break;
          
        case 'postgresql':
          const pgCols = await connection.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = $1
          `, [tableName]);
          columns = pgCols.rows.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
          }));
          break;
          
        case 'sqlite':
          const sqliteCols = await connection.all(`PRAGMA table_info(${tableName})`);
          columns = sqliteCols.map(col => ({
            name: col.name,
            type: col.type,
            nullable: !col.notnull,
            key: col.pk ? 'PRI' : '',
            default: col.dflt_value,
          }));
          break;
          
        case 'mssql':
          const mssqlCols = await connection.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '${tableName}'
          `);
          columns = mssqlCols.recordset.map(col => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === 'YES',
            default: col.COLUMN_DEFAULT,
          }));
          break;
      }
      
      return columns;
    } catch (error) {
      console.error(`❌ Failed to get columns for table ${tableName}:`, error.message);
      return [];
    }
  }

  // Disconnect from database
  async disconnect(connectionId) {
    try {
      const connectionData = this.connections.get(connectionId);
      if (!connectionData) {
        return { success: false, message: 'Connection not found' };
      }

      const { connection, type } = connectionData;
      
      switch (type) {
        case 'mysql':
          await connection.end();
          break;
        case 'postgresql':
          await connection.end();
          break;
        case 'sqlite':
          await connection.close();
          break;
        case 'mssql':
          await connection.close();
          break;
      }
      
      this.connections.delete(connectionId);
      console.log(`✅ SQLService: Disconnected ${type.toUpperCase()} connection`);
      
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
      databaseType: connectionData.type,
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
        databaseType: data.type,
        databaseName: data.databaseName,
        connectedAt: data.connectedAt,
      });
    }
    return connections;
  }
}

export default new SQLService();
