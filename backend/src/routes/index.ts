import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

router.use('/auth', authRoutes);

router.get('/', (req, res) => {
  res.send('API Root');
});

export default router;
