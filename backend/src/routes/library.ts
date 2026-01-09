import { Router } from 'express';
import { getLibraries, createLibrary, refreshLibrary } from '../controllers/libraryController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getLibraries);
router.post('/', protect, createLibrary);
router.post('/:id/refresh', protect, refreshLibrary);

export default router;
