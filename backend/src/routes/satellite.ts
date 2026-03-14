import { Router } from 'express';
import { satelliteController } from '../controllers/satellite.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Used by Proponent wizard to check locations live before submitting
router.get('/analyze', satelliteController.analyzeLive);

// Used by Scrutiny Officers to verify a submitted application
router.post('/analyze/:id', authenticate, satelliteController.analyzeApplication);

export default router;
