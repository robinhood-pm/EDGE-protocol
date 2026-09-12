import { Router } from 'express';
import {
  getProfileHandler,
  getProfileByWalletHandler,
  upsertProfileHandler,
  followHandler,
  unfollowHandler,
  checkFollowStatusHandler,
  getFollowersHandler,
  getFollowingHandler,
} from '../controllers/profileController';

const router = Router();

// Profile endpoints
router.get('/wallet/:walletAddress', getProfileByWalletHandler);
router.get('/:handle', getProfileHandler);
router.post('/', upsertProfileHandler);

// Follow endpoints
router.post('/follow', followHandler);
router.delete('/follow', unfollowHandler);
router.get('/follow/status', checkFollowStatusHandler);
router.get('/:id/followers', getFollowersHandler);
router.get('/:id/following', getFollowingHandler);

export default router;
