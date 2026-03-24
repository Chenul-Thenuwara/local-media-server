import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

// Retrieve settings (protected, maybe viewer can see some? for now admin only for edit, viewer for read)
// Actually, basic settings like server name might be public/protected-read
router.get('/', protect, getSettings);
router.put('/', protect, admin, updateSettings);

export default router;
