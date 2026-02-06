import { Router } from 'express';
import { register, login, getProfiles, switchProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profiles', protect, getProfiles);
router.post('/switch-profile', protect, switchProfile);

export default router;
