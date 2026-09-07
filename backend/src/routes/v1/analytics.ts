import { Router } from 'express';
import * as analyticsController from '../../controllers/analytics.controller';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';

const router = Router({ mergeParams: true });

router.get('/velocity', requireWorkspaceMember('VIEWER'), analyticsController.getVelocity);

export default router;
