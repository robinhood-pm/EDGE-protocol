import { Router } from 'express';
import { getUserPortfolio } from '../controllers/portfolio.controller';

const router = Router();

router.get('/:address', getUserPortfolio);

export default router;
