import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { MediaCard, type MediaItem } from '../../../components/media/MediaCard';
import { MediaRow } from '../../../components/media/MediaRow';
import { Film } from 'lucide-react';
import { WhatToWatchNext } from '../../../components/media/WhatToWatchNext';

export default function Movies() {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      // Cache bust to ensure fresh request and filter by movie type
      const res = await api.get(`/media?type=movie&_t=${Date.now()}`);
      console.log('Movies fetched:', res.data);
      if (Array.isArray(res.data)) {
        setMovies(res.data);
      } else {
        console.error('API returned non-array:', res.data);
        setError('Invalid API response');
      }
    } catch (err) {
      console.error('Failed to fetch movies', err);
      setError(err instanceof Error ? err.message : 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-500 gap-2">
        <p>Error loading movies: {error}</p>
        <button onClick={() => window.location.reload()} className="text-white underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-apple-blue shadow-lg">
          <Film size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Movies</h1>
          <p className="text-gray-400 text-sm mt-1">{movies.length} title{movies.length !== 1 && 's'}</p>
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
          <Film size={48} className="mb-4 opacity-50" />
          <p className="text-lg">No movies found in your library.</p>
          <p className="text-xs text-gray-600 mt-2">API Response was empty array.</p>
          <p className="text-sm mt-2">Add a folder containing movies to get started.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Recent Row */}
          <MediaRow title="Recently Added" items={movies.slice(0, 10)} />

          {/* AI Suggestions */}
          <WhatToWatchNext items={movies} type="movie" />

          {/* All Grid */}
          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4 pl-1">All Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
              {movies.map((movie) => (
                <MediaCard key={movie._id} item={movie} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
