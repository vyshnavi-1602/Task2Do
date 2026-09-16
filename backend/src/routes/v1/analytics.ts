import { Router } from 'express';
import * as analyticsController from '../../controllers/analytics.controller';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';

const router = Router({ mergeParams: true });

router.get('/velocity', requireWorkspaceMember('VIEWER'), analyticsController.getVelocity);
router.get('/member-performance', requireWorkspaceMember('VIEWER'), analyticsController.getMemberPerformance);

export default router;
