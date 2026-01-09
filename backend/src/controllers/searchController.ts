import { Request, Response } from 'express';
import Media from '../models/Media';

export const searchMedia = async (req: Request, res: Response) => {
  try {
    const { q, type } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    // @ts-ignore
    const userId = req.user.id;

    // 1. Get user's libraries
    // @ts-ignore
    const libraries = await import('../models/Library').then(m => m.default.find({ userId }));
    const libraryIds = libraries.map(lib => lib._id);

    // 2. Search within those libraries
    const query: any = {
      libraryId: { $in: libraryIds },
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { original_title: { $regex: q, $options: 'i' } }
      ]
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    const results = await Media.find(query).limit(100).sort({ title: 1 });

    // Deduplicate results based on TMDB ID or Title
    const seen = new Set();
    const uniqueResults = results.filter(item => {
      const key = item.tmdbId ? `tmdb-${item.tmdbId}` : `title-${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json(uniqueResults.slice(0, 50));
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
