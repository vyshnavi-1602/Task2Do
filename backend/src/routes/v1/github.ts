import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import * as githubController from '../../controllers/github.controller';

const router = Router();

// OAuth initiation requires authentication
router.get('/connect', requireAuth, githubController.connectGitHub);

// Callback from GitHub
router.get('/callback', githubController.githubCallback);

// Webhook endpoint (unprotected, GitHub sends the payload here)
router.post('/webhook', githubController.handleWebhook);

export default router;
