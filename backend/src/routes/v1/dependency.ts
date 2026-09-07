import { Router } from 'express';
import * as dependencyController from '../../controllers/dependency.controller';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';

const router = Router({ mergeParams: true });

router.post('/', requireWorkspaceMember('MEMBER'), dependencyController.createDependency);
router.get('/issue/:issueId', requireWorkspaceMember('VIEWER'), dependencyController.getDependencies);
router.delete('/:blockIssueId/:blockedIssueId', requireWorkspaceMember('MEMBER'), dependencyController.removeDependency);

export default router;
