import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '005eba4dc9364770a51dd8bd47903ed6';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'c7ee6ab0d021406ea514cca1076d340d';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  cachedToken = res.data.access_token;
  tokenExpiresAt = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken!;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type = 'track,artist,album', limit = '10' } = req.query;
  if (!q) return res.status(400).json({ error: 'Query param q is required' });

  try {
    const token = await getToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q, type, limit },
    });
    res.status(200).json(response.data);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
}
