import { Router } from 'express';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';
import * as sprintController from '../../controllers/sprint.controller';

// mergeParams is critical here so we can access :workspaceId and :projectId from the parent routers
const router = Router({ mergeParams: true });

router.post('/', requireWorkspaceMember('MEMBER'), sprintController.createSprint);
router.get('/', requireWorkspaceMember('VIEWER'), sprintController.getSprints);
router.get('/active/metrics', requireWorkspaceMember('VIEWER'), sprintController.getActiveSprintMetrics);
router.patch('/:sprintId', requireWorkspaceMember('MEMBER'), sprintController.updateSprint);

export default router;
