import { motion } from 'framer-motion';
import { Film } from 'lucide-react';
import { MediaCard, type MediaItem } from '../../components/media/MediaCard';
import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../lib/api';
import { Select } from '../../components/ui/Select';

const Watchlist = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date_added');

  // Define the backend response shape locally
  interface WatchlistEntry {
    mediaId?: string;
    tmdbId?: number;
    title: string;
    posterPath?: string;
    mediaType: 'movie' | 'tv';
  }

  const fetchWatchlist = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchWatchlist();

    const handleUpdate = () => {
      fetchWatchlist();
    };

    window.addEventListener('watchlist-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate); // Cross-tab sync

    return () => {
      window.removeEventListener('watchlist-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchWatchlist]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter
    if (filter !== 'all') {
      result = result.filter(item => item.mediaType === filter);
    }

    // Sort
    if (sort === 'title') {
      result.sort((a, b) => (a.title || a.filename || '').localeCompare(b.title || b.filename || ''));
    } else if (sort === 'release_date') {
      // Note: watchlist items currently don't store release date in the mapped object above
      // If we need true release date sorting, we should add it to the backend response or mapped object.
      // For now, fallback to title or keep original order.
      // Let's assume title for stability if date missing.
      result.sort((a, b) => (a.title || a.filename || '').localeCompare(b.title || b.filename || ''));
    } else {
      // date_added (assuming backend returns in insertion order or latest first?)
      // If backend returns latest first, default is fine.
      // If we want to reverse default (oldest first?), we can.
      // Generally 'Recent' is preferred. assuming items is already recents.
    }

    return result;
  }, [items, filter, sort]);

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

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-32">
            <Select
              label="Type"
              value={filter}
              onChange={setFilter}
              options={[
                { label: 'All', value: 'all' },
                { label: 'Movies', value: 'movie' },
                { label: 'TV Shows', value: 'tv' },
              ]}
            />
          </div>
          <div className="w-40">
            <Select
              label="Sort By"
              value={sort}
              onChange={setSort}
              options={[
                { label: 'Date Added', value: 'date_added' },
                { label: 'Title (A-Z)', value: 'title' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Grid */}
      {!loading && filteredItems.length > 0 ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          {filteredItems.map((item) => (
            <MediaCard key={item._id} item={item} />
          ))}
        </motion.div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Film size={40} className="opacity-50" />
          </div>
          <p className="text-xl font-medium text-gray-400">No items found</p>
          <p className="text-sm mt-2">Try adjusting your filters or add some content.</p>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
