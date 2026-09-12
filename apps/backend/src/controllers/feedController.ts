import { Request, Response } from 'express';
import {
  getForYouFeed,
  getFollowingFeed,
  getTrendingFeed,
  getResolvedFeed,
} from '../services/feedService';
import { NetworkType } from '../types/social';

export async function getForYouFeedHandler(req: Request, res: Response): Promise<void> {
  try {
    const network = (req.query.network as NetworkType) || 'testnet';
    const category = req.query.category as string | undefined;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const callouts = await getForYouFeed(network, category, limit, offset);
    res.json({ success: true, callouts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getFollowingFeedHandler(req: Request, res: Response): Promise<void> {
  try {
    const followerId = (req.query.userId as string) || '';
    const network = (req.query.network as NetworkType) || 'testnet';
    const category = req.query.category as string | undefined;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    if (!followerId) {
      res.status(400).json({ success: false, error: 'Missing userId parameter' });
      return;
    }

    const callouts = await getFollowingFeed(followerId, network, limit, offset);
    res.json({ success: true, callouts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getTrendingFeedHandler(req: Request, res: Response): Promise<void> {
  try {
    const network = (req.query.network as NetworkType) || 'testnet';
    const limit = Number(req.query.limit) || 10;

    const callouts = await getTrendingFeed(network, limit);
    res.json({ success: true, callouts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getResolvedFeedHandler(req: Request, res: Response): Promise<void> {
  try {
    const network = (req.query.network as NetworkType) || 'testnet';
    const limit = Number(req.query.limit) || 10;

    const callouts = await getResolvedFeed(network, limit);
    res.json({ success: true, callouts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}
