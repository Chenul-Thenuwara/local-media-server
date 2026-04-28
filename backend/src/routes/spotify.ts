import { Router } from 'express';
import axios from 'axios';
import { getSpotifyToken, invalidateToken } from '../services/spotifyService';

const router = Router();

// Search tracks, albums, or artists
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'track,artist,album' } = req.query;
    const limit = Math.min(Number(req.query.limit) || 10, 10); // Spotify caps at 10 for multi-type search
    if (!q) return res.status(400).json({ error: 'Query param q is required' });

    let token = await getSpotifyToken();
    let response;
    try {
      response = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: { q, type, limit },
      });
    } catch (innerErr: any) {
      const status = innerErr?.response?.status;
      if (status === 400 || status === 401) {
        invalidateToken();
        token = await getSpotifyToken();
        response = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${token}` },
          params: { q, type, limit },
        });
      } else throw innerErr;
    }

    res.json(response.data);
  } catch (error: any) {
    console.error('Spotify Search Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

// Get a specific track
router.get('/track/:id', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${req.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// Get an artist  
router.get('/artist/:id', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const [artistRes, topTracksRes] = await Promise.all([
      axios.get(`https://api.spotify.com/v1/artists/${req.params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`https://api.spotify.com/v1/artists/${req.params.id}/top-tracks?market=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    res.json({ ...artistRes.data, topTracks: topTracksRes.data.tracks });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch artist' });
  }
});

// Get an album
router.get('/album/:id', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/albums/${req.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Get new releases (via search - /browse/new-releases is deprecated)
router.get('/new-releases', async (req, res) => {
  try {
    let token = await getSpotifyToken();
    const year = new Date().getFullYear();
    const params = { q: `year:${year}`, type: 'album', limit: 10 };
    let response;
    try {
      response = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    } catch (innerErr: any) {
      const status = innerErr?.response?.status;
      if (status === 400 || status === 401) {
        console.log('[Spotify] Stale token detected — refreshing...');
        invalidateToken();
        token = await getSpotifyToken();
        response = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
      } else throw innerErr;
    }
    res.json(response.data);
  } catch (error: any) {
    console.error('Spotify new-releases error:', error?.response?.data || error?.message);
    res.status(500).json({ error: 'Failed to fetch new releases' });
  }
});

// Get top charting tracks (via search for trending music)
router.get('/top-tracks', async (req, res) => {
  try {
    let token = await getSpotifyToken();
    const year = new Date().getFullYear();
    const params = { q: `year:${year} tag:hipster`, type: 'track', limit: 20, market: 'US' };
    let response;
    try {
      response = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
    } catch (innerErr: any) {
      const status = innerErr?.response?.status;
      if (status === 400 || status === 401) {
        invalidateToken();
        token = await getSpotifyToken();
        response = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
      } else throw innerErr;
    }

    // Also fetch popular tracks via genre search
    let popularResponse;
    try {
      popularResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: 'genre:pop', type: 'track', limit: 20, market: 'US' },
      });
    } catch (e) {
      popularResponse = response;
    }

    const tracks = popularResponse?.data?.tracks?.items || response?.data?.tracks?.items || [];
    res.json({ tracks });
  } catch (error: any) {
    console.error('Spotify top-tracks error:', error?.response?.data || error?.message);
    res.status(500).json({ error: 'Failed to fetch top tracks' });
  }
});

// Get new release albums (enriched)
router.get('/new-release-albums', async (req, res) => {
  try {
    let token = await getSpotifyToken();
    const year = new Date().getFullYear();
    let response;
    try {
      response = await axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: `year:${year}`, type: 'album', limit: 15, market: 'US' },
      });
    } catch (innerErr: any) {
      const status = innerErr?.response?.status;
      if (status === 400 || status === 401) {
        invalidateToken();
        token = await getSpotifyToken();
        response = await axios.get('https://api.spotify.com/v1/search', {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: `year:${year}`, type: 'album', limit: 15, market: 'US' },
        });
      } else throw innerErr;
    }
    const albums = response?.data?.albums?.items || [];
    res.json({ albums });
  } catch (error: any) {
    console.error('Spotify new-release-albums error:', error?.response?.data || error?.message);
    res.status(500).json({ error: 'Failed to fetch new release albums' });
  }
});

export default router;
