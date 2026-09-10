import { Router } from 'express';
import { createLog } from '../controllers/log.controller';

const router = Router();

router.post('/', createLog);

export default router;
