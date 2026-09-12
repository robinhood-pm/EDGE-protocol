import { Router } from 'express';
import { MarketProposalController } from '../controllers/marketProposalController';

const router = Router();

router.post('/', MarketProposalController.createProposal);
router.get('/', MarketProposalController.getProposals);

export default router;
