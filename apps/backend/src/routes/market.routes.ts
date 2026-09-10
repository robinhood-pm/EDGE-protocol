import { Router } from 'express';
import { getMarkets, getMarketById, createMarket } from '../controllers/market.controller';

const router = Router();

router.get('/', getMarkets);
router.post('/', createMarket);
router.get('/:id', getMarketById);

export default router;
