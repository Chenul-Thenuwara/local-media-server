
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Film, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MediaItem {
  _id: string;
  title?: string;
  filename: string;
  posterPath?: string;
  type?: string;
}

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  onRefresh?: () => void;
  className?: string;
}

export function MediaRow({ title, items, onRefresh, className }: MediaRowProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-200 pl-1">{title}</h2>
        {onRefresh && (
          <button onClick={onRefresh} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        )}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
        {items.map((item) => (
          <motion.div
            key={item._id}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate(`/media/${item._id}`)}
            className="flex-none w-[150px] md:w-[200px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-gray-800 cursor-pointer snap-start relative group"
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

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                <Play size={24} fill="currentColor" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
