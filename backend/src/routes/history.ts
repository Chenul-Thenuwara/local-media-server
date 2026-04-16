import { Router } from 'express';
import { addToHistory, getRecommendations, getHistory, getNextRecommendation } from '../controllers/historyController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, addToHistory);
router.get('/', protect, getHistory);
router.get('/recommendations', protect, getRecommendations);
router.get('/next/:tmdbId', protect, getNextRecommendation);

export default router;
