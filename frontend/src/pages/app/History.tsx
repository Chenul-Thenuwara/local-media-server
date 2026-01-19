import { motion } from 'framer-motion';
import { History as HistoryIcon } from 'lucide-react';
import { MediaCard, type MediaItem } from '../../components/media/MediaCard';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const History = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  interface HistoryEntry {
    mediaId?: string;
    tmdbId?: number;
    title: string;
    posterPath?: string;
    mediaType: 'movie' | 'tv';
    watchedAt: string;
    progress?: number;
  }

  const fetchHistory = async () => {
    try {
      const res = await api.get('/history');
      const mapped: MediaItem[] = res.data.map((item: HistoryEntry) => ({
        _id: item.mediaId || item.tmdbId?.toString() || '',
        tmdbId: item.tmdbId,
        title: item.title,
        filename: item.title,
        posterPath: item.posterPath,
        mediaType: item.mediaType,
        isTmdb: !item.mediaId
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  // Deduplicate items for display (Safety net for existing dupes)
  const uniqueItems = items.filter((item, index, self) =>
    index === self.findIndex((t) => (
      t._id === item._id
    ))
  );

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Watch History
          </h1>
          <p className="text-gray-400 mt-1">Movies and shows you've watched</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Grid */}
      {!loading && uniqueItems.length > 0 ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          {uniqueItems.map((item, idx) => (
            <MediaCard key={`${item._id}-${idx}`} item={item} />
          ))}
        </motion.div>
      ) : !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <HistoryIcon size={40} className="opacity-50" />
          </div>
          <p className="text-xl font-medium text-gray-400">No history yet</p>
          <p className="text-sm mt-2">Start watching something to see it here.</p>
        </div>
      )}
    </div>
  );
};

export default History;
