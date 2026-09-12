import { Router } from 'express';
import { SearchController } from '../controllers/searchController';

const router = Router();

router.get('/', SearchController.search);
router.post('/report', SearchController.reportContent);

export default router;
