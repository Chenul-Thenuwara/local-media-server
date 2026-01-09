import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Film, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/Input';
import { MediaCard } from '../../components/media/MediaCard';
import { useDebounce } from '../../hooks/useDebounce';
import TrendingBackground from '../../components/ui/TrendingBackground';
import api from '../../lib/api';

interface SearchResult {
  _id: string;
  title: string;
  original_title?: string;
  posterPath?: string; // matched to MediaItem
  backdropPath?: string;
  overview?: string;
  type: 'movie' | 'tv';
  mediaType: 'movie' | 'tv';
  tmdbId?: number;
  isTmdb?: boolean;
  filename: string; // Required by MediaCard
}

interface RawSearchItem {
  _id?: string;
  id?: number;
  tmdbId?: number;
  title?: string;
  name?: string;
  poster_path?: string;
  posterPath?: string;
  backdrop_path?: string;
  backdropPath?: string;
  mediaType?: string;
  type?: string;
  filename?: string;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    // Sync URL with query
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  // Define handleSearch with useCallback to be used in useEffect
  const handleSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setGlobalResults([]);
      return;
    }

    setLoading(true);
    try {
      // 1. Local Library Search
      const localReq = api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);

      // 2. Global TMDB Search
      const globalReq = api.get(`/tmdb/search?q=${encodeURIComponent(debouncedQuery)}`);

      const [localRes, globalRes] = await Promise.all([localReq, globalReq]);

      // Normalize Local
      const localNormalized: SearchResult[] = localRes.data.map((item: RawSearchItem) => ({
        ...item,
        _id: item._id || '', // Ensure _id exists
        posterPath: item.poster_path || item.posterPath, // Handle both cases
        backdropPath: item.backdrop_path || item.backdropPath,
        mediaType: (item.type === 'movies' ? 'movie' : 'tv') as 'movie' | 'tv',
        filename: item.filename || item.title || 'Unknown', // Ensure filename exists
        type: (item.type === 'movies' ? 'movie' : 'tv') as 'movie' | 'tv',
        title: item.title || item.name || ''
      }));

      // Normalize Global (exclude items already in library)
      const libraryTmdbIds = new Set(localNormalized.map((i) => i.tmdbId));
      const globalNormalized: SearchResult[] = globalRes.data
        .filter((item: RawSearchItem) => !libraryTmdbIds.has(item.tmdbId))
        .map((item: RawSearchItem) => ({
          ...item,
          _id: (item.id || 0).toString(),
          posterPath: item.posterPath || item.poster_path, // Ensure camelCase
          backdropPath: item.backdropPath || item.backdrop_path,
          mediaType: (item.mediaType as 'movie' | 'tv') || 'movie',
          filename: 'TMDB Content', // Placeholder for global items
          isTmdb: true,
          type: (item.mediaType as 'movie' | 'tv') || 'movie',
          title: item.title || item.name || ''
        }));

      setResults(localNormalized);
      setGlobalResults(globalNormalized);

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else {
      setResults([]);
      setGlobalResults([]);
    }
  }, [debouncedQuery, handleSearch]);

  return (
    <div className="min-h-full relative">
      <div className="fixed inset-0 z-0">
        <TrendingBackground />
      </div>

      <div className="relative z-10 p-8 pt-12 max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto mb-12">
          {/* ... Header and Input ... */}
          <h1 className="text-3xl font-bold mb-6">Search Library & Global</h1>
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-apple-blue transition-colors z-10" size={24} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies, TV shows..."
              className="pl-12 py-6 text-lg bg-white/5 border-white/10 focus:border-apple-blue/50 rounded-2xl"
              autoFocus
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="animate-spin text-apple-blue" size={20} />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!query ? (
            <div className="text-center text-gray-500 py-32 opacity-50">
              <Film size={64} className="mx-auto mb-6 opacity-20" />
              <p className="text-xl">Start typing to search your collection and beyond</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Local Results */}
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-apple-blue rounded-full" />
                    In Your Library
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {results.map((item) => (
                      <MediaCard key={item._id} item={item} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Global Results */}
              {globalResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-400">
                    <span className="w-2 h-8 bg-gray-700 rounded-full" />
                    Global Results (TMDB)
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                    {globalResults.map((item) => (
                      <MediaCard key={item._id} item={item} />
                    ))}
                  </div>
                </motion.div>
              )}

              {results.length === 0 && globalResults.length === 0 && !loading && (
                <div className="text-center text-gray-500 py-20">
                  <p className="text-xl">No results found anywhere.</p>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
