import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import * as activityController from '../../controllers/activity.controller';

const router = Router();

router.use(requireAuth);

router.get('/', activityController.getRecentActivities);

export default router;
