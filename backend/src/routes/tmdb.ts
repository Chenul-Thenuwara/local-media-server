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

router.get('/tv/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'TMDB API Key missing' });

    const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&append_to_response=credits`);
    const data = response.data;

    // Transform to match App's MediaDetail interface
    const media = {
      _id: data.id.toString(),
      title: data.name,
      overview: data.overview,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
      releaseDate: data.first_air_date,
      type: 'tv',
      filename: 'TMDB Content',
      path: '',
      size: 0,
      isTmdb: true,
      tmdbId: data.id, // Explicitly pass TMDB ID
      credits: data.credits,
      seasons: data.seasons // Pass seasons metadata
    };

    res.json(media);
  } catch (error) {
    console.error('TMDB TV Detail Error:', error);
    res.status(404).json({ message: 'TV Show not found on TMDB' });
  }
});

router.get('/tv/:id/season/:seasonNumber', async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'TMDB API Key missing' });

    const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    console.error('TMDB Season Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

router.get('/tv/:id/season/:seasonNumber/credits', async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'TMDB API Key missing' });

    const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}/credits?api_key=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    console.error('TMDB Season Credits Error:', error);
    res.status(500).json({ error: 'Failed to fetch season credits' });
  }
});

router.get('/credits/tv/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'TMDB API Key missing' });

    const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=${apiKey}`);
    res.json(response.data);
  } catch (error) {
    console.error('TMDB TV Credits Error:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, type, genre, year, page } = req.query;
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'TMDB API Key missing' });

    // ---------------------------------------------------------
    // Scenario 1: Text Search (search/multi)
    // ---------------------------------------------------------
    if (q) {
      const response = await axios.get(`https://api.themoviedb.org/3/search/multi`, {
        params: {
          api_key: apiKey,
          query: q,
          include_adult: false,
          language: 'en-US',
          page: page || 1
        }
      });

      const results = response.data.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => ({
          _id: item.id.toString(),
          tmdbId: item.id,
          title: item.media_type === 'movie' ? item.title : item.name,
          original_title: item.original_title || item.original_name,
          posterPath: item.poster_path,
          backdropPath: item.backdrop_path,
          overview: item.overview,
          type: item.media_type,
          mediaType: item.media_type,
          releaseDate: item.media_type === 'movie' ? item.release_date : item.first_air_date,
          rating: item.vote_average,
          genreIds: item.genre_ids,
          isTmdb: true
        }));

      return res.json(results);
    }

    // ---------------------------------------------------------
    // Scenario 2: Browse / Discover (No Text)
    // ---------------------------------------------------------
    const { rating, orderBy } = req.query; // Destructure new params

    // Default to 'movie' if 'all' or missing, or handle parallel if ambitious.
    // For simplicity: If 'all', we'll fetch Movies. User can switch to TV.
    const targetType = (type === 'tv' ? 'tv' : 'movie');

    // Sort Mapping
    let sortBy = 'popularity.desc';
    if (orderBy === 'Oldest') sortBy = 'primary_release_date.asc'; // or first_air_date.asc for TV
    if (orderBy === 'Latest') sortBy = 'primary_release_date.desc';
    if (orderBy === 'Top Rated') sortBy = 'vote_average.desc';
    // Note: Alphabetical sort is not directly supported well in discover without issues, often popularity is better default.

    const params: any = {
      api_key: apiKey,
      include_adult: false,
      language: 'en-US',
      page: page || 1,
      sort_by: sortBy
    };

    if (targetType === 'tv') {
      if (sortBy.includes('primary_release_date')) {
        params.sort_by = sortBy.replace('primary_release_date', 'first_air_date');
      }
    }

    if (genre && genre !== 'All') params.with_genres = genre;

    if (year && year !== 'All') {
      if (targetType === 'movie') params.primary_release_year = year;
      else params.first_air_date_year = year;
    }

    if (rating && rating !== 'All') {
      params['vote_average.gte'] = rating;
      params['vote_count.gte'] = 50; // Basic quality filter to avoid 1-vote wonder 10s
    }

    const response = await axios.get(`https://api.themoviedb.org/3/discover/${targetType}`, { params });

    const results = response.data.results.map((item: any) => ({
      _id: item.id.toString(),
      tmdbId: item.id,
      title: targetType === 'movie' ? item.title : item.name,
      original_title: item.original_title || item.original_name,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      overview: item.overview,
      type: targetType,
      mediaType: targetType,
      releaseDate: targetType === 'movie' ? item.release_date : item.first_air_date,
      rating: item.vote_average,
      genreIds: item.genre_ids,
      isTmdb: true
    }));

    res.json(results);

  } catch (error) {
    console.error('TMDB Search/Discover Error:', error);
    res.status(500).json({ error: 'Failed to search/discover TMDB' });
  }
});

export default router;
