import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { dashboardQuerySchema } from '../validators/query.validators.js';
import { getSummary } from '../controllers/dashboard.controller.js';

const router = Router();
router.get('/summary', protect, validateQuery(dashboardQuerySchema), getSummary);
export default router;