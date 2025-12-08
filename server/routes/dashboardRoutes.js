import express from 'express';
import {
  createDashboard,
  getDashboards,
  getDashboard,
  updateDashboard,
  deleteDashboard,
  addInsight,
  removeInsight,
  shareDashboard
} from '../controllers/dashboardController.js';

const router = express.Router();

// Dashboard CRUD operations
router.post('/', createDashboard);
router.get('/', getDashboards);
router.get('/:dashboardId', getDashboard);
router.put('/:dashboardId', updateDashboard);
router.delete('/:dashboardId', deleteDashboard);

// Insight management
router.post('/:dashboardId/insights', addInsight);
router.delete('/:dashboardId/insights/:insightId', removeInsight);

// Sharing
router.post('/:dashboardId/share', shareDashboard);

export default router;
