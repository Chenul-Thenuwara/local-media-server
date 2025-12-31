import { Router } from 'express';
import { getLibraries, createLibrary } from '../controllers/libraryController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getLibraries);
router.post('/', protect, createLibrary);

export default router;
