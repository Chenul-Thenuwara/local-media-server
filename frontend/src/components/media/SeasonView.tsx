import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Play } from 'lucide-react';
import api from '../../lib/api';

interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number;
}

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path: string;
}

interface LocalEpisode {
  _id: string;
  filename: string;
  title?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  mediaInfo?: { resolution?: string; isHdr?: boolean; audioCodec?: string };
}

interface SeasonViewProps {
  tmdbId: number;
  seasons: Season[];
  localEpisodes?: LocalEpisode[];
  onSeasonSelect?: (seasonNumber: number, posterPath: string) => void;
  onPlayEpisode?: (episodeId: string) => void;
}

// Parse S01E02 → { season: 1, episode: 2 }
function parseEpisodeCode(filename: string): { season: number; episode: number } | null {
  const m = filename.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
  return m ? { season: parseInt(m[1]), episode: parseInt(m[2]) } : null;
}

export function SeasonView({ tmdbId, seasons, localEpisodes = [], onSeasonSelect, onPlayEpisode }: SeasonViewProps) {
  const sortedSeasons = [...seasons].sort((a, b) => a.season_number - b.season_number);

  const [selectedSeason, setSelectedSeason] = useState<number>(
    sortedSeasons.length > 0 && sortedSeasons[0].season_number === 0 && sortedSeasons.length > 1
      ? sortedSeasons[1].season_number
      : sortedSeasons[0]?.season_number || 1
  );

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSeasonClick = (season: Season) => {
    setSelectedSeason(season.season_number);
    if (onSeasonSelect) onSeasonSelect(season.season_number, season.poster_path);
  };

  useEffect(() => {
    if (!tmdbId) return;
    const fetchEpisodes = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tmdb/tv/${tmdbId}/season/${selectedSeason}`);
        setEpisodes(res.data.episodes || []);
      } catch (error) {
        console.error('Failed to fetch episodes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodes();
  }, [tmdbId, selectedSeason]);

  // Map local files by season+episode for O(1) lookup
  // Prefer DB-stored season/episode numbers; fall back to filename parsing
  const localMap = new Map<string, LocalEpisode>();
  for (const ep of localEpisodes) {
    let season: number | undefined = ep.seasonNumber;
    let episode: number | undefined = ep.episodeNumber;
    // Fallback: parse from filename if DB fields missing
    if (season === undefined || episode === undefined) {
      const code = parseEpisodeCode(ep.filename);
      if (code) { season = code.season; episode = code.episode; }
    }
    if (season !== undefined && episode !== undefined) {
      localMap.set(`${season}-${episode}`, ep);
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-6">Episodes</h2>

      {/* Season Selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {sortedSeasons.map((season) => (
          <button
            key={season.id}
            onClick={() => handleSeasonClick(season)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSeason === season.season_number
              ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/25'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
          >
            {season.name}
          </button>
        ))}
      </div>

      {/* Episodes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mr-3" />
            Loading episodes...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSeason}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-4"
            >
              {episodes.map((episode) => {
                const localEp = localMap.get(`${selectedSeason}-${episode.episode_number}`);
                const hasLocal = !!localEp;

                return (
                  <div
                    key={episode.id}
                    className={`flex flex-col md:flex-row gap-4 rounded-xl p-4 transition-all group border ${
                      hasLocal
                        ? 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-apple-blue/30 cursor-pointer'
                        : 'bg-white/[0.03] border-white/5 opacity-60'
                    }`}
                    onClick={() => hasLocal && onPlayEpisode && onPlayEpisode(localEp!._id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative shrink-0 w-full md:w-[220px] aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      {episode.still_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                          alt={episode.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          <Calendar size={32} />
                        </div>
                      )}

                      {/* Play overlay — only when local file exists */}
                      {hasLocal && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-apple-blue/90 flex items-center justify-center shadow-lg shadow-apple-blue/40">
                            <Play fill="white" size={20} className="ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* "Not Downloaded" badge */}
                      {!hasLocal && (
                        <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-gray-400 border border-white/10">
                          Not in library
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h3 className="text-base font-bold text-white">
                          <span className="text-apple-blue mr-2">{episode.episode_number}.</span>
                          {episode.name}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Local file quality badges */}
                          {localEp?.mediaInfo?.resolution && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-gray-200">
                              {localEp.mediaInfo.resolution}
                            </span>
                          )}
                          {localEp?.mediaInfo?.isHdr && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300">
                              HDR
                            </span>
                          )}
                          {episode.runtime && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={11} /> {episode.runtime}m
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm line-clamp-2 mb-3 leading-relaxed">
                        {episode.overview || 'No description available.'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {episode.air_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(episode.air_date).toLocaleDateString()}
                          </span>
                        )}
                        {hasLocal && (
                          <span className="text-apple-blue font-medium flex items-center gap-1">
                            <Play size={11} fill="currentColor" /> Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {episodes.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  No episodes found for this season.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
