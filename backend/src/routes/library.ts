import { Router } from 'express';
import { getLibraries, createLibrary, refreshLibrary, deleteLibrary } from '../controllers/libraryController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getLibraries);
router.post('/', protect, admin, createLibrary);
router.post('/:id/refresh', protect, admin, refreshLibrary);
router.delete('/:id', protect, admin, deleteLibrary);

export default router;
