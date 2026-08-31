import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import workspaceRoutes from './workspace';
import notificationRoutes from './notification';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/notifications', notificationRoutes);

// Future routes will be mounted here:
// router.use('/auth', authRoutes);
// router.use('/workspaces', workspaceRoutes);

export default router;
