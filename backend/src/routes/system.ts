import { Router } from 'express';
import { getDrives, getDirectories } from '../controllers/systemController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

router.get('/drives', protect, admin, getDrives);
router.get('/directories', protect, admin, getDirectories);

export default router;
