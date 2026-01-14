import { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { MediaCard } from '../../components/media/MediaCard';

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

  const loadMovies = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`http://localhost:3000/api/tmdb/trending?page=${pageNum}`);
      const data = await res.json();
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
  };

  useEffect(() => {
    loadMovies(1);
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

        {/* Load More Button */}
        <div className="flex justify-center pt-8 pb-4">
          <button
            onClick={() => loadMovies(page + 1)}
            disabled={loadingMore}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Movies'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Discover;
