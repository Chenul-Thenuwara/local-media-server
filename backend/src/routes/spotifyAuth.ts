import { Router, Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware';
import User from '../models/User';

const router = Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const REDIRECT_URI = `${BACKEND_URL}/api/spotify/auth/callback`;

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
  const errorHtml = (msg: string) => `
    <html>
      <head><title>Spotify Error</title></head>
      <body style="background:#0a0a0a; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
        <div style="text-align:center;">
          <h2 style="color:#ef4444;">${msg}</h2>
          <p style="color:#a3a3a3;">You can safely close this tab.</p>
        </div>
      </body>
    </html>
  `;

  if (error) {
    return res.send(errorHtml('Authentication Denied'));
  }

  if (!code || !state) {
    return res.send(errorHtml('Invalid Authentication Request'));
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

    // Send a success page that automatically closes itself
    res.send(`
      <html>
        <head><title>Spotify Connected</title></head>
        <body style="background:#0a0a0a; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background:#171717; padding:40px; border-radius:20px; text-align:center; border:1px solid #262626; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2 style="margin:0 0 8px 0; color:#4ade80; font-size:24px;">Spotify Connected!</h2>
            <p style="margin:0; color:#a3a3a3;">You can safely close this tab and return to the app.</p>
          </div>
          <script>
            // Try to auto-close the tab after 3 seconds
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('[Spotify Auth] Callback error:', err);
    res.send('<h2 style="color:red;text-align:center;margin-top:50px;font-family:sans-serif;">Authentication Error. Please try again.</h2>');
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
