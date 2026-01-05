import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Calendar, Clock, ChevronDown } from 'lucide-react';
import api from '../../lib/api';

interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string;
  episode_number: number;
  air_date: string;
  runtime: number; // minutes usually, or null
}

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path: string;
}

interface SeasonViewProps {
  tmdbId: number;
  seasons: Season[];
  onSeasonSelect?: (seasonNumber: number, posterPath: string) => void;
}

export function SeasonView({ tmdbId, seasons, onSeasonSelect }: SeasonViewProps) {
  // Filter out "Specials" (season 0) if desired, or keep them. usually users like them.
  // Sort by season number just in case
  const sortedSeasons = [...seasons].sort((a, b) => a.season_number - b.season_number);

  const [selectedSeason, setSelectedSeason] = useState<number>(
    sortedSeasons.length > 0 && sortedSeasons[0].season_number === 0 && sortedSeasons.length > 1
      ? sortedSeasons[1].season_number // Default to Season 1 if 0 exists and others exist
      : sortedSeasons[0]?.season_number || 1
  );

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSeasonClick = (season: Season) => {
    setSelectedSeason(season.season_number);
    if (onSeasonSelect) {
      onSeasonSelect(season.season_number, season.poster_path);
    }
  };

  useEffect(() => {
    if (!tmdbId) return;

    const fetchEpisodes = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tmdb/tv/${tmdbId}/season/${selectedSeason}`);
        // Response contains { _id, air_date, episodes: [], ... }
        setEpisodes(res.data.episodes || []);
      } catch (error) {
        console.error('Failed to fetch episodes', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [tmdbId, selectedSeason]);

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
      <div className="space-y-6">
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
              className="grid gap-6"
            >
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="flex flex-col md:flex-row gap-6 bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="relative shrink-0 w-full md:w-[240px] aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    {episode.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                        alt={episode.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Play size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play fill="white" size={32} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white truncate pr-4">
                        <span className="text-apple-blue mr-2">{episode.episode_number}.</span>
                        {episode.name}
                      </h3>
                      {episode.runtime && (
                        <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                          <Clock size={12} /> {episode.runtime}m
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-3 mb-3 leading-relaxed">
                      {episode.overview || "No description available."}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                      {episode.air_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(episode.air_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

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
