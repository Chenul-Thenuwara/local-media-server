import { Router } from 'express';
import { getProfile, updateProfile, changePassword, setPin } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/password', protect, changePassword);
router.put('/profile/pin', protect, setPin);

export default router;
