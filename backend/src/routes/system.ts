import { Router } from 'express';
import { getDrives, getDirectories } from '../controllers/systemController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/drives', protect, getDrives);
router.get('/directories', protect, getDirectories);

export default router;
