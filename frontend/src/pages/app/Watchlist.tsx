import { motion } from 'framer-motion';
import { Film, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { MediaCard, type MediaItem } from '../../components/media/MediaCard';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

// MOCK_WATCHLIST removed

const Watchlist = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Define the backend response shape locally
  interface WatchlistEntry {
    mediaId?: string;
    tmdbId?: number;
    title: string;
    posterPath?: string;
    mediaType: 'movie' | 'tv';
  }

  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/watchlist');
      // Map watchlist items to MediaCard format
      const mapped: MediaItem[] = res.data.map((item: WatchlistEntry) => ({
        _id: item.mediaId || item.tmdbId?.toString() || '',
        tmdbId: item.tmdbId,
        title: item.title,
        filename: item.title, // Fallback
        posterPath: item.posterPath,
        mediaType: item.mediaType,
        isTmdb: !item.mediaId // If no mediaId, it's global
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Failed to load watchlist', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();

    // Listen for background updates (e.g. from MediaCard toggle)
    // Note: 'storage' event only fires for other tabs, so we might need a custom event or context for same-tab updates
    // For now, re-fetching on focus or interval might be needed if state gets stale
  }, []);

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Watchlist
          </h1>
          <p className="text-gray-400 mt-1">Your planned movies and TV shows</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium text-gray-300">
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-medium text-gray-300">
            <ArrowUpDown size={16} />
            <span>Sort</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Grid */}
      {!loading && items.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          {items.map((item) => (
            <MediaCard key={item._id} item={item} />
          ))}
        </motion.div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Film size={40} className="opacity-50" />
          </div>
          <p className="text-xl font-medium text-gray-400">Your watchlist is empty</p>
          <p className="text-sm mt-2">Add movies and shows to keep track of what to watch next.</p>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
