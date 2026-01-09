import { Router } from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlistController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getWatchlist);
router.post('/', protect, addToWatchlist);
router.delete('/:id', protect, removeFromWatchlist);

export default router;
