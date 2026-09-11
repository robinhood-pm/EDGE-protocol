import { Router } from 'express';
import { getPerpMarkets, getPerpMarketDetail, getPerpOrderbook, submitPerpOrder, getPerpPositions } from '../controllers/perp.controller';

const router = Router();

// /api/perps
router.get('/', getPerpMarkets);
router.get('/positions', getPerpPositions);
router.post('/orders', submitPerpOrder);
router.get('/:marketId', getPerpMarketDetail);
router.get('/:marketId/orderbook', getPerpOrderbook);

export default router;
