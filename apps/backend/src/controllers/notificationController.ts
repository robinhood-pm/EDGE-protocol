import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.params.userId as string;
      const network = (req.query.network as string) === 'mainnet' ? 'mainnet' : 'testnet';

      const notifications = await NotificationService.getNotifications(userId, network);
      return res.json({ userId, network, notifications });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const success = await NotificationService.markAsRead(id);
      return res.json({ success });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
