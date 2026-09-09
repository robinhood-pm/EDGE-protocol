import { Router } from 'express';
import { createOrder, cancelOrder } from '../controllers/order.controller';

const router = Router();

router.post('/', createOrder);
router.delete('/:id', cancelOrder);

export default router;
