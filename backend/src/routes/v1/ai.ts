import { Router } from 'express';
import { optionalAuth } from '../../middlewares/requireAuth';
import * as aiController from '../../controllers/ai.controller';

const router = Router();

// Protect AI routes with optional authentication so landing page can use it
router.use(optionalAuth);

router.post('/chat', aiController.chatWithAI);

export default router;
