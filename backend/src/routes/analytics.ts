import { Router } from 'express';
import {
  getDashboardAnalytics,
  getDepartmentAnalytics,
  getPriorityVoterList,
  getVolunteerPerformance,
  getHeatmaps,
} from '../controllers/analyticsController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/dashboard', getDashboardAnalytics);
router.get('/departments', getDepartmentAnalytics);
router.get('/priority-list', getPriorityVoterList);
router.get('/volunteers/performance', getVolunteerPerformance);
router.get('/heatmaps', getHeatmaps);

export default router;
