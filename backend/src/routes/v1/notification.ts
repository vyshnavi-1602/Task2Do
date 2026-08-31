import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import * as notificationController from '../../controllers/notification.controller';

const router = Router();

router.use(requireAuth);

router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
