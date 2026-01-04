import { motion } from 'framer-motion';
import { Play, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MediaItem {
  _id: string;
  title?: string;
  filename: string;
  posterPath?: string;
}

interface MediaCardProps {
  item: MediaItem;
}

export function MediaCard({ item }: MediaCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onClick={() => navigate(`/media/${item._id}`)}
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
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <Play size={24} fill="currentColor" />
        </div>
      </div>
    </motion.div>
  );
}
