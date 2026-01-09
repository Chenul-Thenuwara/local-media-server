import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Film, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/Input';
import { MediaCard } from '../../components/media/MediaCard';
import { useDebounce } from '../../hooks/useDebounce';
import TrendingBackground from '../../components/ui/TrendingBackground';
import api from '../../lib/api';
import { Select } from '../../components/ui/Select';

interface SearchResult {
  _id: string;
  title: string;
  original_title?: string;
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  type: 'movie' | 'tv';
  mediaType: 'movie' | 'tv';
  tmdbId?: number;
  isTmdb?: boolean;
  filename: string;
  releaseDate?: string;
  rating?: number;
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
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);

  // Filters State
  const [genre, setGenre] = useState('All');
  const [rating, setRating] = useState('All');
  const [year, setYear] = useState('All');
  const [orderBy, setOrderBy] = useState('Latest');

  // Filter Options
  // Note: Real genre filtering requires fetching genre list or mapping ids. 
  // For now we'll stick to 'All' or basic types as placeholders or "Action", "Comedy" if we implement logic.
  const genreOptions = [
    { label: 'All', value: 'All' },
    { label: 'Movie', value: 'movie' },
    { label: 'TV Show', value: 'tv' },
  ];

  const ratingOptions = [
    { label: 'All', value: 'All' },
    { label: 'IMDb 9+ ⭐', value: '9' },
    { label: 'IMDb 8+ ⭐', value: '8' },
    { label: 'IMDb 7+ ⭐', value: '7' },
    { label: 'IMDb 6+ ⭐', value: '6' },
  ];

  const years = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());
  const yearOptions = [{ label: 'All', value: 'All' }, ...years.map(y => ({ label: y, value: y }))];

  const orderByOptions = [
    { label: 'Latest', value: 'Latest' },
    { label: 'Oldest', value: 'Oldest' },
    { label: 'Top Rated', value: 'Top Rated' },
    { label: 'Alphabetical', value: 'Alphabetical' },
  ];

  useEffect(() => {
    // ... (existing useEffect for sync URL)
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  const handleSearch = useCallback(async () => {
    // ... (existing search logic)
    if (!debouncedQuery.trim()) {
      setResults([]);
      setGlobalResults([]);
      return;
    }

    setLoading(true);
    try {
      const localReq = api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
      const globalReq = api.get(`/tmdb/search?q=${encodeURIComponent(debouncedQuery)}`);

      const [localRes, globalRes] = await Promise.all([localReq, globalReq]);

      const localNormalized: SearchResult[] = localRes.data.map((item: RawSearchItem) => ({
        ...item,
        _id: item._id || '',
        posterPath: item.poster_path || item.posterPath,
        backdropPath: item.backdrop_path || item.backdropPath,
        mediaType: (item.type === 'movies' ? 'movie' : 'tv') as 'movie' | 'tv',
        filename: item.filename || item.title || 'Unknown',
        type: (item.type === 'movies' ? 'movie' : 'tv') as 'movie' | 'tv',
        title: item.title || item.name || '',
        releaseDate: item.release_date || item.first_air_date,
        rating: item.vote_average
      }));

      const libraryTmdbIds = new Set(localNormalized.map((i) => i.tmdbId));
      const globalNormalized: SearchResult[] = globalRes.data
        .filter((item: RawSearchItem) => !libraryTmdbIds.has(item.tmdbId))
        .map((item: RawSearchItem) => ({
          ...item,
          _id: (item.id || 0).toString(),
          posterPath: item.posterPath || item.poster_path, // Ensure camelCase
          backdropPath: item.backdropPath || item.backdrop_path,
          mediaType: (item.mediaType as 'movie' | 'tv') || 'movie',
          filename: 'TMDB Content',
          isTmdb: true,
          type: (item.mediaType as 'movie' | 'tv') || 'movie',
          title: item.title || item.name || '',
          releaseDate: item.release_date || item.first_air_date,
          rating: item.vote_average
        }));

      setResults(localNormalized);
      setGlobalResults(globalNormalized);

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  // Trigger search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else {
      setResults([]);
      setGlobalResults([]);
    }
  }, [debouncedQuery, handleSearch]);

  // ---------------------------------------------
  // Filter Logic
  // ---------------------------------------------
  const filterAndSort = (items: SearchResult[]) => {
    let filtered = [...items];

    // Filter by Genre (mapped to mediaType for simplicity or type)
    if (genre !== 'All') {
      filtered = filtered.filter(item => item.mediaType === genre);
    }

    // Filter by Rating
    if (rating !== 'All') {
      const minRating = parseInt(rating);
      filtered = filtered.filter(item => (item.rating || 0) >= minRating);
    }

    // Filter by Year
    if (year !== 'All') {
      filtered = filtered.filter(item => {
        const itemYear = item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : '';
        return itemYear === year;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (orderBy === 'Latest') {
        const dateA = new Date(a.releaseDate || '1970-01-01').getTime();
        const dateB = new Date(b.releaseDate || '1970-01-01').getTime();
        return dateB - dateA;
      }
      if (orderBy === 'Oldest') {
        const dateA = new Date(a.releaseDate || '1970-01-01').getTime();
        const dateB = new Date(b.releaseDate || '1970-01-01').getTime();
        return dateA - dateB;
      }
      if (orderBy === 'Top Rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (orderBy === 'Alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  };

  const filteredLocal = filterAndSort(results);
  const filteredGlobal = filterAndSort(globalResults);

  return (
    <div className="min-h-full relative">
      <div className="fixed inset-0 z-0">
        <TrendingBackground />
      </div>

      <div className="relative z-10 p-8 pt-12 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto mb-12">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-6">Search Library & Global</h1>

          {/* Search Input */}
          <div className="relative group mb-6">
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

          {/* Filters Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select
              label="Genre"
              options={genreOptions}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
            <Select
              label="IMDb Rating"
              options={ratingOptions}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
            <Select
              label="Year"
              options={yearOptions}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <Select
              label="Order By"
              options={orderByOptions}
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!query ? (
            // ...
            <div className="text-center text-gray-500 py-32 opacity-50">
              <Film size={64} className="mx-auto mb-6 opacity-20" />
              <p className="text-xl">Start typing to search your collection and beyond</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Local Results */}
              {filteredLocal.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-apple-blue rounded-full" />
                    In Your Library ({filteredLocal.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredLocal.map((item) => (
                      <MediaCard key={item._id} item={item} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Global Results */}
              {filteredGlobal.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-400">
                    <span className="w-2 h-8 bg-gray-700 rounded-full" />
                    Global Results (TMDB) ({filteredGlobal.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                    {filteredGlobal.map((item) => (
                      <MediaCard key={item._id} item={item} />
                    ))}
                  </div>
                </motion.div>
              )}

              {filteredLocal.length === 0 && filteredGlobal.length === 0 && !loading && (
                <div className="text-center text-gray-500 py-20">
                  <p className="text-xl">No results found matching your filters.</p>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
