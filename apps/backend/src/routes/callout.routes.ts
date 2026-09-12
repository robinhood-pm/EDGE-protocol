import { Router } from 'express';
import {
  createCalloutHandler,
  getCalloutHandler,
  listCalloutsHandler,
  updateCalloutStatusHandler,
} from '../controllers/calloutController';

const router = Router();

router.post('/', createCalloutHandler);
router.get('/', listCalloutsHandler);
router.get('/:id', getCalloutHandler);
router.patch('/:id', updateCalloutStatusHandler);

export default router;
