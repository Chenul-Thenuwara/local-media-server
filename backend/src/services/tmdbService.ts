import axios from 'axios';
import path from 'path';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const fetchMetadata = async (filename: string, type: 'movie' | 'tv') => {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY is missing');
    return null;
  }

  try {
    // 1. Clean filename
    // "Avengers.Endgame.2019.1080p.mp4" -> "Avengers Endgame 2019"
    const name = path.parse(filename).name;
    const cleanName = name
      .replace(/[.\-_]/g, ' ') // Replace separators with spaces
      .replace(/\s+(19|20)\d{2}.*$/, '') // Remove year and everything after (simple heuristic)
      .replace(/(\[.*?\]|\{.*?\})/g, '') // Remove brackets
      .trim();

    // 2. Search TMDB
    const searchUrl = `${BASE_URL}/search/${type}`;
    const res = await axios.get(searchUrl, {
      params: {
        api_key: TMDB_API_KEY,
        query: cleanName,
        language: 'en-US'
      }
    });

    if (res.data.results && res.data.results.length > 0) {
      const match = res.data.results[0]; // Take top result
      return {
        title: type === 'movie' ? match.title : match.name,
        overview: match.overview,
        posterPath: match.poster_path,
        backdropPath: match.backdrop_path,
        releaseDate: type === 'movie' ? match.release_date : match.first_air_date,
        tmdbId: match.id
      };
    }

    return null;

  } catch (error) {
    console.error(`TMDB Fetch Error for ${filename}:`, error);
    return null;
  }
};
