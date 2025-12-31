import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import libraryRoutes from './library';
import mediaRoutes from './media';
import systemRoutes from './system';
import streamRoutes from './stream';

const router = Router();

router.use('/auth', authRoutes);
router.use('/libraries', libraryRoutes);
router.use('/media', mediaRoutes);
router.use('/system', systemRoutes);
router.use('/stream', streamRoutes);

router.get('/', (req: Request, res: Response) => {
  res.send('API Root');
});

export default router;
