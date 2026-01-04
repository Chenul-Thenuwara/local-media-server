import { useEffect, useState } from 'react';
import { Play, Info, Plus, FolderPlus, Film, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FolderPicker } from '../../components/ui/FolderPicker';
import { MediaRow } from '../../components/media/MediaRow';
import api from '../../lib/api';

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
}

interface Library {
  _id: string;
  name: string;
  path: string;
  type: 'movies' | 'tv';
}

export default function Home() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);

  // Dashboard Data
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [localMedia, setLocalMedia] = useState<any[]>([]);

  // Setup Form State
  const [setupName, setSetupName] = useState('');
  const [setupPath, setSetupPath] = useState('');
  const [setupType, setSetupType] = useState<'movies' | 'tv'>('movies');
  const [setupLoading, setSetupLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    checkLibraries();
  }, []);

  const checkLibraries = async () => {
    try {
      const res = await api.get('/libraries');
      setLibraries(res.data);
      if (res.data.length > 0) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to fetch libraries', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    // 1. Fetch Trending from TMDB (External)
    fetch('http://localhost:3000/api/tmdb/trending')
      .then(res => res.json())
      .then(data => {
        const movies = data.results || [];
        setTrending(movies);
        if (movies.length > 0) {
          setFeatured(movies[Math.floor(Math.random() * movies.length)]);
        }
      })
      .catch(err => console.error(err));

    // 2. Fetch Local Media (Internal)
    try {
      const res = await api.get('/media/recent');
      setLocalMedia(res.data);
    } catch (err) {
      console.error('Failed to fetch local media', err);
    }
  };

  const handleAddLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupLoading(true);
    try {
      await api.post('/libraries', {
        name: setupName,
        path: setupPath,
        type: setupType
      });
      // Refresh to switch to dashboard view
      await checkLibraries();
    } catch (err) {
      console.error('Failed to create library', err);
      alert('Failed to add folder');
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-gray-500">Loading...</div>;

  // EMPTY STATE: Show Setup Wizard
  if (libraries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-black relative">
        {showPicker && (
          <FolderPicker
            onCancel={() => setShowPicker(false)}
            onSelect={(path) => {
              setSetupPath(path);
              setShowPicker(false);
            }}
          />
        )}

        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto w-20 h-20 bg-apple-blue/10 rounded-[28px] flex items-center justify-center text-apple-blue mb-6">
            <FolderPlus size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Add Your Media</h1>
            <p className="text-gray-400">
              To get started, point LMS to a folder containing your movies or TV shows.
            </p>
          </div>

          <form onSubmit={handleAddLibrary} className="bg-[#1c1c1e] p-6 rounded-[24px] border border-white/5 space-y-4 text-left shadow-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Library Name</label>
              <Input
                placeholder="e.g. My Movies"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Folder Path</label>
              <div className="flex gap-2">
                <Input
                  placeholder="No folder selected"
                  value={setupPath}
                  readOnly
                  className="cursor-default text-gray-400 bg-white/5 border-dashed"
                  required
                />
                <Button
                  type="button"
                  variant="glass"
                  className="shrink-0 px-4"
                  onClick={() => setShowPicker(true)}
                >
                  Browse
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3 ml-1">Content Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSetupType('movies')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${setupType === 'movies'
                    ? 'bg-apple-blue text-white border-apple-blue'
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                    }`}
                >
                  <Film size={24} />
                  <span className="text-sm font-medium">Movies</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSetupType('tv')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${setupType === 'tv'
                    ? 'bg-apple-blue text-white border-apple-blue'
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                    }`}
                >
                  <Tv size={24} />
                  <span className="text-sm font-medium">TV Shows</span>
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-4" disabled={setupLoading}>
              {setupLoading ? 'Adding Library...' : 'Add Library'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD STATE (Existing Logic)
  if (!featured) return <div className="h-full flex items-center justify-center text-gray-500">Preparing Custom Dashboard...</div>;

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
        {localMedia.length > 0 && (
          <MediaRow
            title="My Library"
            items={localMedia}
            onRefresh={async () => {
              if (libraries.length > 0) {
                await api.post(`/libraries/${libraries[0]._id}/refresh`);
                setTimeout(fetchDashboardData, 2000);
              }
            }}
          />
        )}

      </div>
    </div>
  );
}
