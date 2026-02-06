import { Router } from 'express';
import { getSystemStats, getUsers } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

// Protect all admin routes
// router.use(protect);
// router.use(admin); // Temporarily disabled for demonstration

router.get('/stats', getSystemStats);
router.get('/users', getUsers);

export default router;
