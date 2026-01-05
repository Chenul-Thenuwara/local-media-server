import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { MediaCard } from '../../../components/media/MediaCard';
import { MediaRow } from '../../../components/media/MediaRow';
import { Tv } from 'lucide-react';

export default function TVShows() {
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      // Cache bust to ensure fresh request + filter by type=tv
      const res = await api.get(`/media?type=tv&_t=${Date.now()}`);
      console.log('TV Shows fetched:', res.data);
      if (Array.isArray(res.data)) {
        setShows(res.data);
      } else {
        console.error('API returned non-array:', res.data);
        setError('Invalid API response');
      }
    } catch (err: any) {
      console.error('Failed to fetch TV shows', err);
      setError(err.message || 'Failed to load TV shows');
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
          <p className="text-gray-400 text-sm mt-1">{shows.length} title{shows.length !== 1 && 's'}</p>
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
                <MediaCard key={show._id} item={show} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
