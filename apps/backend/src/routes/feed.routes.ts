import { Router } from 'express';
import {
  getForYouFeedHandler,
  getFollowingFeedHandler,
  getTrendingFeedHandler,
  getResolvedFeedHandler,
} from '../controllers/feedController';

const router = Router();

router.get('/for-you', getForYouFeedHandler);
router.get('/following', getFollowingFeedHandler);
router.get('/trending', getTrendingFeedHandler);
router.get('/resolved', getResolvedFeedHandler);

export default router;
