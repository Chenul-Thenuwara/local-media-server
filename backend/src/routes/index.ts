import { Router, Request, Response } from 'express';
import authRoutes from './auth';
import libraryRoutes from './library';
import mediaRoutes from './media';
import systemRoutes from './system';
import streamRoutes from './stream';
import searchRoutes from './search';
import tmdbRoutes from './tmdb';
import userRoutes from './userRoutes';
import watchlistRoutes from './watchlist';
import historyRoutes from './history';

const router = Router();

router.use('/auth', authRoutes);
router.use('/libraries', libraryRoutes);
router.use('/media', mediaRoutes);
router.use('/system', systemRoutes);
router.use('/stream', streamRoutes);
router.use('/search', searchRoutes);
router.use('/tmdb', tmdbRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/user', userRoutes);
router.use('/history', historyRoutes);

router.get('/', (req: Request, res: Response) => {
  res.send('API Root');
});

export default router;
