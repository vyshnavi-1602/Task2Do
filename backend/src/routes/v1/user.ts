import { Router } from 'express';
import { updateProfile, updatePassword } from '../../controllers/user.controller';
import { requireAuth } from '../../middlewares/requireAuth';

const router = Router();

router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, updatePassword);

export default router;
