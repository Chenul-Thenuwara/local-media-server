import { Router } from 'express';
import { addToHistory, getRecommendations, getHistory } from '../controllers/historyController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, addToHistory);
router.get('/', protect, getHistory);
router.get('/recommendations', protect, getRecommendations);

export default router;
