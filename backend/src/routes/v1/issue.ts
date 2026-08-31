import { Router } from 'express';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';
import * as issueController from '../../controllers/issue.controller';
import * as commentController from '../../controllers/comment.controller';
import * as activityController from '../../controllers/activity.controller';

const router = Router({ mergeParams: true });

// Issue Routes
router.post('/', requireWorkspaceMember('MEMBER'), issueController.createIssue);
router.get('/', requireWorkspaceMember('VIEWER'), issueController.getIssues);
router.get('/:issueId', requireWorkspaceMember('VIEWER'), issueController.getIssue);
router.patch('/:issueId', requireWorkspaceMember('MEMBER'), issueController.updateIssue);
router.delete('/:issueId', requireWorkspaceMember('ADMIN'), issueController.deleteIssue);

// Comment Routes
router.post('/:issueId/comments', requireWorkspaceMember('VIEWER'), commentController.createComment);
router.get('/:issueId/comments', requireWorkspaceMember('VIEWER'), commentController.getComments);
// Note: PUT/DELETE for comments use :commentId, but they are mounted under /issues so they will have access to workspaceId from mergeParams
router.put('/:issueId/comments/:commentId', requireWorkspaceMember('VIEWER'), commentController.updateComment);
router.delete('/:issueId/comments/:commentId', requireWorkspaceMember('VIEWER'), commentController.deleteComment);

// Activity Routes
router.get('/:issueId/activity', requireWorkspaceMember('VIEWER'), activityController.getIssueActivity);

export default router;
