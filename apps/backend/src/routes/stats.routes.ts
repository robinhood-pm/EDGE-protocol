import { Router } from 'express';
import { getGlobalStats } from '../controllers/stats.controller';

const router = Router();

router.get('/', getGlobalStats);

export default router;
