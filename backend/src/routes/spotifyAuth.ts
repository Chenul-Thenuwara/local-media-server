import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware';
import User from '../models/User';

const router = Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = 'http://localhost:3000/api/spotify/auth/callback';
const FRONTEND_MUSIC = 'http://localhost:5173/libraries/music';

const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

// ─── GET /api/spotify/auth/login ─────────────────────────────────────────────
// Redirects user to Spotify OAuth. Requires LMS JWT via ?token= query param
// (since this is a browser redirect, Authorization header can't be sent)
router.get('/login', (req: Request, res: Response) => {
  const lmsToken = req.query.token as string;
  if (!lmsToken) {
    return res.status(400).json({ error: 'LMS token required' });
  }

  // Encode LMS JWT into state so callback can identify the user
  const state = Buffer.from(JSON.stringify({ t: lmsToken })).toString('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// ─── GET /api/spotify/auth/callback ─────────────────────────────────────────
// Spotify redirects here with code + state. Exchange for tokens, save to user.
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_MUSIC}?spotify=denied`);
  }

  if (!code || !state) {
    return res.redirect(`${FRONTEND_MUSIC}?spotify=error`);
  }

  try {
    // Decode state to get LMS JWT
    const decoded = JSON.parse(Buffer.from(state as string, 'base64url').toString());
    const lmsToken = decoded.t as string;

    // Verify LMS JWT to get userId
    const payload = jwt.verify(lmsToken, process.env.JWT_SECRET!) as { id: string };
    const userId = payload.id;

    // Exchange Spotify code for tokens
    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    const expiry = new Date(Date.now() + expires_in * 1000);

    // Save tokens to the user's DB record
    await User.findByIdAndUpdate(userId, {
      spotifyAccessToken: access_token,
      spotifyRefreshToken: refresh_token,
      spotifyTokenExpiry: expiry,
    });

    res.redirect(`${FRONTEND_MUSIC}?spotify=connected`);
  } catch (err) {
    console.error('[Spotify Auth] Callback error:', err);
    res.redirect(`${FRONTEND_MUSIC}?spotify=error`);
  }
});

// ─── GET /api/spotify/auth/me ─────────────────────────────────────────────────
// Returns connection status + fresh access token for the SDK
router.get('/me', protect, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = await User.findById(req.user._id);
    if (!user || !user.spotifyAccessToken || !user.spotifyRefreshToken) {
      return res.json({ connected: false });
    }

    let accessToken = user.spotifyAccessToken;

    // Refresh if token expires within 5 minutes
    const now = Date.now();
    const expiry = user.spotifyTokenExpiry?.getTime() || 0;
    if (expiry - now < 5 * 60 * 1000) {
      try {
        const refreshRes = await axios.post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: user.spotifyRefreshToken,
          }),
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        accessToken = refreshRes.data.access_token;
        const newExpiry = new Date(Date.now() + refreshRes.data.expires_in * 1000);

        await User.findByIdAndUpdate(user._id, {
          spotifyAccessToken: accessToken,
          spotifyTokenExpiry: newExpiry,
          ...(refreshRes.data.refresh_token ? { spotifyRefreshToken: refreshRes.data.refresh_token } : {}),
        });
      } catch (refreshErr) {
        console.error('[Spotify Auth] Refresh failed — clearing tokens');
        await User.findByIdAndUpdate(user._id, {
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyTokenExpiry: null,
        });
        return res.json({ connected: false });
      }
    }

    // Fetch Spotify profile for display name + avatar
    try {
      const profile = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json({
        connected: true,
        accessToken,
        displayName: profile.data.display_name,
        image: profile.data.images?.[0]?.url,
        product: profile.data.product, // 'premium' | 'free'
      });
    } catch {
      return res.json({ connected: true, accessToken });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to get Spotify status' });
  }
});

// ─── DELETE /api/spotify/auth/logout ─────────────────────────────────────────
// Clears stored Spotify tokens for this user
router.delete('/logout', protect, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    await User.findByIdAndUpdate(req.user._id, {
      spotifyAccessToken: null,
      spotifyRefreshToken: null,
      spotifyTokenExpiry: null,
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to disconnect Spotify' });
  }
});

export default router;
