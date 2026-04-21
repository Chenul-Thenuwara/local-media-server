import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { MediaCard, type MediaItem } from '../../../components/media/MediaCard';
import { MediaRow } from '../../../components/media/MediaRow';
import { Tv } from 'lucide-react';

// Group individual episode files into one entry per series
function groupByShow(episodes: MediaItem[]): MediaItem[] {
  const map = new Map<string, MediaItem>();

  for (const ep of episodes) {
    // Use tmdbId if available (most reliable), otherwise fall back to title
    const key = ep.tmdbId ? `tmdb-${ep.tmdbId}` : `title-${ep.title?.toLowerCase().trim() || ep._id}`;

    if (!map.has(key)) {
      map.set(key, {
        ...ep,
        // Store episode count for display
        _episodeCount: 1,
      } as any);
    } else {
      const existing = map.get(key)!;
      (existing as any)._episodeCount = ((existing as any)._episodeCount || 1) + 1;
      // Keep the one with a poster if current doesn't have one
      if (!existing.posterPath && ep.posterPath) {
        map.set(key, { ...(existing as any), posterPath: ep.posterPath, backdropPath: ep.backdropPath });
      }
    }
  }

  return Array.from(map.values());
}

export default function TVShows() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      const res = await api.get(`/media?type=tv&_t=${Date.now()}`);
      if (Array.isArray(res.data)) {
        // Group episodes → one card per series
        const grouped = groupByShow(res.data);
        setShows(grouped);
      } else {
        setError('Invalid API response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load TV shows');
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
        <p>Error loading TV shows: {error}</p>
        <button onClick={() => window.location.reload()} className="text-white underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 overflow-y-auto h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-apple-blue shadow-lg">
          <Tv size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TV Shows</h1>
          <p className="text-gray-400 text-sm mt-1">{shows.length} series</p>
        </div>
      </div>

      {shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
          <Tv size={48} className="mb-4 opacity-50" />
          <p className="text-lg">No TV shows found in your library.</p>
          <p className="text-xs text-gray-600 mt-2">Add a folder containing TV shows to get started.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Recent Row */}
          <MediaRow title="Recently Added" items={shows.slice(0, 10)} />

          {/* All Grid */}
          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4 pl-1">All TV Shows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
              {shows.map((show) => (
                <div
                  key={show._id}
                  className="relative cursor-pointer"
                  onClick={() => {
                    // Go to TMDB TV detail page so SeasonView & episode list loads
                    if (show.tmdbId) {
                      navigate(`/media/tmdb/tv/${show.tmdbId}`);
                    } else {
                      navigate(`/media/${show._id}`);
                    }
                  }}
                >
                  <MediaCard item={show} />
                  {/* Episode count badge */}
                  {(show as any)._episodeCount > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {(show as any)._episodeCount} eps
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
