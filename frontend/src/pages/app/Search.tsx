import { useState, useEffect } from 'react';
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
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  type: 'movie' | 'tv';
  mediaType: 'movie' | 'tv'; // normalized for MediaCard
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
      // normalize data for MediaCard
      const normalized = res.data.map((item: any) => ({
        ...item,
        mediaType: item.type === 'movies' ? 'movie' : 'tv'
      }));
      setResults(normalized);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full relative">
      <div className="fixed inset-0 z-0">
        <TrendingBackground />
      </div>

      <div className="relative z-10 p-8 pt-12 max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold mb-6">Search Library</h1>
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
          {query && results.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-500 py-20"
            >
              <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium">No results found for "{query}"</p>
              <p className="text-sm mt-2">Try checking your spelling or search for something else.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            >
              {results.map((item) => (
                <MediaCard key={item._id} item={item} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!query && (
          <div className="text-center text-gray-500 py-32 opacity-50">
            <Film size={64} className="mx-auto mb-6 opacity-20" />
            <p className="text-xl">Start typing to search your collection</p>
          </div>
        )}
      </div>
    </div>
  );
}
