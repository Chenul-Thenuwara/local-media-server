import { Router } from 'express';
import { getSystemStats, getUsers, createUser } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';
import Media from '../models/Media';
import { fetchMetadata } from '../services/tmdbService';

const router = Router();

// Protect all admin routes
router.use(protect);

router.get('/stats', getSystemStats);
router.get('/users', getUsers);
router.post('/users', createUser);

// Bulk re-classify all video media using TMDB multi-search
router.post('/reclassify', async (req, res) => {
  try {
    const medias = await Media.find({ type: { $in: ['movie', 'tv'] } });
    let reclassified = 0;

    for (const media of medias) {
      const metadata = await fetchMetadata(media.filename, media.type as 'movie' | 'tv');
      if (metadata?.detectedType && metadata.detectedType !== media.type) {
        await Media.findByIdAndUpdate(media._id, {
          type: metadata.detectedType,
          title: metadata.title,
          posterPath: metadata.posterPath,
          backdropPath: metadata.backdropPath,
          overview: metadata.overview,
          releaseDate: metadata.releaseDate,
          tmdbId: metadata.tmdbId,
        });
        console.log(`[Reclassify] ${media.filename}: ${media.type} → ${metadata.detectedType}`);
        reclassified++;
      }
    }

    res.json({ message: `Re-classified ${reclassified} of ${medias.length} items` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

