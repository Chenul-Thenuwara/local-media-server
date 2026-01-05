import { Router } from 'express';
import { searchMedia } from '../controllers/searchController';

const router = Router();

router.get('/', searchMedia);

export default router;
