import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/password', protect, changePassword);

export default router;
