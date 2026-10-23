import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { runSimulationSchema } from '../validators/query.validators.js';
import { listScenarios, runScenario, simulationStatus, clearData } from '../controllers/simulation.controller.js';

const limiter = rateLimit({
  windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many simulation requests. Slow down.', status: 429 },
});

const router = Router();
router.use(protect, authorize('admin', 'analyst'), limiter);
router.get('/scenarios', listScenarios);
router.get('/status', simulationStatus);
router.post('/run', validate(runSimulationSchema), runScenario);
router.delete('/data', clearData);
export default router;