import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Bypass-Tunnel-Reminder, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
    if (!TMDB_API_KEY) {
      return res.status(500).json({ message: 'TMDB_API_KEY is not configured' });
    }
    
    // Attempt to fetch trending from TMDB
    const response = await axios.get(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`
    );

    res.status(200).json(response.data);
  } catch (error) {
    const err = error as Error;
    console.error('TMDB Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch TMDB data', details: err.message });
  }
}
