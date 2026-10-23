import { Router } from 'express';
import authRoutes from './auth.routes.js';
import eventsRoutes from './events.routes.js';
import threatsRoutes from './threats.routes.js';
import notificationsRoutes from './notifications.routes.js';
import simulationRoutes from './simulation.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, service: 'cybershield-backend', time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/events', eventsRoutes);
router.use('/threats', threatsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/simulation', simulationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;