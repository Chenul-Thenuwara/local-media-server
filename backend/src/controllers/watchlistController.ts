import { Request, Response } from 'express';
import User from '../models/User';

// Get Watchlist
export const getWatchlist = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = await User.findById(req.user.id).select('watchlist');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sort by addedAt desc
    const sortedList = user.watchlist.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    res.json(sortedList);
  } catch (error) {
    console.error('Get Watchlist Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add to Watchlist
export const addToWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId, tmdbId, mediaType, title, posterPath } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    if (!title || !mediaType) {
      res.status(400).json({ message: 'Title and MediaType are required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if already exists
    const exists = user.watchlist.some(item =>
      (tmdbId && item.tmdbId === tmdbId) || (mediaId && item.mediaId === mediaId)
    );

    if (exists) {
      res.status(400).json({ message: 'Item already in watchlist' });
      return;
    }

    user.watchlist.push({
      mediaId,
      tmdbId,
      mediaType,
      title,
      posterPath,
      addedAt: new Date()
    });

    await user.save();
    res.json(user.watchlist);
  } catch (error) {
    console.error('Add Watchlist Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove from Watchlist
export const removeFromWatchlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Can be mediaId or tmdbId
    // @ts-ignore
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Filter out the item
    user.watchlist = user.watchlist.filter(item => {
      // Match string comparison for IDs
      const matchMediaId = item.mediaId === id;
      const matchTmdbId = item.tmdbId?.toString() === id;
      return !matchMediaId && !matchTmdbId;
    });

    await user.save();
    res.json(user.watchlist);
  } catch (error) {
    console.error('Remove Watchlist Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
