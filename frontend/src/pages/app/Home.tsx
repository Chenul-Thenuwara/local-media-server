import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, FolderPlus, Film, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FolderPicker } from '../../components/ui/FolderPicker';
import { MediaRow } from '../../components/media/MediaRow';
import TrendingBackground from '../../components/ui/TrendingBackground';
import api from '../../lib/api';

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
}

interface Library {
  _id: string;
  name: string;
  path: string;
  type: 'movies' | 'tv';
}

interface SearchResult {
  _id: string;
  title: string;
  posterPath?: string;
  mediaType: 'movie' | 'tv';
  releaseDate?: string;
  isTmdb?: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard Data
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [recentMovies, setRecentMovies] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [recentTV, setRecentTV] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Instant Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    console.log(`Performing search for: "${query}"`);

    try {
      // Run requests in parallel but handle errors individually
      const [localRes, globalRes] = await Promise.allSettled([
        api.get(`/search?q=${query}`),
        api.get(`/tmdb/search?q=${query}`)
      ]);

      let combinedResults: SearchResult[] = [];

      // Define interfaces for API responses
      interface LocalSearchItem {
        _id: string;
        title?: string;
        filename: string;
        posterPath?: string;
        type: 'movie' | 'tv' | 'movies'; // 'movies' handles legacy/singular mismatch
        releaseDate?: string;
      }

      interface TmdbSearchItem {
        id: number;
        title?: string;
        name?: string;
        poster_path?: string;
        media_type?: 'movie' | 'tv';
        release_date?: string;
        first_air_date?: string;
      }

      // Process Local Results
      if (localRes.status === 'fulfilled') {

        const localItems: SearchResult[] = (localRes.value.data as LocalSearchItem[]).map((item) => ({
          _id: item._id,
          title: item.title || item.filename,
          posterPath: item.posterPath,
          mediaType: (item.type === 'movie' || item.type === 'movies') ? 'movie' : 'tv',
          releaseDate: item.releaseDate,
          isTmdb: false
        }));
        combinedResults = [...combinedResults, ...localItems];
      } else {
        console.error('Local search failed:', localRes.reason);
      }

      // Process Global Results
      if (globalRes.status === 'fulfilled') {

        const results = globalRes.value.data.results || [];
        const globalItems: SearchResult[] = (results as TmdbSearchItem[])
          .slice(0, 5)
          .map((item) => ({
            _id: item.id.toString(),
            title: item.title || item.name || 'Unknown',
            posterPath: item.poster_path,
            mediaType: item.media_type || 'movie',
            releaseDate: item.release_date || item.first_air_date,
            isTmdb: true
          }));
        combinedResults = [...combinedResults, ...globalItems];
      } else {
        console.error('Global search failed:', globalRes.reason);
      }

      console.log(`Found ${combinedResults.length} combined results`);
      setSearchResults(combinedResults);
      setShowDropdown(combinedResults.length > 0);
    } catch (error) {
      console.error('Critical instant search error', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    // Debounce 300ms
    searchTimeout.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const [setupName, setSetupName] = useState('');
  const [setupPath, setSetupPath] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Defined before checkLibraries to avoid dependency cycle
  const fetchDashboardData = useCallback(async () => {
    // 1. Fetch Trending from TMDB (External)
    // 1. Fetch Trending from TMDB (External)
    try {
      const res = await api.get('/tmdb/trending');
      const movies = res.data.results || [];
      if (movies.length > 0) {
        setFeatured(movies[Math.floor(Math.random() * movies.length)]);
      } else {
        // Fallback if no trending movies found
        setFeatured({
          id: 0,
          title: "Welcome to Local Media Server",
          overview: "Add content to your libraries to see it here.",
          backdrop_path: "",
          poster_path: ""
        });
      }
    } catch (err) {
      console.error('Failed to fetch trending', err);
      // Fallback on error to unblock UI
      setFeatured({
        id: 0,
        title: "Welcome to Local Media Server",
        overview: "Could not fetch trending movies. Check your internet connection or TMDB API key.",
        backdrop_path: "",
        poster_path: ""
      });
    }

    // 2. Fetch Local Media (Internal)
    try {
      const [moviesRes, tvRes] = await Promise.all([
        api.get('/media/recent?type=movies'),
        api.get('/media/recent?type=tv')
      ]);
      setRecentMovies(moviesRes.data);
      setRecentTV(tvRes.data);
    } catch (err) {
      console.error('Failed to fetch local media', err);
    }
  }, []);

  const checkLibraries = useCallback(async () => {
    try {
      const res = await api.get('/libraries');
      setLibraries(res.data);
      if (res.data.length > 0) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to fetch libraries', err);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  useEffect(() => {
    checkLibraries();
  }, [checkLibraries]);

  const handleAddLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    try {
      await api.post('/libraries', {
        name: setupName,
        path: setupPath,
        type: 'auto'
      });
      // Refresh to switch to dashboard view
      await checkLibraries();
    } catch (err) {
      console.error('Failed to create library', err);
      confirm('Failed to add folder');
    } finally {
      setSetupLoading(false);
    }
  };

  const triggerRefresh = async (type: 'movies' | 'tv') => {
    const targetLibs = libraries.filter(l => l.type === type);
    if (targetLibs.length === 0) return;

    // Refresh all libraries of this type
    await Promise.all(targetLibs.map(lib => api.post(`/libraries/${lib._id}/refresh`)));
    setTimeout(fetchDashboardData, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/search?q=${searchQuery}`);
      setShowDropdown(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>;

  // EMPTY STATE: Show Setup Wizard
  // EMPTY STATE: Show Setup Wizard
  if (libraries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background */}
        <TrendingBackground />

        {/* Overlay Darkener */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

        {showPicker && (
          <FolderPicker
            onCancel={() => setShowPicker(false)}
            onSelect={(path) => {
              setSetupPath(path);
              setShowPicker(false);
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6 text-center relative z-10"
        >
          <div className="space-y-3">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-[20px] flex items-center justify-center text-white backdrop-blur-xl border border-white/10 shadow-2xl mb-4 ring-1 ring-white/20"
            >
              <FolderPlus size={32} className="drop-shadow-glow" />
            </motion.div>

            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-xl">
              Add Your Media
            </h1>
            <p className="text-base text-gray-300 max-w-sm mx-auto leading-relaxed">
              Connect your local folder to build your personal library.
            </p>
          </div>

          <form onSubmit={handleAddLibrary} className="bg-black/40 backdrop-blur-xl p-6 rounded-[24px] border border-white/10 space-y-5 text-left shadow-2xl ring-1 ring-white/5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 ml-1 uppercase tracking-wider">Library Name</label>
              <Input
                placeholder="e.g. My Movies"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                required
                className="bg-white/5 border-white/10 focus:border-apple-blue/50 focus:ring-apple-blue/50 h-10 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 ml-1 uppercase tracking-wider">Folder Path</label>
              <div className="flex gap-2.5">
                <Input
                  placeholder="No folder selected"
                  value={setupPath}
                  readOnly
                  className="cursor-default text-gray-400 bg-white/5 border-white/10 border-dashed h-10"
                  required
                />
                <Button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="shrink-0 px-4 h-10 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 text-sm"
                >
                  Browse
                </Button>
              </div>
            </div>


            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-bold mt-4 bg-gradient-to-r from-apple-blue to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-xl shadow-blue-500/20 border-none rounded-xl"
              disabled={setupLoading}
            >
              {setupLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span>Setting up...</span>
                </div>
              ) : 'Add Library'}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // DASHBOARD STATE (Existing Logic)
  if (!featured) return <div className="h-full flex items-center justify-center text-gray-500">Preparing Custom Dashboard...</div>;

  return (
    <div className="min-h-full pb-20 relative">
      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden shrink-0 z-10">
        <div className="absolute inset-0">
          <img
            src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
            alt={featured.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 p-6 pb-24 md:p-12 md:pb-32 max-w-2xl z-10 pointer-events-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4 drop-shadow-2xl"
          >
            {featured.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-200 line-clamp-3 mb-6 md:mb-8 drop-shadow-md"
          >
            {featured.overview}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <Button
              size="lg"
              className="bg-gray-500/30 hover:bg-gray-500/40 backdrop-blur-md border border-white/10 text-white px-6 py-6 md:px-8 md:py-7 text-base md:text-lg font-semibold rounded-2xl shadow-lg transition-all duration-300"
              onClick={() => navigate(`/media/tmdb/movie/${featured.id}`)}
            >
              <Info className="mr-3 w-5 h-5 md:w-6 md:h-6 opacity-80" />
              More Info
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Top Bar (Search) - Moved outside overflow-hidden hero */}
      <div className="absolute top-16 lg:top-0 right-0 p-4 md:p-8 z-50 w-full md:max-w-md flex justify-end pointer-events-auto" ref={dropdownRef}>
        <div className="relative group w-full max-w-[200px] md:w-64 focus-within:max-w-[300px] md:focus-within:w-80 transition-all duration-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors z-10 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchInput}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-full py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-black/40 focus:border-white/30 transition-all shadow-lg"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 animate-spin" size={16} />
          )}

          {/* Instant Search Dropdown */}
          <AnimatePresence>
            {showDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 w-full bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto scrollbar-hide"
              >
                <div className="p-2 space-y-1">
                  {searchResults.map((item) => (
                    <div
                      key={`${item.isTmdb ? 'tmdb' : 'local'}-${item._id}`}
                      onClick={() => {
                        navigate(`/media/${item._id}`);
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                    >
                      <div className="w-10 h-14 bg-gray-800 rounded-md overflow-hidden shrink-0">
                        {item.posterPath ? (
                          <img src={`https://image.tmdb.org/t/p/w92${item.posterPath}`} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500"><Film size={16} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate group-hover:text-apple-blue transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Unknown'}</span>
                          <span>•</span>
                          <span className="capitalize">{item.mediaType}</span>
                          {item.isTmdb && <span className="text-[10px] bg-apple-blue/20 text-apple-blue px-1.5 py-0.5 rounded">TMDB</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  onClick={() => navigate(`/search?q=${searchQuery}`)}
                  className="p-3 text-center text-xs font-medium text-apple-blue border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  View all results for "{searchQuery}"
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Media Rows */}
      <div className="px-4 -mt-16 md:px-12 md:-mt-20 relative z-20 space-y-8 md:space-y-12">
        {recentMovies.length > 0 && (
          <MediaRow
            title="Recent Movies"
            items={recentMovies}
            onRefresh={() => triggerRefresh('movies')}
          />
        )}

        {recentTV.length > 0 && (
          <MediaRow
            title="Recent TV Shows"
            items={recentTV}
            onRefresh={() => triggerRefresh('tv')}
          />
        )}
      </div>
    </div>
  );
}
