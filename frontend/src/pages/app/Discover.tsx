import { useEffect, useState } from 'react';
import { Compass, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
}

import { useNavigate } from 'react-router-dom';

const Discover = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/tmdb/trending')
      .then(res => res.json())
      .then(data => {
        setTrending(data.results || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-apple-blue shadow-lg">
          <Compass size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Discover</h1>
          <p className="text-gray-400 text-sm mt-1">Explore what's trending worldwide</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-200 pl-1">Trending Now</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
          {trending.map((movie) => (
            <motion.div
              key={movie.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/media/${movie.id}`)}
              className="flex-none w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-gray-800 cursor-pointer relative group"
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                  <Plus size={24} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="h-20" /> {/* Bottom spacer */}
      </div>
    </div>
  );
};

export default Discover;
