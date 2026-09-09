import { Router } from 'express';
import { getUserStats } from '../controllers/user.controller';

const router = Router();

router.get('/:address', getUserStats);

export default router;
