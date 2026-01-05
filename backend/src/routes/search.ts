import { Router } from 'express';
import { searchMedia } from '../controllers/searchController';

import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, searchMedia);

export default router;
