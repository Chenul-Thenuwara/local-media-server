import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
}

interface MediaSectionProps {
  title: string;
  movies: Movie[];
}

export function MediaSection({ title, movies }: MediaSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-200 pl-1">{title}</h2>
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
        {movies.map((movie) => (
          <motion.div
            key={movie.id}
            whileHover={{ scale: 1.05 }}
            className="flex-none w-[200px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-gray-800 cursor-pointer snap-start relative group"
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                <Plus size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
