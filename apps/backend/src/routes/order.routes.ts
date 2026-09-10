import { Router } from 'express';
import { createOrder, cancelOrder, getMarketOrders } from '../controllers/order.controller';

const router = Router();

router.post('/', createOrder);
router.delete('/:id', cancelOrder);
router.get('/:marketId', getMarketOrders);

export default router;
