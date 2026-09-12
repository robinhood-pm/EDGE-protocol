import { Request, Response } from 'express';
import { SearchService } from '../services/searchService';
import { ModerationService } from '../services/moderationService';

export class SearchController {
  static async search(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || '';
      const network = (req.query.network as string) === 'mainnet' ? 'mainnet' : 'testnet';

      const results = await SearchService.search(q, network);
      return res.json(results);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async reportContent(req: Request, res: Response) {
    try {
      const { reporterId, targetType, targetId, reason } = req.body;

      if (!reporterId || !targetType || !targetId || !reason) {
        return res.status(400).json({ error: 'Missing required report fields' });
      }

      const report = await ModerationService.reportContent(reporterId, targetType, targetId, reason);
      return res.status(201).json({ success: true, report });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
