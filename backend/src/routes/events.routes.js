import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validateQuery.js';
import { eventsQuerySchema } from '../validators/query.validators.js';
import { listEvents } from '../controllers/events.controller.js';

const router = Router();
router.get('/', protect, validateQuery(eventsQuerySchema), listEvents);
export default router;