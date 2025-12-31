import { Router } from 'express';
import { getRecentMedia, getMediaById } from '../controllers/mediaController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/recent', protect, getRecentMedia);
router.get('/:id', protect, getMediaById);

export default router;
