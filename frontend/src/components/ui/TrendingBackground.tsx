// ... imports ...
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Movie {
  id: number;
  poster_path: string;
}

export default function TrendingBackground() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/tmdb/trending')
      .then(res => res.json())
      .then(data => {
        const results = data.results || [];
        // Duplicate the list 4 times to ensure it covers the screen
        setMovies([...results, ...results, ...results, ...results]);
      })
      .catch(err => console.error('Failed to fetch movies', err));
  }, []);

  if (movies.length === 0) return <div className="fixed inset-0 bg-black" />;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-50">
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 p-4 -rotate-6 scale-110">
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{
                scale: 1.5,
                zIndex: 50,
                opacity: 1,
                transition: { type: "spring", stiffness: 300, damping: 10 }
              }}
              className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-white/5 cursor-default relative"
              style={{ transformOrigin: 'center center' }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
            </motion.div>
          ))}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black pointer-events-none" />
      </div>
    </div>
  );
}
