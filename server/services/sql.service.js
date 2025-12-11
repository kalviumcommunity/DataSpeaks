import mysql from 'mysql2/promise';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import sql from 'mssql';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

const { Pool: PgPool } = pg;

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
    } else if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
      return { type: 'postgres', connectionString };
    } else if (connectionString.startsWith('sqlite://') || connectionString.endsWith('.db') || connectionString.endsWith('.sqlite')) {
      return { type: 'sqlite', connectionString: connectionString.replace('sqlite://', '') };
    } else if (connectionString.includes('Server=') || connectionString.includes('Data Source=')) {
      return { type: 'mssql', connectionString };
    } else {
      // Default to MySQL
      return { type: 'mysql', connectionString };
    }
  }

  // Test connection to any database
  async testConnection(connectionString) {
    try {
      const { type } = this.parseConnectionString(connectionString);
      console.log(`🧪 Testing ${type.toUpperCase()} connection...`);
      
      switch (type) {
        case 'mysql':
          return await this.testMySQLConnection(connectionString);
        case 'postgres':
          return await this.testPostgresConnection(connectionString);
        case 'sqlite':
          return await this.testSQLiteConnection(connectionString.replace('sqlite://', ''));
        case 'mssql':
          return await this.testMSSQLConnection(connectionString);
        default:
          throw new Error(`Unsupported database type: ${type}`);
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error);
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
  async testPostgresConnection(connectionString) {
    const pool = new PgPool({ connectionString });
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();
    return { success: true, message: 'PostgreSQL connection successful' };
  }

  // Test SQLite connection
  async testSQLiteConnection(dbPath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(err);
        } else {
          db.close();
          resolve({ success: true, message: 'SQLite connection successful' });
        }
      });
    });
  }

  // Test SQL Server connection
  async testMSSQLConnection(connectionString) {
    await sql.connect(connectionString);
    await sql.query('SELECT 1');
    await sql.close();
    return { success: true, message: 'SQL Server connection successful' };
  }

  // Connect and store connection
  async connect(connectionString) {
    try {
      const { type, connectionString: parsedConnString } = this.parseConnectionString(connectionString);
      console.log(`🔌 SQLService: Starting ${type.toUpperCase()} connection...`);
      
      const connectionId = uuidv4();
      let connection;
      let databaseName;

      switch (type) {
        case 'mysql':
          connection = await this.connectMySQL(parsedConnString);
          databaseName = this.extractDatabaseName(parsedConnString) || 'mysql';
          break;
        case 'postgres':
          connection = await this.connectPostgres(parsedConnString);
          databaseName = this.extractDatabaseName(parsedConnString) || 'postgres';
          break;
        case 'sqlite':
          connection = await this.connectSQLite(parsedConnString);
          databaseName = parsedConnString.split('/').pop().replace('.db', '').replace('.sqlite', '');
          break;
        case 'mssql':
          connection = await this.connectMSSQL(parsedConnString);
          databaseName = this.extractDatabaseName(parsedConnString) || 'master';
          break;
        default:
          throw new Error(`Unsupported database type: ${type}`);
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
  async connectPostgres(connectionString) {
    const pool = new PgPool({ connectionString });
    const client = await pool.connect();
    return { pool, client };
  }

  // Create SQLite connection
  async connectSQLite(dbPath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  }

  // Create SQL Server connection
  async connectMSSQL(connectionString) {
    const pool = await sql.connect(connectionString);
    return pool;
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

  // Get available tables from any database
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
        case 'mysql': {
          const [mysqlRows] = await connection.execute('SHOW TABLES');
          tables = mysqlRows.map(row => ({
            name: Object.values(row)[0],
            type: 'table'
          }));
          break;
        }
        case 'postgres': {
          const result = await connection.client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
          `);
          tables = result.rows.map(row => ({
            name: row.table_name,
            type: 'table'
          }));
          break;
        }
        case 'sqlite': {
          tables = await new Promise((resolve, reject) => {
            connection.all(
              "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
              (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => ({ name: row.name, type: 'table' })));
              }
            );
          });
          break;
        }
        case 'mssql': {
          const result = await connection.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
          `);
          tables = result.recordset.map(row => ({
            name: row.TABLE_NAME,
            type: 'table'
          }));
          break;
        }
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

  // Execute query on any database
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
        case 'mysql': {
          const [mysqlRows] = await connection.execute(query, parameters);
          result = Array.isArray(mysqlRows) ? mysqlRows : [mysqlRows];
          break;
        }
        case 'postgres': {
          const pgResult = await connection.client.query(query, parameters);
          result = pgResult.rows;
          break;
        }
        case 'sqlite': {
          result = await new Promise((resolve, reject) => {
            connection.all(query, parameters, (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });
          break;
        }
        case 'mssql': {
          const msResult = await connection.query(query);
          result = msResult.recordset;
          break;
        }
        default:
          throw new Error(`Unsupported database type: ${type}`);
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
        schema[table.name] = await this.getTableColumns(connectionId, table.name, connection, type);
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
  async getTableColumns(connectionId, tableName, connection, type) {
    try {
      let columns = [];

      switch (type) {
        case 'mysql': {
          const [mysqlCols] = await connection.execute(`DESCRIBE ${tableName}`);
          columns = mysqlCols.map(col => ({
            name: col.Field,
            type: col.Type,
            nullable: col.Null === 'YES',
            key: col.Key,
            default: col.Default,
          }));
          break;
        }
        case 'postgres': {
          const result = await connection.client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);
          columns = result.rows.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
          }));
          break;
        }
        case 'sqlite': {
          columns = await new Promise((resolve, reject) => {
            connection.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
              if (err) reject(err);
              else resolve(rows.map(col => ({
                name: col.name,
                type: col.type,
                nullable: col.notnull === 0,
                key: col.pk === 1 ? 'PRI' : '',
                default: col.dflt_value,
              })));
            });
          });
          break;
        }
        case 'mssql': {
          const result = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${tableName}'
            ORDER BY ORDINAL_POSITION
          `);
          columns = result.recordset.map(col => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === 'YES',
            default: col.COLUMN_DEFAULT,
          }));
          break;
        }
      }
      
      return columns;
    } catch (error) {
      console.error(`❌ SQLService: Failed to get columns for table ${tableName}:`, error.message);
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
        case 'postgres':
          connection.client.release();
          await connection.pool.end();
          break;
        case 'sqlite':
          await new Promise((resolve, reject) => {
            connection.close((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
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
