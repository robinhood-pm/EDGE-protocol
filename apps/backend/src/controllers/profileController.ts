import { Request, Response } from 'express';
import {
  getProfileByHandle,
  getProfileByWallet,
  createOrUpdateProfile,
  getProfileStats,
} from '../services/profileService';
import {
  followCreator,
  unfollowCreator,
  checkIsFollowing,
  getFollowers,
  getFollowing,
} from '../services/followService';
import { NetworkType } from '../types/social';

export async function getProfileHandler(req: Request, res: Response): Promise<void> {
  try {
    const handle = req.params.handle as string;
    const network = (req.query.network as NetworkType) || 'testnet';

    const profile = await getProfileByHandle(handle, network);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    const stats = await getProfileStats(profile.id, network);

    res.json({
      success: true,
      profile: {
        ...profile,
        stats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getProfileByWalletHandler(req: Request, res: Response): Promise<void> {
  try {
    const walletAddress = req.params.walletAddress as string;
    const network = (req.query.network as NetworkType) || 'testnet';

    const profile = await getProfileByWallet(walletAddress);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    const stats = await getProfileStats(profile.id, network);

    res.json({
      success: true,
      profile: {
        ...profile,
        stats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function upsertProfileHandler(req: Request, res: Response): Promise<void> {
  try {
    const { walletAddress, handle, displayName, bio, avatarUrl, xHandle } = req.body;
    if (!walletAddress || !handle || !displayName) {
      res.status(400).json({ success: false, error: 'Missing required parameters: walletAddress, handle, displayName' });
      return;
    }

    const profile = await createOrUpdateProfile({
      walletAddress,
      handle,
      displayName,
      bio,
      avatarUrl,
      xHandle,
    });

    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function followHandler(req: Request, res: Response): Promise<void> {
  try {
    const { followerId, followingId } = req.body;
    if (!followerId || !followingId) {
      res.status(400).json({ success: false, error: 'Missing followerId or followingId' });
      return;
    }

    await followCreator(followerId, followingId);
    res.json({ success: true, message: 'Successfully followed creator' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function unfollowHandler(req: Request, res: Response): Promise<void> {
  try {
    const { followerId, followingId } = req.body;
    if (!followerId || !followingId) {
      res.status(400).json({ success: false, error: 'Missing followerId or followingId' });
      return;
    }

    await unfollowCreator(followerId, followingId);
    res.json({ success: true, message: 'Successfully unfollowed creator' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function checkFollowStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const followerId = req.query.followerId as string;
    const followingId = req.query.followingId as string;

    if (!followerId || !followingId) {
      res.status(400).json({ success: false, error: 'Missing followerId or followingId in query params' });
      return;
    }

    const isFollowing = await checkIsFollowing(followerId, followingId);
    res.json({ success: true, isFollowing });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getFollowersHandler(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.params.id as string;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const followers = await getFollowers(profileId, limit, offset);
    res.json({ success: true, followers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getFollowingHandler(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.params.id as string;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const following = await getFollowing(profileId, limit, offset);
    res.json({ success: true, following });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}
