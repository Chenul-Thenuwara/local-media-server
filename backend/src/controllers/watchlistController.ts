import { Request, Response } from 'express';
import User, { IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: any;
}

export const getWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sort by addedAt desc
    const sorted = user.watchlist.sort((a, b) =>
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const addToWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const { mediaId, tmdbId, mediaType, title, posterPath } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check duplicates
    const exists = user.watchlist.some(item =>
      (tmdbId && item.tmdbId === tmdbId) || (mediaId && item.mediaId === mediaId)
    );

    if (exists) {
      return res.status(400).json({ message: 'Item already in watchlist' });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeFromWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Can be mediaId or tmdbId

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.watchlist = user.watchlist.filter(item =>
      item.mediaId !== id && item.tmdbId?.toString() !== id && (item as any)._id?.toString() !== id
    );

    await user.save();
    res.json(user.watchlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
