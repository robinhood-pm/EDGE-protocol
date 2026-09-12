import { Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboardService';

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const period = (req.query.period as any) || 'all_time';
      const network = (req.query.network as string) === 'mainnet' ? 'mainnet' : 'testnet';

      const entries = await LeaderboardService.getLeaderboard(period, network);
      return res.json({ success: true, network, period, leaderboard: entries, entries });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
