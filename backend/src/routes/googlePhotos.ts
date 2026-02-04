
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
    // If we have a user from auth middleware (or need to fetch it)
    // Here we'll try to get it from the refresh token if saved in DB
    // Since we don't have full auth middleware wrapping this route yet in index.ts, we'll do a quick check
    // Ideally this route should be protected by auth middleware which populates req.user

    // For this implementation, we'll try to find ANY user with a refresh token if no specific user is authenticated
    // This is a "Single User Mode" assumption for the local media server context

    const userWithToken = await User.findOne({ googleRefreshToken: { $exists: true, $ne: null } });
    if (userWithToken && userWithToken.googleRefreshToken) {
      console.log('Hydrating Google Creds for user:', userWithToken._id);
      googlePhotosService.setCredentials({ refresh_token: userWithToken.googleRefreshToken });
    } else {
      console.log('No user with Google Refresh Token found');
    }
  } catch (err) {
    console.warn('Failed to hydrate google credentials', err);
  }
  next();
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
    console.log('Tokens received. Refresh Token present:', !!tokens.refresh_token);
    console.log('Granted Scopes:', tokens.scope);
    logError('Tokens Received', { refresh_token: !!tokens.refresh_token, scope: tokens.scope });

    // Save tokens to user (if userId provided, otherwise session based or return to frontend)
    // For now, we'll return to frontend or update a default user if single-user mode.
    // Assuming single-user or passed userId.
    if (userId) {
      console.log('Saving Google Refresh Token for userId:', userId);
      await User.findByIdAndUpdate(userId, { googleRefreshToken: tokens.refresh_token });
    }

    res.json(tokens);
  } catch (error) {
    console.error('Google Auth Error:', error);
    logError('Google Auth Error', error);
    res.status(500).json({ error: (error as any).message || 'Authentication failed' });
  }
});

// 3. List Albums
router.get('/albums', async (req, res) => {
  try {
    // In a real app, middleware would set credentials from user DB
    // For demo, we assume service might have state or tokens need to be passed/hydrated
    // This is a simplification. Ideally:
    // 1. Get user from auth middleware
    // 2. Decrypt refresh token
    // 3. googlePhotosService.setCredentials(...)

    // Required: Access Token in headers or handled via service state (not singleton safe for multi-user)
    // For this context: We'll assume the frontend passes the access token or we just rely on the service 'last set' (flawed for multi-user).
    // BETTER APPROACH: Pass tokens to service methods.

    // Refactoring service to accept tokens is better, but for now let's leave as is for prototype
    const albums = await googlePhotosService.listAlbums();
    res.json(albums);
  } catch (error: any) {
    console.error('List Albums Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch albums' });
  }
});

// 4. List Media
router.get('/media', async (req, res) => {
  try {
    const { filter, albumId } = req.query;
    const items = await googlePhotosService.listMediaItems(
      albumId as string,
      filter as 'PHOTO' | 'VIDEO'
    );
    res.json(items);
  } catch (error: any) {
    console.error('List Media Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch media' });
  }
});

export default router;
