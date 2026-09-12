import { Request, Response } from 'express';
import { MarketProposalService } from '../services/marketProposalService';

export class MarketProposalController {
  static async createProposal(req: Request, res: Response) {
    try {
      const { proposerId, question, yesCondition, noCondition, deadline, resolutionSource, category, network } = req.body;

      if (!proposerId || !question || !yesCondition || !noCondition || !deadline || !resolutionSource || !category) {
        return res.status(400).json({ error: 'Missing required proposal fields' });
      }

      const proposal = await MarketProposalService.createProposal({
        proposerId,
        question,
        yesCondition,
        noCondition,
        deadline,
        resolutionSource,
        category,
        network: network || 'testnet',
      });

      return res.status(201).json({ success: true, proposal });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getProposals(req: Request, res: Response) {
    try {
      const network = (req.query.network as string) === 'mainnet' ? 'mainnet' : 'testnet';
      const status = req.query.status as string | undefined;

      const proposals = await MarketProposalService.getProposals(network, status);
      return res.json({ network, proposals });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
