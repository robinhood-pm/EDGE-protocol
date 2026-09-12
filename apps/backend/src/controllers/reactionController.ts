import { Request, Response } from 'express';
import {
  likeCallout,
  unlikeCallout,
  saveCallout,
  unsaveCallout,
  repostCallout,
} from '../services/reactionService';
import {
  addComment,
  getComments,
  likeComment,
} from '../services/commentService';

export async function likeCalloutHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userId, calloutId } = req.body;
    if (!userId || !calloutId) {
      res.status(400).json({ success: false, error: 'Missing userId or calloutId' });
      return;
    }

    await likeCallout(userId, calloutId);
    res.json({ success: true, message: 'Callout liked' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function saveCalloutHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userId, calloutId } = req.body;
    if (!userId || !calloutId) {
      res.status(400).json({ success: false, error: 'Missing userId or calloutId' });
      return;
    }

    await saveCallout(userId, calloutId);
    res.json({ success: true, message: 'Callout saved' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function repostCalloutHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userId, calloutId, quote } = req.body;
    if (!userId || !calloutId) {
      res.status(400).json({ success: false, error: 'Missing userId or calloutId' });
      return;
    }

    await repostCallout(userId, calloutId, quote);
    res.json({ success: true, message: 'Callout reposted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function addCommentHandler(req: Request, res: Response): Promise<void> {
  try {
    const { calloutId, userId, content, parentId } = req.body;
    if (!calloutId || !userId || !content) {
      res.status(400).json({ success: false, error: 'Missing calloutId, userId, or content' });
      return;
    }

    const comment = await addComment(calloutId, userId, content, parentId);
    res.json({ success: true, comment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}

export async function getCommentsHandler(req: Request, res: Response): Promise<void> {
  try {
    const calloutId = req.params.id as string;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const comments = await getComments(calloutId, limit, offset);
    res.json({ success: true, comments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
}
