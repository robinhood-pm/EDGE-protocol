import { Router } from 'express';
import {
  likeCalloutHandler,
  saveCalloutHandler,
  repostCalloutHandler,
  addCommentHandler,
  getCommentsHandler,
} from '../controllers/reactionController';

const router = Router();

router.post('/like', likeCalloutHandler);
router.post('/save', saveCalloutHandler);
router.post('/repost', repostCalloutHandler);
router.post('/comment', addCommentHandler);
router.get('/callouts/:id/comments', getCommentsHandler);

export default router;
