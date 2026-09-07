import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middlewares/requireAuth';
import * as aiController from '../../controllers/ai.controller';

const router = Router();

// Protect AI routes with optional authentication so landing page can use it
router.post('/chat', optionalAuth, aiController.chatWithAI);
router.post('/summarize-issue', requireAuth, aiController.summarizeIssue);
router.post('/suggest-issue', requireAuth, aiController.suggestIssueDetails);

export default router;
