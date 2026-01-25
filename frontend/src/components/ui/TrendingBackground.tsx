// ... imports ...
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';

interface Movie {
  id: number;
  poster_path: string;
}

export default function TrendingBackground() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    api.get('/tmdb/trending')
      .then(res => {
        const data = res.data;
        const results = data.results || [];
        // Generate pool by repeatedly adding shuffled sets of the source items
        // This guarantees local uniqueness (no duplicates within each chunk)
        const finalPool: Movie[] = [];

        for (let i = 0; i < 6; i++) {
          // Shuffle a fresh copy of the results
          const chunk = [...results];
          for (let j = chunk.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [chunk[j], chunk[k]] = [chunk[k], chunk[j]];
          }
          finalPool.push(...chunk);
        }

        // Just a final safety check for chunk boundaries
        // If the end of one chunk matches the start of the next, swap the first item
        for (let i = 1; i < finalPool.length; i++) {
          if (finalPool[i].id === finalPool[i - 1].id) {
            // simple swap with neighbor
            const next = (i + 1) % finalPool.length;
            [finalPool[i], finalPool[next]] = [finalPool[next], finalPool[i]];
          }
        }

        setMovies(finalPool);
      })
      .catch(err => console.error('Failed to fetch movies', err));
  }, []);

  if (movies.length === 0) return <div className="fixed inset-0 bg-black" />;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-50">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 p-4 -rotate-6 scale-125 origin-center">
          {movies.map((movie, index) => (
            <motion.div
              key={`${movie.id}-${index}`}
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
