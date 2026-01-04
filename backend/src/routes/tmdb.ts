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

router.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'TMDB API Key missing' });

    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=credits`);
    const data = response.data;

    // Transform to match App's MediaDetail interface
    const media = {
      _id: data.id.toString(),
      title: data.title,
      overview: data.overview,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
      releaseDate: data.release_date,
      type: 'movie',
      filename: 'TMDB Content',
      path: '',
      size: 0,
      isTmdb: true,
      credits: data.credits // Pass full credits object
    };

    res.json(media);
  } catch (error) {
    console.error('TMDB Detail Error:', error);
    res.status(404).json({ message: 'Movie not found on TMDB' });
  }
});

router.get('/credits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'TMDB API Key missing' });

    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    console.error('TMDB Credits Error:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

export default router;
