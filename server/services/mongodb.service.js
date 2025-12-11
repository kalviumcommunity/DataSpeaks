import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

class MongoDBService {
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
      return text;
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
      return encryptedString;
    }
  }

  // Parse connection string to extract database name
  parseConnectionString(connectionString) {
    try {
      // Handle mongodb:// and mongodb+srv://
      if (connectionString.includes('mongodb')) {
        const url = new URL(connectionString);
        const pathname = url.pathname.replace('/', '');
        const dbName = pathname.split('?')[0] || 'test';
        return {
          database: dbName,
          isAtlas: connectionString.includes('mongodb+srv'),
        };
      }
      return { database: 'test', isAtlas: false };
    } catch (error) {
      console.error('Parse error:', error);
      return { database: 'test', isAtlas: false };
    }
  }

  // Test MongoDB connection
  async testConnection(connectionString) {
    let client;
    try {
      client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      await client.connect();
      await client.db().admin().ping();

      const { database } = this.parseConnectionString(connectionString);
      const db = client.db(database);
      const collections = await db.listCollections().toArray();

      await client.close();

      return {
        success: true,
        message: 'Connection successful!',
        details: {
          database,
          collections: collections.map(c => c.name),
          collectionCount: collections.length,
        },
      };
    } catch (error) {
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError);
        }
      }

      let errorMessage = 'Failed to connect to MongoDB';
      if (error.message.includes('authentication')) {
        errorMessage = 'Authentication failed. Check username and password.';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot reach MongoDB server. Check host and port.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout. Server may be unreachable.';
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message,
      };
    }
  }

  // Connect to MongoDB and store connection
  async connect(connectionString) {
    try {
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      });

      await client.connect();
      await client.db().admin().ping();

      const { database, isAtlas } = this.parseConnectionString(connectionString);
      const db = client.db(database);
      const allCollections = await db.listCollections().toArray();
      
      // Filter out system collections
      const collections = allCollections.filter(c => 
        !c.name.startsWith('system.') && 
        c.name !== 'admin' && 
        c.name !== 'local' &&
        c.name !== 'config'
      );

      const connectionId = uuidv4();
      const encryptedConnectionString = this.encrypt(connectionString);

      this.connections.set(connectionId, {
        client,
        database: db,
        databaseName: database,
        connectionString: encryptedConnectionString,
        isAtlas,
        createdAt: new Date(),
      });

      // Auto-cleanup after 1 hour
      setTimeout(() => this.disconnect(connectionId), 3600000);

      return {
        success: true,
        connectionId,
        databaseName: database,
        collections: collections.map(c => ({
          name: c.name,
          type: c.type || 'collection',
        })),
        isAtlas,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get collections for a connection
  async getCollections(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection not found. Please reconnect.');
    }

    try {
      const allCollections = await conn.database.listCollections().toArray();
      
      // Filter out system collections
      const collections = allCollections.filter(c => 
        !c.name.startsWith('system.') && 
        c.name !== 'admin' && 
        c.name !== 'local' &&
        c.name !== 'config'
      );
      
      return collections.map(c => ({
        name: c.name,
        type: c.type || 'collection',
      }));
    } catch (error) {
      throw new Error(`Failed to get collections: ${error.message}`);
    }
  }

  // Execute MongoDB query
  async executeQuery(query, connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection not found. Please reconnect.');
    }

    try {
      console.log('Executing MongoDB query:', JSON.stringify(query, null, 2));
      
      const { collection, operation, filter, projection, sort, limit, pipeline, field } = query;
      
      if (!collection) {
        throw new Error('Collection name is required');
      }
      
      if (!operation) {
        throw new Error('Operation is required');
      }
      
      // Prevent querying system collections
      if (collection.startsWith('system.') || 
          collection === 'admin' || 
          collection === 'local' || 
          collection === 'config') {
        throw new Error(`Access denied: Cannot query system collection '${collection}'`);
      }
      
      const coll = conn.database.collection(collection);
      let result;

      switch (operation) {
        case 'find':
          result = await coll
            .find(filter || {})
            .project(projection || {})
            .sort(sort || {})
            .limit(limit || 100)
            .toArray();
          break;

        case 'aggregate':
          if (!pipeline || !Array.isArray(pipeline)) {
            throw new Error('Aggregation requires a pipeline array');
          }
          result = await coll.aggregate(pipeline).toArray();
          break;

        case 'count':
          result = await coll.countDocuments(filter || {});
          break;

        case 'distinct':
          if (!field) {
            throw new Error('Distinct operation requires a field name');
          }
          result = await coll.distinct(field, filter || {});
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      console.log('Query executed successfully, results:', Array.isArray(result) ? `${result.length} documents` : result);
      
      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  // Get collection schema (sample document structure)
  async getCollectionSchema(collectionName, connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection not found. Please reconnect.');
    }

    try {
      const coll = conn.database.collection(collectionName);
      
      // Get sample documents
      const samples = await coll.find({}).limit(10).toArray();
      
      if (samples.length === 0) {
        return {
          collection: collectionName,
          fields: [],
          sampleCount: 0,
        };
      }

      // Analyze fields from samples
      const fieldSet = new Set();
      const fieldTypes = {};

      samples.forEach(doc => {
        Object.keys(doc).forEach(key => {
          fieldSet.add(key);
          const value = doc[key];
          const type = Array.isArray(value) ? 'array' : typeof value;
          
          if (!fieldTypes[key]) {
            fieldTypes[key] = new Set();
          }
          fieldTypes[key].add(type);
        });
      });

      const fields = Array.from(fieldSet).map(field => ({
        name: field,
        types: Array.from(fieldTypes[field]),
      }));

      // Get document count
      const totalCount = await coll.countDocuments();

      return {
        collection: collectionName,
        fields,
        sampleCount: samples.length,
        totalCount,
        sampleDocuments: samples.slice(0, 3), // First 3 as examples
      };
    } catch (error) {
      throw new Error(`Failed to get schema: ${error.message}`);
    }
  }

  // Disconnect and cleanup
  async disconnect(connectionId) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      try {
        await conn.client.close();
        this.connections.delete(connectionId);
        return { success: true, message: 'Disconnected successfully' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Connection not found' };
  }

  // Get connection info
  getConnectionInfo(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return null;
    }

    return {
      connectionId,
      databaseName: conn.databaseName,
      isAtlas: conn.isAtlas,
      createdAt: conn.createdAt,
    };
  }
}

export default new MongoDBService();
