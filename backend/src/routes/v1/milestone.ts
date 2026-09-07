import { Router } from 'express';
import * as milestoneController from '../../controllers/milestone.controller';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';

const router = Router({ mergeParams: true });

router.post('/', requireWorkspaceMember('MEMBER'), milestoneController.createMilestone);
router.get('/', requireWorkspaceMember('VIEWER'), milestoneController.getMilestones);
router.get('/:milestoneId', requireWorkspaceMember('VIEWER'), milestoneController.getMilestone);
router.put('/:milestoneId', requireWorkspaceMember('MEMBER'), milestoneController.updateMilestone);
router.delete('/:milestoneId', requireWorkspaceMember('MEMBER'), milestoneController.deleteMilestone);

export default router;
