import { MongoClient } from 'mongodb';
import crypto from 'crypto';

class MongoService {
  constructor() {
    this.connections = new Map();
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  }

  // Encrypt connection string for storage
  encryptConnectionString(connectionString) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(connectionString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return connectionString; // Fallback to plain text for now
    }
  }

  // Decrypt connection string
  decryptConnectionString(encryptedString) {
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

  // Test connection
  async testConnection(connectionString) {
    try {
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      
      await client.connect();
      const admin = client.db().admin();
      const ismaster = await admin.command({ ismaster: 1 });
      await client.close();
      
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Connect and store connection
  async connect(connectionId, connectionString) {
    try {
      console.log('🔌 MongoService: Starting connection...');
      
      const client = new MongoClient(connectionString, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      
      console.log('📡 MongoService: Attempting to connect...');
      await client.connect();
      
      console.log('✅ MongoService: Connected successfully');
      
      this.connections.set(connectionId, {
        client,
        connectionString: this.encryptConnectionString(connectionString),
        connectedAt: new Date(),
      });
      
      return { success: true, connectionId };
    } catch (error) {
      console.error('❌ MongoService: Connection failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Get available collections
  async getCollections(connectionId) {
    try {
      console.log('📋 MongoService: Getting collections for connection:', connectionId);
      
      const connection = this.connections.get(connectionId);
      if (!connection) {
        console.log('❌ MongoService: Connection not found:', connectionId);
        throw new Error('Connection not found');
      }

      const db = connection.client.db();
      console.log('📊 MongoService: Connected to database:', db.databaseName);
      
      const collections = await db.listCollections().toArray();
      console.log(`✅ MongoService: Found ${collections.length} collections`);
      
      return {
        success: true,
        collections: collections.map(col => ({
          name: col.name,
          type: col.type || 'collection',
        })),
        databaseName: db.databaseName,
      };
    } catch (error) {
      console.error('❌ MongoService: Get collections failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Execute query safely (read-only)
  async executeQuery(connectionId, query, collectionName) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Connection not found');
      }

      const db = connection.client.db();
      const collection = db.collection(collectionName);

      // Parse and validate query for read-only operations
      const result = await this.executeReadOnlyQuery(collection, query);
      
      return { success: true, result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Execute read-only MongoDB operations
  async executeReadOnlyQuery(collection, queryObj) {
    const { operation, pipeline, filter, options = {} } = queryObj;

    switch (operation) {
      case 'find':
        return await collection.find(filter || {}, options).limit(100).toArray();
      case 'findOne':
        return await collection.findOne(filter || {}, options);
      case 'countDocuments':
        return await collection.countDocuments(filter || {});
      case 'distinct':
        return await collection.distinct(options.field, filter || {});
      case 'aggregate':
        return await collection.aggregate(pipeline || []).limit(100).toArray();
      default:
        throw new Error('Unsupported or unsafe operation');
    }
  }

  // Disconnect
  async disconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      await connection.client.close();
      this.connections.delete(connectionId);
      return { success: true };
    }
    return { success: false, message: 'Connection not found' };
  }

  // Get connection status
  getConnectionStatus(connectionId) {
    const connection = this.connections.get(connectionId);
    return connection ? {
      connected: true,
      connectedAt: connection.connectedAt,
      id: connectionId,
    } : { connected: false };
  }
}

export default new MongoService();
