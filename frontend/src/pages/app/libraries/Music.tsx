import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, Disc3, Mic2, Music2, Loader2, ArrowLeft, Clock, Library, Headphones, X } from 'lucide-react';
import api from '../../../lib/api';
import { usePlayer, type Track } from '../../../components/music/MiniPlayer';
import { cn } from '../../../lib/utils';
import { useSpotifyAuth } from '../../../hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '../../../hooks/useSpotifyPlayer';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: { url: string }[] };
  duration_ms: number;
  preview_url: string | null;
  track_number?: number;
  external_urls?: { spotify?: string };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string }[];
  release_date: string;
  total_tracks?: number;
  external_urls?: { spotify?: string };
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

function toPlayerTrack(t: SpotifyTrack, albumArt?: string): Track {
  return {
    id: t.id,
    title: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    album: t.album?.name,
    albumArt: t.album?.images[0]?.url || albumArt,
    previewUrl: t.preview_url || undefined,
    spotifyUrl: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
    spotifyUri: `spotify:track:${t.id}`,
    durationMs: t.duration_ms,
  };
}

// ─── Local Music Tab ──────────────────────────────────────────────────────────
interface LocalTrack {
  _id: string;
  title: string;
  artist?: string;
  album?: string;
  spotifyAlbumArt?: string;
  durationMs?: number;
  filename: string;
}

function LocalMusicTab() {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const token = localStorage.getItem('token') || '';
  const tunnelUrl = localStorage.getItem('tunnelUrl') || '';

  useEffect(() => {
    api.get('/media?type=music')
      .then(res => setTracks(res.data || []))
      .catch(() => setError('Failed to load local music library'))
      .finally(() => setLoading(false));
  }, []);

  const getStreamUrl = (id: string) =>
    `${tunnelUrl}/api/stream/${id}?token=${token}`;

  const toLocalTrack = (t: LocalTrack): Track => ({
    id: t._id,
    title: t.title,
    artist: t.artist || 'Unknown Artist',
    album: t.album,
    albumArt: t.spotifyAlbumArt,
    localPath: getStreamUrl(t._id),
    durationMs: t.durationMs,
  });

  const allTracks = tracks.map(toLocalTrack);

  const filtered = localQuery.trim()
    ? tracks.filter(t => {
        const q = localQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.artist || '').toLowerCase().includes(q) ||
          (t.album || '').toLowerCase().includes(q)
        );
      })
    : tracks;

  const filteredPlayerTracks = filtered.map(toLocalTrack);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={32} className="text-green-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="py-16 text-center">
      <p className="text-red-400 text-sm">⚠️ {error}</p>
    </div>
  );

  if (tracks.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white/5 rounded-2xl border border-white/10">
      <Music2 size={48} className="mb-4 opacity-30" />
      <p className="font-medium text-white/60">No local music found</p>
      <p className="text-sm mt-1">Add a music library folder in Settings to scan your files</p>
    </div>
  );

  return (
    <div>
      {/* Search + Play All row */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            placeholder="Filter by title, artist, album..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-400/40 transition-all"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <p className="text-gray-500 text-xs shrink-0">
          {filtered.length}{localQuery ? ` of ${tracks.length}` : ''} track{filtered.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => filteredPlayerTracks.length > 0 && playTrack(filteredPlayerTracks[0], filteredPlayerTracks)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-400 text-black text-sm font-semibold hover:bg-green-300 transition-colors shadow-lg shadow-green-500/20 shrink-0"
        >
          <Play size={14} fill="black" /> Play All
        </button>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-4 px-4 pb-2 border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider mb-1">
        <span className="w-8 text-center shrink-0">#</span>
        <span className="w-10 shrink-0" />{/* album art spacer */}
        <span className="flex-1">Title</span>
        <Clock size={14} className="shrink-0" />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p>No tracks match &ldquo;{localQuery}&rdquo;</p>
        </div>
      ) : (
      <div className="space-y-0.5 mt-1">
        {filtered.map((track, i) => {
          const pt = toLocalTrack(track);
          const isActive = currentTrack?.id === track._id;
          return (
            <motion.div
              key={track._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => isActive ? togglePlay() : playTrack(pt, filteredPlayerTracks)}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-xl cursor-pointer group transition-all ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="w-8 text-center shrink-0">
                {isActive ? (
                  <div className="text-green-400">
                    {isPlaying
                      ? <Disc3 size={16} className="animate-spin mx-auto" />
                      : <Play size={16} fill="currentColor" className="mx-auto" />}
                  </div>
                ) : (
                  <>
                    <span className="text-gray-500 text-sm group-hover:hidden">{i + 1}</span>
                    <Play size={14} className="text-white hidden group-hover:block mx-auto" fill="white" />
                  </>
                )}
              </div>

              {track.spotifyAlbumArt ? (
                <img src={track.spotifyAlbumArt} alt={track.album || ''} className="w-10 h-10 rounded-md object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Music2 size={16} className="text-gray-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>{track.title}</p>
                <p className="text-xs text-gray-400 truncate">{track.artist || 'Unknown Artist'}{track.album ? ` · ${track.album}` : ''}</p>
              </div>

              <p className="text-sm text-gray-500 shrink-0">
                {track.durationMs ? msToTime(track.durationMs) : '--:--'}
              </p>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ─── Album Detail View ────────────────────────────────────────────────────────
function AlbumDetail({ album, onBack }: { album: SpotifyAlbum; onBack: () => void }) {
  const { playTrack } = usePlayer();
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/spotify/album/${album.id}`)
      .then(res => {
        const items = res.data.tracks?.items || [];
        // Inject album data so toPlayerTrack has albumArt
        const enriched = items.map((t: SpotifyTrack) => ({
          ...t,
          album: { id: album.id, name: album.name, images: album.images },
        }));
        setTracks(enriched);
      })
      .catch(() => setError('Failed to load album tracks'))
      .finally(() => setLoading(false));
  }, [album.id]);

  const albumTracks = tracks.map(t => toPlayerTrack(t, album.images[0]?.url));

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Album Hero */}
      <div className="flex gap-6 mb-8 items-end">
        <div className="w-44 h-44 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 shrink-0">
          <img src={album.images[0]?.url} alt={album.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Album</p>
          <h2 className="text-3xl font-bold text-white truncate mb-1">{album.name}</h2>
          <p className="text-gray-300 text-sm mb-3">
            {album.artists.map(a => a.name).join(', ')} · {album.release_date?.slice(0, 4)}
            {album.total_tracks ? ` · ${album.total_tracks} tracks` : ''}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => albumTracks.length > 0 && playTrack(albumTracks[0], albumTracks)}
              disabled={albumTracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-400 text-black font-semibold text-sm hover:bg-green-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
            >
              <Play size={16} fill="black" />
              Play All
            </button>
            {album.external_urls?.spotify && (
              <a
                href={album.external_urls.spotify}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Open in Spotify ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Track List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="text-green-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      ) : (
        <div>
          {/* Header row */}
          <div className="flex items-center gap-4 px-4 pb-2 border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider mb-1">
            <span className="w-8 text-center">#</span>
            <span className="flex-1">Title</span>
            <Clock size={14} className="shrink-0" />
          </div>
          <div className="space-y-0.5 mt-1">
            {tracks.map((track, i) => (
              <AlbumTrackRow
                key={track.id}
                track={track}
                index={i}
                queue={albumTracks}
                albumArt={album.images[0]?.url}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function AlbumTrackRow({ track, index, queue, albumArt }: {
  track: SpotifyTrack;
  index: number;
  queue: Track[];
  albumArt?: string;
}) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const playerTrack = toPlayerTrack(track, albumArt);
  const isActive = currentTrack?.id === track.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => isActive ? togglePlay() : playTrack(playerTrack, queue)}
      className={`flex items-center gap-4 px-4 py-2.5 rounded-xl cursor-pointer group transition-all ${
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="w-8 text-center shrink-0">
        {isActive ? (
          <div className="text-green-400">
            {isPlaying ? <Disc3 size={16} className="animate-spin mx-auto" /> : <Play size={16} fill="currentColor" className="mx-auto" />}
          </div>
        ) : (
          <>
            <span className="text-gray-500 text-sm group-hover:hidden">{track.track_number ?? index + 1}</span>
            <Play size={14} className="text-white hidden group-hover:block mx-auto" fill="white" />
          </>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>{track.name}</p>
        <p className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>

      <p className="text-sm text-gray-500 shrink-0">{msToTime(track.duration_ms)}</p>
    </motion.div>
  );
}

// ─── Track Row (search results) ───────────────────────────────────────────────
function TrackRow({ track, index, queue }: { track: SpotifyTrack; index: number; queue: SpotifyTrack[] }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const isActive = currentTrack?.id === track.id;
  const playerTrack = toPlayerTrack(track);

  const handleClick = () => isActive ? togglePlay() : playTrack(playerTrack, queue.map(t => toPlayerTrack(t)));

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

// ─── Album Card ───────────────────────────────────────────────────────────────
function AlbumCard({ album, onClick }: { album: SpotifyAlbum; onClick: (album: SpotifyAlbum) => void }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} className="group cursor-pointer" onClick={() => onClick(album)}>
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

// ─── Artist Card ─────────────────────────────────────────────────────────────
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

// ─── Main Music Page ──────────────────────────────────────────────────────────
export default function Music() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ tracks: SpotifyTrack[]; artists: SpotifyArtist[]; albums: SpotifyAlbum[] } | null>(null);
  const [newReleases, setNewReleases] = useState<SpotifyAlbum[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums' | 'artists'>('tracks');
  const [releasesError, setReleasesError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [activeSource, setActiveSource] = useState<'local' | 'spotify'>('local');
  const spotifyAuth = useSpotifyAuth();
  const spotifyPlayer = useSpotifyPlayer(spotifyAuth.accessToken);

  useEffect(() => {
    if (spotifyPlayer.error) {
       console.error('Spotify Player Error:', spotifyPlayer.error);
    }
  }, [spotifyPlayer.error]);
    api.get('/spotify/new-releases')
      .then(res => {
        const items = res.data.albums?.items || res.data.items || [];
        setNewReleases(items);
      })
      .catch(err => {
        setReleasesError(err.response?.data?.error || err.message || 'Failed to load releases');
      })
      .finally(() => setLoadingReleases(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); setSearchError(''); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError('');
      try {
        const res = await api.get(`/spotify/search?q=${encodeURIComponent(searchQuery)}&type=track,artist,album&limit=20`);
        setSearchResults({
          tracks: res.data.tracks?.items || [],
          artists: res.data.artists?.items || [],
          albums: res.data.albums?.items || [],
        });
      } catch (e) {
        const err = e as { response?: { data?: { error?: string } }; message?: string };
        setSearchError(err.response?.data?.error || err.message || 'Search failed');
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-32 p-6 lg:p-8">
      {selectedAlbum ? (
        <AlbumDetail album={selectedAlbum} onBack={() => setSelectedAlbum(null)} />
      ) : (
        <div>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Music2 size={20} className="text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Music</h1>
                  <p className="text-gray-400 text-sm">{activeSource === 'local' ? 'Your local library' : 'Powered by Spotify metadata'}</p>
                </div>
              </div>
            </motion.div>

            {/* Source Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setActiveSource('local')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeSource === 'local'
                      ? 'bg-green-400 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Library size={15} />
                  Local Library
                </button>
                <button
                  onClick={() => { setActiveSource('spotify'); setSelectedAlbum(null); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeSource === 'spotify'
                      ? 'bg-green-400 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Headphones size={15} />
                  Spotify
                </button>
              </div>

              {activeSource === 'spotify' && (
                <div className="flex items-center gap-3">
                  {spotifyAuth.connected ? (
                    <div className="flex items-center gap-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-full border border-white/10 group overflow-hidden transition-all">
                      {spotifyAuth.image ? (
                        <img src={spotifyAuth.image} alt={spotifyAuth.displayName} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Mic2 size={14} className="text-green-400" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[11px] text-gray-500 font-medium leading-tight">Connected as</span>
                        <span className="text-sm font-semibold text-white leading-tight">{spotifyAuth.displayName || 'Spotify User'}</span>
                      </div>
                      <button 
                        onClick={spotifyAuth.disconnect}
                        className="ml-2 text-xs text-gray-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={spotifyAuth.connect}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-400/50 text-sm font-semibold text-white transition-all group"
                    >
                      <Disc3 size={16} className="text-green-400 group-hover:animate-spin" />
                      Connect Spotify
                    </button>
                  )}
                </div>
              )}
            </div>

            {activeSource === 'local' ? (
              <LocalMusicTab />
            ) : (
              <>
            {!spotifyAuth.connected && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden group mb-8 p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20"
              >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-400 flex items-center justify-center shadow-lg shadow-green-500/20 shrink-0">
                      <Headphones size={24} className="text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Full Playback with Spotify</h3>
                      <p className="text-gray-400 text-sm max-w-lg mt-0.5">
                        Connect your Spotify Premium account to play full tracks directly. 
                        Browsing and searching works without a connection.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={spotifyAuth.connect}
                    className="px-6 py-2.5 rounded-xl bg-green-400 hover:bg-green-300 text-black font-bold transition-all shadow-lg shadow-green-500/20 whitespace-nowrap"
                  >
                    Connect Now
                  </button>
                </div>
                {/* Decorative record */}
                <Disc3 size={120} className="absolute -right-10 -bottom-10 text-green-400/5 rotate-12" />
              </motion.div>
            )}

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

            {/* Search Error */}
            {searchError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-red-400 text-sm">⚠️ {searchError}</p>
              </div>
            )}

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
                    {searchResults.albums.map(album => (
                      <AlbumCard key={album.id} album={album} onClick={setSelectedAlbum} />
                    ))}
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
                ) : releasesError ? (
                  <div className="py-10 text-center">
                    <p className="text-red-400 text-sm font-medium">⚠️ Spotify Error</p>
                    <p className="text-gray-500 text-xs mt-1">{releasesError}</p>
                  </div>
                ) : newReleases.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No releases found</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {newReleases.map(album => (
                      <AlbumCard key={album.id} album={album} onClick={setSelectedAlbum} />
                    ))}
                  </div>
                )}
              </div>
            )}
            </>
            )}
        </div>
      )}
    </div>
  );
}
