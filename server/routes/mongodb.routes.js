import express from 'express';
import mongodbService from '../services/mongodb.service.js';
import mongodbQueryService from '../services/mongodbQuery.service.js';

const router = express.Router();

// Test MongoDB connection
router.post('/test-connection', async (req, res) => {
  try {
    const { connectionString } = req.body;

    if (!connectionString) {
      return res.status(400).json({
        success: false,
        message: 'Connection string is required',
      });
    }

    const result = await mongodbService.testConnection(connectionString);
    res.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Connect to MongoDB
router.post('/connect', async (req, res) => {
  try {
    const { connectionString } = req.body;

    if (!connectionString) {
      return res.status(400).json({
        success: false,
        error: 'Connection string is required',
      });
    }

    const result = await mongodbService.connect(connectionString);
    
    if (result.success) {
      // Get schema for each collection
      const schema = {};
      for (const collection of result.collections) {
        try {
          const collSchema = await mongodbService.getCollectionSchema(
            collection.name,
            result.connectionId
          );
          schema[collection.name] = collSchema.fields;
        } catch (error) {
          console.error(`Error getting schema for ${collection.name}:`, error);
          schema[collection.name] = [];
        }
      }
      result.schema = schema;
    }

    res.json(result);
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get collections
router.get('/:connectionId/collections', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const collections = await mongodbService.getCollections(connectionId);
    
    res.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get collection schema
router.get('/:connectionId/schema/:collectionName', async (req, res) => {
  try {
    const { connectionId, collectionName } = req.params;
    const schema = await mongodbService.getCollectionSchema(collectionName, connectionId);
    
    res.json({
      success: true,
      schema,
    });
  } catch (error) {
    console.error('Get schema error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Natural language to MQL query
router.post('/:connectionId/query', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { question, collections, schema } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
      });
    }

    console.log('MongoDB Query Request:', { question, collections: collections?.length });

    // Special handling for schema-related questions
    const lowerQuestion = question.toLowerCase();
    if ((lowerQuestion.includes('field') || lowerQuestion.includes('column') || lowerQuestion.includes('schema')) &&
        (lowerQuestion.includes('collection') || lowerQuestion.includes('table') || lowerQuestion.includes('each'))) {
      
      // Return schema information directly
      const schemaInfo = schema && Object.keys(schema).length > 0 ? schema : {};
      const formattedResults = [];
      
      for (const [collName, fields] of Object.entries(schemaInfo)) {
        formattedResults.push({
          collection: collName,
          fields: fields.map(f => ({
            name: f.name,
            type: f.type,
            sample: f.sample
          }))
        });
      }
      
      return res.json({
        success: true,
        results: formattedResults,
        mql: { note: 'Schema information retrieved from connection metadata' },
        explanation: `Schema information for ${formattedResults.length} collections`,
        aiExplanation: `The database has ${formattedResults.length} collections with the following fields:\n\n${
          formattedResults.map(r => 
            `**${r.collection}**: ${r.fields.map(f => `${f.name} (${f.type})`).join(', ')}`
          ).join('\n')
        }`,
        collection: 'metadata',
        operation: 'schema'
      });
    }

    // Convert natural language to MongoDB query
    let queryGeneration = await mongodbQueryService.naturalLanguageToMQL(
      question,
      collections,
      schema
    );

    // If AI generation failed, use fallback
    if (!queryGeneration.success) {
      console.log('AI generation failed, using fallback:', queryGeneration.error);
      const fallback = queryGeneration.fallbackQuery || 
                      mongodbQueryService.generateFallbackQuery(question, collections);
      queryGeneration = {
        success: true,
        query: fallback.query,
        explanation: fallback.explanation + ' (using fallback query)',
        collection: fallback.collection,
        operation: fallback.operation,
      };
    }

    console.log('Generated MongoDB Query:', JSON.stringify(queryGeneration, null, 2));

    // Build proper query object for execution
    const execQuery = {
      collection: queryGeneration.collection,
      operation: queryGeneration.operation,
      ...queryGeneration.query
    };

    // Execute the generated query
    const results = await mongodbService.executeQuery(
      execQuery,
      connectionId
    );

    // Get AI explanation of results
    const aiExplanation = await mongodbQueryService.explainResults(
      queryGeneration.query,
      results,
      question
    );

    res.json({
      success: true,
      query: queryGeneration.query,
      mql: JSON.stringify(queryGeneration.query, null, 2),
      explanation: queryGeneration.explanation,
      results: Array.isArray(results) ? results : [results],
      documentCount: Array.isArray(results) ? results.length : 1,
      aiExplanation: aiExplanation.explanation,
      metadata: {
        collection: queryGeneration.collection,
        operation: queryGeneration.operation,
        analysis: aiExplanation.analysis,
      },
    });
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to execute MongoDB query',
    });
  }
});

// Generate sample questions
router.get('/:connectionId/sample-questions', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { collections, schema } = req.query;

    const parsedCollections = collections ? JSON.parse(collections) : [];
    const parsedSchema = schema ? JSON.parse(schema) : {};

    const result = mongodbQueryService.generateSampleQuestions(
      parsedCollections,
      parsedSchema
    );

    res.json(result);
  } catch (error) {
    console.error('Sample questions error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Disconnect
router.post('/:connectionId/disconnect', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const result = await mongodbService.disconnect(connectionId);
    res.json(result);
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get connection info
router.get('/:connectionId/info', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const info = mongodbService.getConnectionInfo(connectionId);
    
    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
      });
    }

    res.json({
      success: true,
      info,
    });
  } catch (error) {
    console.error('Get connection info error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
