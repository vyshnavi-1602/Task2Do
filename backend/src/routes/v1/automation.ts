import { Router } from 'express';
import * as automationController from '../../controllers/automation.controller';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';

const router = Router({ mergeParams: true });

router.get('/', requireWorkspaceMember('VIEWER'), automationController.getAutomations);
router.post('/', requireWorkspaceMember('ADMIN'), automationController.createAutomation);
router.patch('/:id', requireWorkspaceMember('ADMIN'), automationController.toggleAutomation);
router.delete('/:id', requireWorkspaceMember('ADMIN'), automationController.deleteAutomation);

export default router;
