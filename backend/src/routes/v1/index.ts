import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import workspaceRoutes from './workspace';
import notificationRoutes from './notification';
import activityRoutes from './activity';
import aiRoutes from './ai';
import attachmentRoutes from './attachments';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activities', activityRoutes);
router.use('/ai', aiRoutes);
router.use('/attachments', attachmentRoutes);

// Future routes will be mounted here:
// router.use('/auth', authRoutes);
// router.use('/workspaces', workspaceRoutes);

export default router;
