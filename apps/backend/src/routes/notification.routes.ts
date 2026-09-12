import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';

const router = Router();

router.get('/:userId', NotificationController.getNotifications);
router.post('/:id/read', NotificationController.markAsRead);

export default router;
