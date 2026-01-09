import { motion } from 'framer-motion';
import { Film, Check, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export interface MediaItem {
  _id: string;
  title?: string;
  filename: string;
  posterPath?: string;
  isTmdb?: boolean;
  mediaType?: 'movie' | 'tv';
  tmdbId?: number;
}

interface WatchlistEntry {
  mediaId?: string;
  tmdbId?: number;
  mediaType: string;
  title: string;
  posterPath?: string;
}

interface MediaCardProps {
  item: MediaItem;
}

export function MediaCard({ item }: MediaCardProps) {
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial check from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const exists = user.watchlist?.some((w: WatchlistEntry) =>
          (item.tmdbId && w.tmdbId === item.tmdbId) ||
          (item._id && w.mediaId === item._id)
        );
        setInWatchlist(!!exists);
      }
    } catch (e) {
      console.error('Error checking watchlist status', e);
    }
  }, [item]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    console.log('Watchlist toggle clicked');

    if (loading) return;
    setLoading(true);

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        // Redirect to login or show toast
        console.warn('User not logged in');
        return;
      }
      const user = JSON.parse(userStr);

      if (inWatchlist) {
        // Remove
        await api.delete(`/watchlist/${item.tmdbId || item._id}`);
        user.watchlist = user.watchlist.filter((w: WatchlistEntry) =>
          (item.tmdbId ? w.tmdbId !== item.tmdbId : w.mediaId !== item._id)
        );
      } else {
        // Add
        const payload = {
          mediaId: item.isTmdb ? undefined : item._id,
          tmdbId: item.tmdbId,
          mediaType: item.mediaType || 'movie',
          title: item.title || item.filename,
          posterPath: item.posterPath
        };
        const res = await api.post('/watchlist', payload);
        user.watchlist = res.data; // Update with full list from server
      }

      localStorage.setItem('user', JSON.stringify(user));
      setInWatchlist(!inWatchlist);

      // Dispatch storage event to sync other tabs/components if needed
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to toggle watchlist', err);
      // alert('Failed to update watchlist'); 
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Failsafe: if the click originated from a button or icon inside a button, ignore it
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      console.log('Ignoring click from button');
      return;
    }

    if (item.isTmdb) {
      navigate(`/media/tmdb/${item.mediaType}/${item.tmdbId}`);
    } else {
      navigate(`/media/${item._id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onClick={handleClick}
      className="flex-none w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-gray-800 cursor-pointer relative group"
    >
      {/* Show Poster if available, else placeholder */}
      {item.posterPath ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
          alt={item.title || item.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
          <Film size={32} className="text-apple-blue mb-2" />
          <span className="text-sm font-medium text-gray-300 line-clamp-2">{item.filename}</span>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 z-10">
        {/* Watchlist Toggle Button (Center) */}
        <button
          onClick={toggleWatchlist}
          className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all transform hover:scale-110 z-20 relative"
          title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        >
          {inWatchlist ? <Check size={32} /> : <PlusCircle size={32} />}
        </button>
      </div>

    </motion.div>
  );
}
