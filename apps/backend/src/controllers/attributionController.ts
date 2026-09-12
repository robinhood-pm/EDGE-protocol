import { Request, Response } from 'express';
import { AttributionService } from '../services/attributionService';

export class AttributionController {
  static async recordAttribution(req: Request, res: Response) {
    try {
      const { calloutId, creatorId, traderAddress, marketId, volume, network } = req.body;

      if (!calloutId || !creatorId || !traderAddress || !marketId || !volume) {
        return res.status(400).json({ error: 'Missing required attribution fields' });
      }

      const result = await AttributionService.recordAttribution({
        calloutId,
        creatorId,
        traderAddress,
        marketId,
        volume: Number(volume),
        network: network || 'testnet',
      });

      return res.status(201).json({ success: true, attribution: result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getAttributedVolume(req: Request, res: Response) {
    try {
      const creatorId = req.params.creatorId as string;
      const network = (req.query.network as string) === 'mainnet' ? 'mainnet' : 'testnet';

      const volume = await AttributionService.getAttributedVolume(creatorId, network);
      return res.json({ creatorId, network, volume });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getCalloutConversion(req: Request, res: Response) {
    try {
      const calloutId = req.params.calloutId as string;
      const network = (req.query.network as string) === 'mainnet' ? 'mainnet' : 'testnet';

      const conversion = await AttributionService.getCalloutConversion(calloutId, network);
      return res.json({ calloutId, network, conversion });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
