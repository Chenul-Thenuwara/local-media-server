import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastCarouselProps {
  cast: CastMember[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  if (!cast || cast.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-200">Cast</h3>
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {cast.slice(0, 20).map((actor, index) => (
          <Link
            to={`/person/${actor.id}`}
            key={actor.id}
            className="flex-none w-[140px] flex flex-col items-center gap-2 snap-start group cursor-pointer"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-full h-full flex flex-col items-center gap-2"
            >
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-transparent group-hover:border-apple-blue transition-colors shadow-lg bg-gray-800">
                {actor.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                    alt={actor.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <User size={40} />
                  </div>
                )}
              </div>
              <div className="text-center px-1">
                <p className="text-sm font-medium text-white truncate w-full group-hover:text-apple-blue transition-colors">{actor.name}</p>
                <p className="text-xs text-gray-400 truncate w-full">{actor.character}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
