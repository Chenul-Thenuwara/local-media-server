import { Request, Response } from 'express';
import History from '../models/History';
import User from '../models/User';
import axios from 'axios';

// @desc    Add or update history entry
// @route   POST /api/history
// @access  Private
export const addToHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId, tmdbId, mediaType, title, posterPath, progress } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    // Construct query to find existing entry
    const query = {
      userId,
      $or: [
        { tmdbId: tmdbId ? tmdbId : -1 }, // -1 safely avoids null match
        { mediaId: mediaId ? mediaId : "nomatch" }
      ]
    };

    // Atomic Update (Upsert) - Prevents race conditions
    const historyItem = await History.findOneAndUpdate(
      query,
      {
        $set: {
          userId,
          mediaId,
          tmdbId,
          mediaType,
          title,
          posterPath,
          watchedAt: new Date(),
          ...(progress && { progress }) // Only update progress if provided
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(historyItem);
  } catch (error) {
    console.error('Add History Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get content recommendations
// @route   GET /api/history/recommendations
// @access  Private
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      res.status(500).json({ message: 'TMDB API Key missing' });
      return;
    }

    // 1. Fetch Seeds (Recent History & Watchlist)
    const history = await History.find({ userId }).sort({ watchedAt: -1 }).limit(3);
    const user = await User.findById(userId).select('watchlist');
    const watchlist = user?.watchlist?.slice(-3) || [];

    const seeds = [
      ...history.map(h => ({ id: h.tmdbId, type: h.mediaType })),
      ...watchlist.map(w => ({ id: w.tmdbId, type: w.mediaType }))
    ].filter(s => s.id); // Valid TMDB IDs only

    // 2. Fetch Recommendations
    let results: any[] = [];
    const usedIds = new Set<number>();

    // Helper to fetch valid suggestions
    const fetchSuggestions = async (id: number, type: string) => {
      try {
        const url = `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${apiKey}&language=en-US&page=1`;
        const { data } = await axios.get(url);
        return data.results || [];
      } catch (e) {
        console.error(`Failed to fetch recs for ${type}/${id}`, e);
        return [];
      }
    };

    if (seeds.length > 0) {
      // Fetch for each seed
      const promises = seeds.slice(0, 3).map(s => fetchSuggestions(s.id!, s.type));
      const responses = await Promise.all(promises);

      // Merge
      responses.flat().forEach(item => {
        if (!usedIds.has(item.id)) {
          usedIds.add(item.id);
          results.push(item);
        }
      });
    }

    // 3. Fallback: If results are scarce (< 5), fetch Trending
    if (results.length < 5) {
      try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}`);
        data.results.forEach((item: any) => {
          if (!usedIds.has(item.id)) {
            usedIds.add(item.id);
            results.push(item);
          }
        });
      } catch (e) {
        console.error('Failed to fetch trending fallback', e);
      }
    }

    // 4. Transform to standard format
    const formatted = results
      .filter(item => item.media_type !== 'person') // Remove people
      .slice(0, 15) // Limit output
      .map(item => ({
        _id: item.id.toString(),
        tmdbId: item.id,
        title: item.title || item.name,
        original_title: item.original_title || item.original_name,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        overview: item.overview,
        type: item.media_type || 'movie', // Default may vary, but helpful
        mediaType: item.media_type || 'movie',
        releaseDate: item.release_date || item.first_air_date,
        rating: item.vote_average,
        isTmdb: true
      }));

    res.json(formatted);

  } catch (error) {
    console.error('Recommendations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user history
// @route   GET /api/history
// @access  Private
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const history = await History.find({ userId }).sort({ watchedAt: -1 }).limit(50);
    res.json(history);
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
