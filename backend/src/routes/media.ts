import { Router } from 'express';
import { getRecentMedia, getMediaById, getAllMedia } from '../controllers/mediaController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

console.log('Loading Media Routes...');

router.get('/test', (req, res) => {
  res.json({ message: 'Media routes are working' });
});

router.get('/', protect, getAllMedia);
router.get('/recent', protect, getRecentMedia);
router.get('/:id', protect, getMediaById);

export default router;
