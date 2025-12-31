import { useEffect, useState } from 'react';

interface Movie {
  id: number;
  poster_path: string;
}

export default function TrendingBackground() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/tmdb/trending')
      .then(res => res.json())
      .then(data => setMovies(data.results || []))
      .catch(err => console.error('Failed to fetch movies', err));
  }, []);

  if (movies.length === 0) return <div className="fixed inset-0 bg-black" />;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
      <div className="absolute inset-0 opacity-40">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 -rotate-6 scale-110 animate-slide">
          {movies.map((movie) => (
            <div key={movie.id} className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-white/5">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
      </div>
    </div>
  );
}
