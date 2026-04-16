import { Router } from 'express';
import { getSystemStats, getUsers, createUser } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

// Protect all admin routes
router.use(protect);
// router.use(admin); // Temporarily disabled for demonstration

router.get('/stats', getSystemStats);
router.get('/users', getUsers);
router.post('/users', createUser);

export default router;
