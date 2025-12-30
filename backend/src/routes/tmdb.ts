import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.get('/trending', async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'TMDB API Key missing' });
    }

    const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    console.error('TMDB Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch from TMDB' });
  }
});

export default router;
