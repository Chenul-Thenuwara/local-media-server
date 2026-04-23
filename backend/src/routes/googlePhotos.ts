
import { Router } from 'express';
import googlePhotosService from '../services/googlePhotosService';
import User from '../models/User';
import fs from 'fs';
import path from 'path';

const logError = (msg: string, err: any) => {
  const logPath = path.join(__dirname, '../../backend.log');
  const timestamp = new Date().toISOString();
  const errorMessage = err?.message || JSON.stringify(err);
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}: ${errorMessage}\n`);
  if (err?.stack) {
    fs.appendFileSync(logPath, `stack: ${err.stack}\n`);
  }
};

const router = Router();

// 1. Get Auth URL
router.get('/auth/url', (req, res) => {
  const url = googlePhotosService.generateAuthUrl();
  res.json({ url });
});

// Middleware to hydrate Google Credentials
const hydrateGoogleCredentials = async (req: any, res: any, next: any) => {
  try {
    const userWithToken = await User.findOne({ googleRefreshToken: { $exists: true, $ne: null } });
    if (userWithToken && userWithToken.googleRefreshToken) {
      googlePhotosService.setCredentials({ refresh_token: userWithToken.googleRefreshToken });
      // Attach user id so we can clear token if it fails later
      req.googleUserId = userWithToken._id;
      next();
    } else {
      // CLEAR in-memory credentials if DB is empty
      googlePhotosService.setCredentials({});
      return res.status(401).json({ error: 'Not connected' });
    }
  } catch (err) {
    console.warn('Failed to hydrate google credentials', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Apply hydration to media routes
router.use('/albums', hydrateGoogleCredentials);
router.use('/media', hydrateGoogleCredentials);

// 2. Auth Callback
router.post('/auth/callback', async (req, res) => {
  try {
    const { code, userId } = req.body;
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

// 3. List Albums
router.get('/albums', async (req: any, res) => {
  try {
    const albums = await googlePhotosService.listAlbums();
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

// 4. List Media
router.get('/media', async (req: any, res) => {
  try {
    const { filter, albumId } = req.query;
    const items = await googlePhotosService.listMediaItems(
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
