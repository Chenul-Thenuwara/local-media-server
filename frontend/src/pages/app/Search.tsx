import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Film, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/Input';
import { MediaCard } from '../../components/media/MediaCard';
import TrendingBackground from '../../components/ui/TrendingBackground';
import api from '../../lib/api';
import { TMDB_GENRES, TMDB_TV_GENRES } from '../../lib/constants';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

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
  genreIds?: number[];
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
  genre_ids?: number[];
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalResults, setGlobalResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [isError, setIsError] = useState(false);

  // Filters State
  const [type, setType] = useState('All');
  const [genre, setGenre] = useState('All');
  const [rating, setRating] = useState('All');
  const [year, setYear] = useState('All');
  const [orderBy, setOrderBy] = useState('Latest');

  // Filter Options
  const typeOptions = [
    { label: 'All', value: 'All' },
    { label: 'Movie', value: 'movie' },
    { label: 'TV Show', value: 'tv' },
  ];

  // Combine unique genres for display
  const allGenres = [...TMDB_GENRES, ...TMDB_TV_GENRES].reduce((acc, current) => {
    const x = acc.find(item => item.id === current.id);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, [] as typeof TMDB_GENRES).sort((a, b) => a.name.localeCompare(b.name));

  const genreOptions = [
    { label: 'All', value: 'All' },
    ...allGenres.map(g => ({ label: g.name, value: g.id.toString() }))
  ];

  const ratingOptions = [
    { label: 'All', value: 'All' },
    { label: 'IMDb 9+', value: '9' },
    { label: 'IMDb 8+', value: '8' },
    { label: 'IMDb 7+', value: '7' },
    { label: 'IMDb 6+', value: '6' },
  ];

  const years = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());
  const yearOptions = [{ label: 'All', value: 'All' }, ...years.map(y => ({ label: y, value: y }))];

  const orderByOptions = [
    { label: 'Latest', value: 'Latest' },
    { label: 'Oldest', value: 'Oldest' },
    { label: 'Top Rated', value: 'Top Rated' },
    { label: 'Alphabetical', value: 'Alphabetical' },
  ];

  const handleSearch = useCallback(async (searchQuery: string) => {
    // Allow search if query exists OR if any filter is active
    const isFilterActive = type !== 'All' || genre !== 'All' || year !== 'All';

    if (!searchQuery.trim() && !isFilterActive) {
      setResults([]);
      setGlobalResults([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    // Update URL only if query exists, or manage filter params in URL (optional, skipping for now)
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }

    try {
      // Build Query Params
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery);
      if (type !== 'All') params.append('type', type);
      if (genre !== 'All') params.append('genre', genre);
      if (year !== 'All') params.append('year', year);
      if (rating !== 'All') params.append('rating', rating);
      if (orderBy !== 'Latest') params.append('orderBy', orderBy);

      const queryString = params.toString();

      const localReq = api.get(`/search?${queryString}`);
      const globalReq = api.get(`/tmdb/search?${queryString}`);

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
        rating: item.vote_average,
        genreIds: item.genre_ids || [] // Local items likely missing this
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
          rating: item.vote_average,
          genreIds: item.genre_ids || []
        }));

      setResults(localNormalized);
      setGlobalResults(globalNormalized);

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams, type, genre, year, rating, orderBy]);

  useEffect(() => {
    // Initial search if query param exists
    if (initialQuery && !hasSearched) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, hasSearched, handleSearch]);

  const onSearchClick = () => {
    handleSearch(query);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  // ---------------------------------------------
  // Filter Logic (Client-side refinement)
  // ---------------------------------------------
  const filterAndSort = (items: SearchResult[]) => {
    let filtered = [...items];

    // Filter by Type
    if (type !== 'All') {
      filtered = filtered.filter(item => item.mediaType === type);
    }

    // Filter by Genre (Real IDs)
    if (genre !== 'All') {
      const genreId = parseInt(genre);
      filtered = filtered.filter(item => item.genreIds && item.genreIds.includes(genreId));
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
          <div className="flex gap-4 mb-6">
            <div className="relative group flex-1">
              <SearchIcon className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10", isError ? "text-red-500" : "text-gray-400 group-focus-within:text-apple-blue")} size={24} />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHasSearched(false);
                  setIsError(false);
                }}
                onKeyDown={onKeyDown}
                placeholder={isError ? "Please enter a search term..." : "Search for movies, TV shows..."}
                className={cn(
                  "pl-12 py-6 text-lg bg-white/5 border-white/10 focus:border-apple-blue/50 rounded-2xl w-full transition-all",
                  isError && "border-red-500/50 focus:border-red-500/50 placeholder:text-red-400/50"
                )}
                autoFocus
              />
            </div>
            <Button
              onClick={onSearchClick}
              disabled={loading}
              className="h-auto px-8 py-4 text-lg bg-apple-blue hover:bg-apple-blue/90 rounded-2xl font-medium min-w-[120px]"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : 'Search'}
            </Button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select
              label="Type"
              options={typeOptions}
              value={type}
              onChange={setType}
            />
            <Select
              label="Genre"
              options={genreOptions}
              value={genre}
              onChange={setGenre}
            />
            <Select
              label="IMDb Rating"
              options={ratingOptions}
              value={rating}
              onChange={setRating}
            />
            <Select
              label="Year"
              options={yearOptions}
              value={year}
              onChange={setYear}
            />
            <Select
              label="Order By"
              options={orderByOptions}
              value={orderBy}
              onChange={setOrderBy}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!hasSearched && !loading ? (
            <div className="text-center text-gray-500 py-32 opacity-50">
              <Film size={64} className="mx-auto mb-6 opacity-20" />
              <p className="text-xl">
                {query ? 'Press Enter or click Search to find results' : 'Start typing to search your collection and beyond'}
              </p>
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
