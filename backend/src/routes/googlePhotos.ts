import { Router } from 'express';
import googlePhotosService from '../services/googlePhotosService';
import User from '../models/User';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// 1. Get Auth URL (requires authentication)
router.get('/auth/url', protect, (req, res) => {
  const url = googlePhotosService.generateAuthUrl();
  res.json({ url });
});

// Middleware to hydrate Google Credentials scoped to the authenticated user
const hydrateGoogleCredentials = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (user && user.googleRefreshToken) {
      req.googleClient = googlePhotosService.getClientForRefreshToken(user.googleRefreshToken);
      req.googleUserId = user._id;
      next();
    } else {
      return res.status(401).json({ error: 'Google Photos not connected for your account' });
    }
  } catch (err) {
    console.warn('Failed to hydrate google credentials', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2. Auth Callback - save refresh token to the authenticated user
router.post('/auth/callback', protect, async (req: any, res: any) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id || req.user?._id || req.body.userId;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    const tokens = await googlePhotosService.authenticate(code);

    if (userId) {
      const updateData: any = {};
      if (tokens.refresh_token) {
        updateData.googleRefreshToken = tokens.refresh_token;
      }

      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(userId, updateData);
      }
    }

    res.json(tokens);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: (error as any).message || 'Authentication failed' });
  }
});

// 3. List Albums (user scoped)
router.get('/albums', protect, hydrateGoogleCredentials, async (req: any, res) => {
  try {
    const albums = await googlePhotosService.listAlbums(req.googleClient);
    res.json(albums);
  } catch (error: any) {
    console.error('List Albums Error:', error);
    if (
      (error.message?.includes('invalid_grant') ||
        error.message?.includes('insufficient authentication scopes')) &&
      req.googleUserId
    ) {
      console.log('Clearing invalid Google refresh token for user:', req.googleUserId);
      await User.findByIdAndUpdate(req.googleUserId, { googleRefreshToken: null });
    }
    res.status(500).json({ error: error.message || 'Failed to fetch albums' });
  }
});

// 4. List Media (user scoped)
router.get('/media', protect, hydrateGoogleCredentials, async (req: any, res) => {
  try {
    const { filter, albumId } = req.query;
    const items = await googlePhotosService.listMediaItems(
      req.googleClient,
      albumId as string,
      filter as 'PHOTO' | 'VIDEO'
    );
    res.json(items);
  } catch (error: any) {
    console.error('List Media Error:', error);
    if (
      (error.message?.includes('invalid_grant') ||
        error.message?.includes('insufficient authentication scopes')) &&
      req.googleUserId
    ) {
      console.log('Clearing invalid Google refresh token for user:', req.googleUserId);
      await User.findByIdAndUpdate(req.googleUserId, { googleRefreshToken: null });
    }
    res.status(500).json({ error: error.message || 'Failed to fetch media' });
  }
});

export default router;
