import { Router } from 'express';
import { getMarketTrades } from '../controllers/trades.controller';

const router = Router();

// GET /api/markets/:marketId/trades?range=24h
router.get('/:marketId/trades', getMarketTrades);

export default router;
