import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, Disc3, Mic2, Music2, Loader2 } from 'lucide-react';
import api from '../../../lib/api';
import { usePlayer, type Track } from '../../../components/music/MiniPlayer';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: { url: string }[] };
  duration_ms: number;
  preview_url: string | null;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  release_date: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
  popularity: number;
}

function msToTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function TrackRow({ track, index, queue }: { track: SpotifyTrack; index: number; queue: SpotifyTrack[] }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isActive = currentTrack?.id === track.id;

  const toPlayerTrack = (t: SpotifyTrack): Track => ({
    id: t.id,
    title: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    album: t.album.name,
    albumArt: t.album.images[0]?.url,
    previewUrl: t.preview_url || undefined,
  });

  const handleClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      playTrack(toPlayerTrack(track), queue.map(toPlayerTrack));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleClick}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-all ${
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="w-8 text-center shrink-0">
        {isActive ? (
          <div className="text-green-400">
            {isPlaying ? <Disc3 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          </div>
        ) : (
          <>
            <span className="text-gray-500 text-sm group-hover:hidden">{index + 1}</span>
            <Play size={14} className="text-white hidden group-hover:block mx-auto" fill="white" />
          </>
        )}
      </div>

      <img src={track.album.images[0]?.url} alt={track.album.name} className="w-10 h-10 rounded-md object-cover" />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>{track.name}</p>
        <p className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>

      <p className="text-sm text-gray-500 hidden md:block truncate max-w-32">{track.album.name}</p>
      <p className="text-sm text-gray-500 shrink-0">{msToTime(track.duration_ms)}</p>
    </motion.div>
  );
}

function AlbumCard({ album }: { album: SpotifyAlbum }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 shadow-lg">
        <img src={album.images[0]?.url} alt={album.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center shadow-xl">
            <Play size={20} fill="black" className="text-black" />
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-white truncate">{album.name}</p>
      <p className="text-xs text-gray-400 truncate">{album.artists.map(a => a.name).join(', ')} · {album.release_date?.slice(0, 4)}</p>
    </motion.div>
  );
}

function ArtistCard({ artist }: { artist: SpotifyArtist }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} className="group cursor-pointer text-center">
      <div className="relative aspect-square rounded-full overflow-hidden bg-white/5 shadow-lg mx-auto w-28">
        {artist.images[0] ? (
          <img src={artist.images[0].url} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Mic2 size={32} className="text-gray-500" />
          </div>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-white truncate">{artist.name}</p>
      <p className="text-xs text-gray-400 truncate">{artist.genres[0] || 'Artist'}</p>
    </motion.div>
  );
}

export default function Music() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ tracks: SpotifyTrack[]; artists: SpotifyArtist[]; albums: SpotifyAlbum[] } | null>(null);
  const [newReleases, setNewReleases] = useState<SpotifyAlbum[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums' | 'artists'>('tracks');

  useEffect(() => {
    api.get('/spotify/new-releases')
      .then(res => setNewReleases(res.data.albums?.items || []))
      .catch(console.error)
      .finally(() => setLoadingReleases(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/spotify/search?q=${encodeURIComponent(searchQuery)}&type=track,artist,album&limit=20`);
        setSearchResults({
          tracks: res.data.tracks?.items || [],
          artists: res.data.artists?.items || [],
          albums: res.data.albums?.items || [],
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-32 p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <Music2 size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Music</h1>
            <p className="text-gray-400 text-sm">Powered by Spotify metadata</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-400/50 focus:bg-white/8 transition-all"
          />
          {isSearching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
        </div>
      </motion.div>

      {/* Results */}
      {searchResults ? (
        <div>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(['tracks', 'albums', 'artists'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  activeTab === tab ? 'bg-green-400 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/15'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'tracks' && (
            <div className="space-y-1">
              {searchResults.tracks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tracks found</p>
              ) : (
                searchResults.tracks.map((track, i) => (
                  <TrackRow key={track.id} track={track} index={i} queue={searchResults.tracks} />
                ))
              )}
            </div>
          )}

          {activeTab === 'albums' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.albums.map(album => <AlbumCard key={album.id} album={album} />)}
            </div>
          )}

          {activeTab === 'artists' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-6">
              {searchResults.artists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}
            </div>
          )}
        </div>
      ) : (
        /* New Releases */
        <div>
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Disc3 size={20} className="text-green-400" />
            New Releases
          </h2>

          {loadingReleases ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-green-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {newReleases.map(album => <AlbumCard key={album.id} album={album} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
