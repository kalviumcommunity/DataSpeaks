import express from 'express';
import { 
  testConnection, 
  connect, 
  getTables, 
  getSchema, 
  executeQuery, 
  executeRawQuery,
  getSampleQuestions,
  getConnectionInfo,
  disconnect,
  listConnections 
} from '../controllers/sqlController.js';

const router = express.Router();

// SQL Connection Management
router.post('/test', testConnection);
router.post('/connect', connect);
router.get('/:connectionId/tables', getTables);
router.get('/:connectionId/schema', getSchema);
router.get('/:connectionId/info', getConnectionInfo);
router.delete('/:connectionId/disconnect', disconnect);
router.get('/connections/list', listConnections);

// SQL Query Operations
router.post('/:connectionId/query', executeQuery);
router.post('/:connectionId/execute', executeRawQuery);
router.get('/:connectionId/sample-questions', getSampleQuestions);

export default router;
