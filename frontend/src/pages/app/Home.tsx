import { useEffect, useState } from 'react';
import { Play, Info, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
}

export default function Home() {
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);

  useEffect(() => {
    // Re-using the public endpoint for now, but via our axios instance
    // In a real app we might have a protected /api/media/trending endpoint
    fetch('http://localhost:3000/api/tmdb/trending')
      .then(res => res.json())
      .then(data => {
        const movies = data.results || [];
        setTrending(movies);
        // Pick a random movie for the hero
        setFeatured(movies[Math.floor(Math.random() * movies.length)]);
      })
      .catch(err => console.error(err));
  }, []);

  if (!featured) return <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-full pb-20">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden shrink-0">
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

        <div className="absolute bottom-0 left-0 p-12 pb-32 max-w-2xl z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold tracking-tight mb-4 drop-shadow-2xl"
          >
            {featured.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-200 line-clamp-3 mb-8 drop-shadow-md"
          >
            {featured.overview}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 border-none shadow-xl">
              <Play fill="currentColor" size={20} className="mr-2" />
              Play
            </Button>
            <Button variant="glass" size="lg" className="text-white hover:bg-white/20">
              <Info size={20} className="mr-2" />
              More Info
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Media Rows */}
      <div className="px-12 -mt-20 relative z-20 space-y-12">
        <MediaSection title="Trending Now" movies={trending} />
        {/* Placeholder for other sections */}
        <MediaSection title="Recently Added" movies={[...trending].reverse()} />
      </div>
    </div>
  );
}

function MediaSection({ title, movies }: { title: string, movies: Movie[] }) {
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
