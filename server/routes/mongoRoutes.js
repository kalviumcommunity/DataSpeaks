import express from 'express';
import mongoService from '../services/mongoService.js';
import aiQueryService from '../services/aiQueryService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Test MongoDB connection
router.post('/test', async (req, res) => {
  try {
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ error: 'Connection string is required' });
    }

    const result = await mongoService.testConnection(connectionString);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB database
router.post('/connect', async (req, res) => {
  try {
    console.log('📡 Connection request received');
    const { connectionString } = req.body;
    
    if (!connectionString) {
      console.log('❌ No connection string provided');
      return res.status(400).json({ error: 'Connection string is required' });
    }

    console.log('🔗 Attempting to connect to:', connectionString.replace(/\/\/.*@/, '//***:***@'));
    
    const connectionId = uuidv4();
    const result = await mongoService.connect(connectionId, connectionString);
    
    console.log('🔌 Connection result:', result);
    
    if (result.success) {
      // Get collections info
      console.log('📋 Getting collections...');
      const collectionsResult = await mongoService.getCollections(connectionId);
      
      console.log('✅ Collections result:', collectionsResult);
      
      res.json({
        success: true,
        connectionId,
        ...collectionsResult,
      });
    } else {
      console.log('❌ Connection failed:', result.message);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('💥 Connect endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get collections for a connection
router.get('/:connectionId/collections', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const result = await mongoService.getCollections(connectionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Natural language query
router.post('/:connectionId/query', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { question, collections } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Convert natural language to MongoDB query
    const aiResult = await aiQueryService.naturalLanguageToMongoDB(question, collections || []);
    
    if (!aiResult.success) {
      return res.status(400).json({ error: aiResult.error });
    }

    // Execute the query
    const queryResult = await mongoService.executeQuery(
      connectionId,
      aiResult.mongoQuery,
      aiResult.collection
    );

    if (!queryResult.success) {
      return res.status(400).json({ error: queryResult.message });
    }

    // Get explanation of results
    const explanation = await aiQueryService.explainResults(
      aiResult.mongoQuery,
      queryResult.result,
      question
    );

    res.json({
      success: true,
      question,
      mongoQuery: aiResult.mongoQuery,
      collection: aiResult.collection,
      operation: aiResult.operation,
      result: queryResult.result,
      explanation: aiResult.explanation,
      resultExplanation: explanation.explanation,
      mongoShell: `db.${aiResult.collection}.${aiResult.operation}(${JSON.stringify(aiResult.mongoQuery.filter || aiResult.mongoQuery.pipeline || {})})`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate sample questions
router.get('/:connectionId/samples', async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    // Get collections first
    const collectionsResult = await mongoService.getCollections(connectionId);
    if (!collectionsResult.success) {
      return res.status(400).json(collectionsResult);
    }

    const samples = await aiQueryService.generateSampleQuestions(collectionsResult.collections);
    res.json(samples);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get connection status
router.get('/:connectionId/status', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const status = mongoService.getConnectionStatus(connectionId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect
router.delete('/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const result = await mongoService.disconnect(connectionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
