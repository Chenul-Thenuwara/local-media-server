import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'dc4736d707b74ffc99146fa7c48d507c';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '5860e93fab3242dd95b443926da54e6e';

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

  try {
    const token = await getToken();
    const response = await axios.get('https://api.spotify.com/v1/browse/new-releases?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
