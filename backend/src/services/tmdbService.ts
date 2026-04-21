import axios from 'axios';
import path from 'path';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

function cleanFilename(filename: string): string {
  const name = path.parse(filename).name;
  return name
    .replace(/[.\\-_]/g, ' ')
    .replace(/\b(S\d{1,2}E\d{1,2}|Season\s*\d+|Episode\s*\d+|\d+x\d+)\b.*/gi, '') // Remove episode info
    .replace(/\s+(19|20)\d{2}.*$/, '') // Remove year onwards
    .replace(/(REPACK|PROPER|EXTENDED|BluRay|WEB|HDTV|4K|2160p|1080p|720p|HDR|DDP|DTS|AAC|x264|x265|HEVC|REMUX|UHD).*/gi, '') // Remove quality tags
    .replace(/(\[.*?\]|\{.*?\}|\(.*?\))/g, '') // Remove brackets
    .replace(/Pahe\.in|YTS|YIFY|RARBG|GalaxyRG/gi, '') // Remove common release groups
    .trim();
}

export interface TMDBMetadata {
  title: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  tmdbId: number;
  detectedType?: 'movie' | 'tv'; // TMDB-determined type
}

// Smart search using /search/multi — TMDB decides if it's movie or TV
export const fetchMetadata = async (filename: string, hint: 'movie' | 'tv' = 'movie'): Promise<TMDBMetadata | null> => {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY is missing');
    return null;
  }

  const cleanName = cleanFilename(filename);
  if (!cleanName || cleanName.length < 2) return null;

  try {
    // First try multi-search so TMDB determines the type
    const multiRes = await axios.get(`${BASE_URL}/search/multi`, {
      params: { api_key: TMDB_API_KEY, query: cleanName, language: 'en-US' }
    });

    const results = (multiRes.data.results || []).filter(
      (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
    );

    if (results.length > 0) {
      const match = results[0];
      const isTV = match.media_type === 'tv';
      return {
        title: isTV ? match.name : match.title,
        overview: match.overview,
        posterPath: match.poster_path,
        backdropPath: match.backdrop_path,
        releaseDate: isTV ? match.first_air_date : match.release_date,
        tmdbId: match.id,
        detectedType: match.media_type as 'movie' | 'tv',
      };
    }

    // Fallback: try the hinted type endpoint directly
    const fallbackRes = await axios.get(`${BASE_URL}/search/${hint}`, {
      params: { api_key: TMDB_API_KEY, query: cleanName, language: 'en-US' }
    });

    if (fallbackRes.data.results?.length > 0) {
      const match = fallbackRes.data.results[0];
      return {
        title: hint === 'movie' ? match.title : match.name,
        overview: match.overview,
        posterPath: match.poster_path,
        backdropPath: match.backdrop_path,
        releaseDate: hint === 'movie' ? match.release_date : match.first_air_date,
        tmdbId: match.id,
        detectedType: hint,
      };
    }

    return null;
  } catch (error) {
    console.error(`TMDB Fetch Error for ${filename}:`, error);
    return null;
  }
};
