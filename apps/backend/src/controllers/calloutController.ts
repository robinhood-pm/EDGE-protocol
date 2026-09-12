import { Request, Response } from 'express';
import {
  createCallout,
  getCalloutById,
  listCallouts,
  updateCalloutStatus,
} from '../services/calloutService';
import { NetworkType } from '../types/social';

export async function createCalloutHandler(req: Request, res: Response): Promise<void> {
  try {
    const { creatorId, headline, thesis, category, conviction, confidence, marketId, callProbability, deadline } = req.body;
    const network = (req.body.network as NetworkType) || 'testnet';

    if (!creatorId || !headline || !category || !conviction || !confidence || !marketId) {
      res.status(400).json({ success: false, error: 'Missing required parameters for callout creation' });
      return;
    }

    const callout = await createCallout({
      creatorId,
      headline,
      thesis,
      category,
      conviction,
      confidence: Number(confidence),
      marketId,
      callProbability: Number(callProbability || 50),
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      network,
    });

    res.json({ success: true, callout });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getCalloutHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const network = (req.query.network as NetworkType) || 'testnet';

    const callout = await getCalloutById(id, network);
    if (!callout) {
      res.status(404).json({ success: false, error: 'Callout not found' });
      return;
    }

    res.json({ success: true, callout });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function listCalloutsHandler(req: Request, res: Response): Promise<void> {
  try {
    const network = (req.query.network as NetworkType) || 'testnet';
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const creatorId = req.query.creatorId as string | undefined;
    const marketId = req.query.marketId as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    console.log(`[CalloutController] Listing callouts: network=${network}, category=${category || 'all'}, limit=${limit || 'all'}`);

    const callouts = await listCallouts(
      { category, status, creatorId, marketId, limit, offset },
      network
    );

    console.log(`[CalloutController] Returning ${callouts.length} callouts`);
    res.json({ success: true, callouts });
  } catch (error: any) {
    console.error(`[CalloutController] Error listing callouts:`, error?.message || error);
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function updateCalloutStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: 'Missing status in body' });
      return;
    }

    await updateCalloutStatus(id, status);
    res.json({ success: true, message: 'Callout status updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}
