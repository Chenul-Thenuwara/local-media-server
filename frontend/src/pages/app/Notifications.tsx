import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Film, Tv, Music, Disc3, Star, Calendar,
  RefreshCw, ExternalLink, Play, ChevronRight, Headphones, Radio, TrendingUp
} from 'lucide-react';
import api from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MediaItem {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  rating: number;
  mediaType: 'movie' | 'tv';
  _id?: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: { url: string }[]; release_date: string };
  duration_ms: number;
  external_urls: { spotify: string };
  popularity: number;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  images: { url: string }[];
  release_date: string;
  total_tracks: number;
  external_urls: { spotify: string };
  album_type: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TMDB_IMG = (path: string, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '';

const fmtDur = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const fmtDate = (d: string) => {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StarBadge = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
    <Star size={11} fill="currentColor" />{rating.toFixed(1)}
  </span>
);

const SectionHeader = ({ icon: Icon, title, subtitle, color, badge }: {
  icon: React.ElementType; title: string; subtitle: string; color: string; badge?: string;
}) => (
  <div className="flex items-center gap-4 mb-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shrink-0`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="shrink-0 w-36 animate-pulse">
    <div className="w-36 h-52 bg-white/5 rounded-xl mb-2" />
    <div className="h-3 bg-white/5 rounded w-3/4 mb-1" />
    <div className="h-3 bg-white/5 rounded w-1/2" />
  </div>
);

const AlbumSkeleton = () => (
  <div className="shrink-0 w-36 animate-pulse">
    <div className="w-36 h-36 bg-white/5 rounded-xl mb-2" />
    <div className="h-3 bg-white/5 rounded w-3/4 mb-1" />
    <div className="h-3 bg-white/5 rounded w-1/2" />
  </div>
);

const TrackSkeleton = () => (
  <div className="flex items-center gap-3 p-3 animate-pulse">
    <div className="w-5 h-3 bg-white/5 rounded" />
    <div className="w-10 h-10 bg-white/5 rounded-lg" />
    <div className="flex-1 space-y-1">
      <div className="h-3 bg-white/5 rounded w-2/3" />
      <div className="h-3 bg-white/5 rounded w-1/3" />
    </div>
    <div className="h-3 bg-white/5 rounded w-10" />
  </div>
);

const HScroll = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">{children}</div>
);

// ─── Cards ───────────────────────────────────────────────────────────────────

const MediaCard = ({ item, onClick, index }: { item: MediaItem; onClick: () => void; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    onClick={onClick}
    className="shrink-0 w-36 cursor-pointer group"
  >
    <div className="relative w-36 h-52 rounded-xl overflow-hidden mb-2 bg-white/5">
      {item.posterPath
        ? <img src={TMDB_IMG(item.posterPath)} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        : <div className="w-full h-full flex items-center justify-center text-gray-600"><Film size={32} /></div>
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
          <Play size={14} fill="white" className="ml-0.5" />
        </div>
      </div>
      {item.rating > 0 && (
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-0.5">
          <StarBadge rating={item.rating} />
        </div>
      )}
    </div>
    <h4 className="text-xs font-semibold text-white leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">{item.title}</h4>
    <p className="text-[10px] text-gray-500 mt-0.5">{item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'TBA'}</p>
  </motion.div>
);

const ListCard = ({ item, onClick, index }: { item: MediaItem; onClick: () => void; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.06 }}
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-pointer group"
  >
    <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-white/5">
      {item.posterPath
        ? <img src={TMDB_IMG(item.posterPath, 'w154')} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        : <div className="w-full h-full flex items-center justify-center text-gray-600"><Film size={20} /></div>
      }
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{item.title}</h4>
      <div className="flex items-center gap-2 mt-1">
        <Calendar size={11} className="text-gray-500" />
        <span className="text-[11px] text-gray-500">{fmtDate(item.releaseDate)}</span>
      </div>
      {item.rating > 0 && <div className="mt-1"><StarBadge rating={item.rating} /></div>}
      <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{item.overview}</p>
    </div>
    <ChevronRight size={16} className="text-gray-600 group-hover:text-white shrink-0 transition-colors" />
  </motion.div>
);

const AlbumCard = ({ album, index }: { album: SpotifyAlbum; index: number }) => (
  <motion.a
    href={album.external_urls.spotify} target="_blank" rel="noopener noreferrer"
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="shrink-0 w-36 group cursor-pointer"
  >
    <div className="relative w-36 h-36 rounded-xl overflow-hidden mb-2 bg-white/5">
      {album.images?.[0]?.url
        ? <img src={album.images[0].url} alt={album.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        : <div className="w-full h-full flex items-center justify-center text-gray-600"><Disc3 size={32} /></div>
      }
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
          <Play size={16} fill="white" className="ml-0.5" />
        </div>
      </div>
      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-0.5">
        <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">{album.album_type}</span>
      </div>
    </div>
    <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight group-hover:text-green-400 transition-colors">{album.name}</h4>
    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{album.artists.map(a => a.name).join(', ')}</p>
    <p className="text-[10px] text-gray-600">{album.release_date ? new Date(album.release_date).getFullYear() : ''} · {album.total_tracks} tracks</p>
  </motion.a>
);

const TrackRow = ({ track, index }: { track: SpotifyTrack; index: number }) => (
  <motion.a
    href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer"
    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04 }}
    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.07] transition-all group cursor-pointer"
  >
    <span className="w-5 text-right text-xs text-gray-600 font-mono shrink-0">{index + 1}</span>
    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
      {track.album?.images?.[0]?.url
        ? <img src={track.album.images[0].url} alt={track.album.name} className="w-full h-full object-cover" loading="lazy" />
        : <div className="w-full h-full flex items-center justify-center text-gray-600"><Music size={14} /></div>
      }
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate group-hover:text-green-400 transition-colors">{track.name}</p>
      <p className="text-[11px] text-gray-500 truncate">{track.artists.map(a => a.name).join(', ')}</p>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      {track.popularity > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${track.popularity}%` }} />
          </div>
        </div>
      )}
      <span className="text-xs text-gray-600 font-mono">{fmtDur(track.duration_ms)}</span>
      <ExternalLink size={13} className="text-gray-700 group-hover:text-green-400 transition-colors" />
    </div>
  </motion.a>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();

  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

  const [moviesLoading, setMoviesLoading] = useState(true);
  const [tvLoading, setTvLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(true);

  const [moviesError, setMoviesError] = useState(false);
  const [tvError, setTvError] = useState(false);
  const [musicError, setMusicError] = useState(false);

  const [activeTab, setActiveTab] = useState<'movies' | 'music'>('movies');
  const [refreshKey, setRefreshKey] = useState(0);

  const mapTmdb = (item: any, type: 'movie' | 'tv'): MediaItem => ({
    id: item.id || item.tmdbId || item._id,
    title: item.title || item.name || '',
    overview: item.overview || '',
    posterPath: item.posterPath || item.poster_path || '',
    backdropPath: item.backdropPath || item.backdrop_path || '',
    releaseDate: item.releaseDate || item.release_date || item.first_air_date || '',
    rating: item.rating || item.vote_average || 0,
    mediaType: type,
    _id: item._id,
  });

  const fetchData = useCallback(async () => {
    setMoviesLoading(true); setTvLoading(true);
    setAlbumsLoading(true); setTracksLoading(true);
    setMoviesError(false); setTvError(false); setMusicError(false);

    // Trending Movies (existing endpoint)
    api.get('/tmdb/trending?page=1').then(res => {
      const results = res.data.results || [];
      setTrendingMovies(results.slice(0, 12).map((i: any) => mapTmdb(i, 'movie')));
    }).catch(() => setMoviesError(true)).finally(() => setMoviesLoading(false));

    // Trending TV + Top Rated Movies (use discover/search existing endpoint)
    Promise.allSettled([
      api.get('/tmdb/search?type=tv&orderBy=Top+Rated&page=1'),
      api.get('/tmdb/search?type=movie&orderBy=Top+Rated&page=1'),
    ]).then(([tvRes, topratedRes]) => {
      if (tvRes.status === 'fulfilled') {
        setTrendingTV((tvRes.value.data || []).slice(0, 12).map((i: any) => mapTmdb(i, 'tv')));
      } else setTvError(true);
      if (topratedRes.status === 'fulfilled') {
        setTopRatedMovies((topratedRes.value.data || []).slice(0, 8).map((i: any) => mapTmdb(i, 'movie')));
      }
    }).finally(() => setTvLoading(false));

    // Top Rated TV
    api.get('/tmdb/search?type=tv&orderBy=Latest&page=1').then(res => {
      setTopRatedTV((res.data || []).slice(0, 8).map((i: any) => mapTmdb(i, 'tv')));
    }).catch(() => {});

    // Spotify Albums (existing /spotify/new-releases)
    api.get('/spotify/new-releases').then(res => {
      const items = res.data?.albums?.items || [];
      setAlbums(items);
    }).catch(() => setMusicError(true)).finally(() => setAlbumsLoading(false));

    // Spotify Tracks (use existing /spotify/search)
    api.get('/spotify/search?q=top+hits+2026&type=track&limit=10').then(res => {
      const items = res.data?.tracks?.items || [];
      setTracks(items);
    }).catch(() => {}).finally(() => setTracksLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  const tabs = [
    { id: 'movies' as const, label: 'Movies & TV', icon: Film },
    { id: 'music' as const, label: 'Music', icon: Music },
  ];

  return (
    <div className="min-h-full pb-20">
      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-black pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative px-6 pt-8 pb-6 md:px-10 md:pt-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Bell size={20} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">What's New</h1>
                <p className="text-xs text-gray-500">Updated live from TMDB &amp; Spotify</p>
              </div>
            </div>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
            >
              <RefreshCw size={14} /><span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Tab Switch */}
          <div className="flex gap-1 mt-5 bg-white/5 border border-white/10 rounded-2xl p-1 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id ? 'bg-white/15 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={15} />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 md:px-10 space-y-10 mt-2">
        <AnimatePresence mode="wait">

          {/* ══ MOVIES & TV TAB ══ */}
          {activeTab === 'movies' && (
            <motion.div key="movies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">

              {/* Trending Movies */}
              <section>
                <SectionHeader icon={Film} title="Trending Movies" subtitle="Most popular movies right now" color="bg-blue-500/15 text-blue-400" badge="Hot" />
                {moviesError
                  ? <p className="text-gray-600 text-sm py-4">Could not load movies. Check your TMDB API key.</p>
                  : <HScroll>{moviesLoading
                      ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                      : trendingMovies.map((item, i) => (
                          <MediaCard key={item.id} item={item} index={i} onClick={() => navigate(`/media/tmdb/movie/${item.id}`)} />
                        ))
                    }</HScroll>
                }
              </section>

              {/* Trending TV */}
              <section>
                <SectionHeader icon={Tv} title="Top Rated TV Shows" subtitle="Best TV shows by rating" color="bg-purple-500/15 text-purple-400" badge="Top Rated" />
                {tvError
                  ? <p className="text-gray-600 text-sm py-4">Could not load TV data.</p>
                  : <HScroll>{tvLoading
                      ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                      : trendingTV.map((item, i) => (
                          <MediaCard key={item.id} item={item} index={i} onClick={() => navigate(`/media/tmdb/tv/${item.id}`)} />
                        ))
                    }</HScroll>
                }
              </section>

              {/* Two column: Top Rated Movies + Top TV */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                  <SectionHeader icon={TrendingUp} title="All-Time Top Movies" subtitle="Highest rated movies ever" color="bg-amber-500/15 text-amber-400" />
                  <div className="space-y-2">
                    {moviesLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex gap-3 p-3 animate-pulse">
                            <div className="w-14 h-20 bg-white/5 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                              <div className="h-3 bg-white/5 rounded w-3/4" />
                              <div className="h-3 bg-white/5 rounded w-1/2" />
                              <div className="h-3 bg-white/5 rounded w-full" />
                            </div>
                          </div>
                        ))
                      : topRatedMovies.map((item, i) => (
                          <ListCard key={item.id} item={item} index={i} onClick={() => navigate(`/media/tmdb/movie/${item.id}`)} />
                        ))
                    }
                  </div>
                </section>

                <section>
                  <SectionHeader icon={Tv} title="Latest TV Shows" subtitle="Newest TV series airing now" color="bg-indigo-500/15 text-indigo-400" />
                  <div className="space-y-2">
                    {tvLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex gap-3 p-3 animate-pulse">
                            <div className="w-14 h-20 bg-white/5 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                              <div className="h-3 bg-white/5 rounded w-3/4" />
                              <div className="h-3 bg-white/5 rounded w-1/2" />
                              <div className="h-3 bg-white/5 rounded w-full" />
                            </div>
                          </div>
                        ))
                      : topRatedTV.map((item, i) => (
                          <ListCard key={item.id} item={item} index={i} onClick={() => navigate(`/media/tmdb/tv/${item.id}`)} />
                        ))
                    }
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {/* ══ MUSIC TAB ══ */}
          {activeTab === 'music' && (
            <motion.div key="music" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">

              {/* New Albums */}
              <section>
                <SectionHeader icon={Disc3} title="New Releases" subtitle={`Fresh albums dropped in ${new Date().getFullYear()}`} color="bg-green-500/15 text-green-400" badge="Spotify" />
                {musicError
                  ? <p className="text-gray-600 text-sm py-4">Could not load music. Check your Spotify credentials.</p>
                  : <HScroll>{albumsLoading
                      ? Array.from({ length: 8 }).map((_, i) => <AlbumSkeleton key={i} />)
                      : albums.length > 0
                        ? albums.map((album, i) => <AlbumCard key={album.id} album={album} index={i} />)
                        : <p className="text-gray-600 text-sm py-4">No album data available.</p>
                    }</HScroll>
                }
              </section>

              {/* Top Tracks */}
              <section>
                <SectionHeader icon={Radio} title="Top Hits 2026" subtitle="Trending songs on Spotify" color="bg-green-500/15 text-green-400" badge="Live" />
                {musicError
                  ? <p className="text-gray-600 text-sm py-4">Could not load tracks.</p>
                  : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                      {tracksLoading
                        ? Array.from({ length: 8 }).map((_, i) => <TrackSkeleton key={i} />)
                        : tracks.length > 0
                          ? tracks.map((track, i) => <TrackRow key={track.id} track={track} index={i} />)
                          : (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                              <Headphones size={36} className="text-gray-700" />
                              <p className="text-gray-600 text-sm">No track data available.</p>
                              <p className="text-gray-700 text-xs">Connect your Spotify API credentials in server settings.</p>
                            </div>
                          )
                      }
                    </div>
                  )
                }
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
