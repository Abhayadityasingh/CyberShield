import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { threatsQuerySchema, threatStatusSchema } from '../validators/query.validators.js';
import { listThreats, getThreat, updateThreatStatus } from '../controllers/threats.controller.js';

const router = Router();
router.use(protect);
router.get('/', validateQuery(threatsQuerySchema), listThreats);
router.get('/:id', getThreat);
router.patch('/:id/status', authorize('admin', 'analyst'), validate(threatStatusSchema), updateThreatStatus);
export default router;