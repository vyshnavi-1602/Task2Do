import { Router } from 'express';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';
import * as issueController from '../../controllers/issue.controller';

const router = Router({ mergeParams: true });

router.post('/', requireWorkspaceMember('MEMBER'), issueController.createIssue);
router.get('/', requireWorkspaceMember('VIEWER'), issueController.getIssues);
router.get('/:issueId', requireWorkspaceMember('VIEWER'), issueController.getIssue);
router.patch('/:issueId', requireWorkspaceMember('MEMBER'), issueController.updateIssue);
router.delete('/:issueId', requireWorkspaceMember('ADMIN'), issueController.deleteIssue);

export default router;
