import { useEffect, useState, useCallback } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import { MediaCard } from '../../components/media/MediaCard';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import api from '../../lib/api';

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
}

const Discover = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadMovies = useCallback(async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/tmdb/trending?page=${pageNum}`);
      const data = res.data;

      const newMovies = data.results || [];

      if (pageNum === 1) {
        setTrending(newMovies);
      } else {
        // Filter out duplicates just in case
        setTrending(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = newMovies.filter((m: Movie) => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
      }
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Infinite Scroll Hook
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    enabled: !loading && !loadingMore
  });

  useEffect(() => {
    if (isIntersecting && !loading && !loadingMore) {
      loadMovies(page + 1);
    }
  }, [isIntersecting, loading, loadingMore, page, loadMovies]);

  useEffect(() => {
    loadMovies(1);
  }, [loadMovies]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin text-apple-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-20 overflow-y-auto h-full header-scroll-mask">
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

        {/* fluid grid to fill gaps */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 md:gap-6">
          {trending.map((movie) => (
            <MediaCard
              key={movie.id}
              item={{
                _id: movie.id.toString(),
                tmdbId: movie.id,
                title: movie.title,
                filename: movie.title,
                posterPath: movie.poster_path,
                isTmdb: true,
                mediaType: 'movie'
              }}
            />
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        <div ref={loadMoreRef} className="flex justify-center py-8 min-h-[100px]">
          {loadingMore && (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
