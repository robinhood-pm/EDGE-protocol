import { Router } from 'express';
import { AttributionController } from '../controllers/attributionController';

const router = Router();

router.post('/', AttributionController.recordAttribution);
router.get('/volume/:creatorId', AttributionController.getAttributedVolume);
router.get('/conversion/:calloutId', AttributionController.getCalloutConversion);

export default router;
