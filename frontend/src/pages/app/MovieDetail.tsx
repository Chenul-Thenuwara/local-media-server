import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Calendar, FileVideo, HardDrive } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

interface MediaDetail {
  _id: string;
  filename: string;
  path: string;
  size: number;
  title?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  type: 'movie' | 'tv';
  tmdbId?: number;
  credits?: {
    cast: any[];
  };
  isTmdb?: boolean;
  seasons?: any[];
  // Technical Info
  mediaInfo?: {
    resolution?: '4K' | '1080p' | '720p' | 'SD';
    videoCodec?: string;
    audioCodec?: string;
    isHdr?: boolean;
    audioChannels?: number;
  };
}

import VideoPlayer from '../../components/player/VideoPlayer';
import { CastCarousel } from '../../components/media/CastCarousel';
import { SeasonView } from '../../components/media/SeasonView';

export default function MovieDetail() {
  const { id, type } = useParams<{ id: string; type?: string }>();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [displayPoster, setDisplayPoster] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // ... (existing fetch logic remains the same) ...
        let endpoint = `/media/${id}`;
        let isTmdbItem = false;

        // If 'type' param is present, it's a global TMDB item (via new route)
        if (type) {
          endpoint = `/tmdb/${type}/${id}`;
          isTmdbItem = true;
        }
        // Fallback for legacy ID check (optional, but good for safety)
        else if (!id?.match(/^[0-9a-fA-F]{24}$/)) {
          // Default to movie if we just have a number and no type (shouldn't happen with new routing)
          endpoint = `/tmdb/movie/${id}`;
          isTmdbItem = true;
        }

        const res = await api.get(endpoint);
        const mediaData = res.data;
        if (isTmdbItem) mediaData.isTmdb = true;

        setMedia(mediaData);
        setDisplayPoster(mediaData.posterPath); // Initialize display poster

        // Handle Cast
        if (isTmdbItem && mediaData.credits) {
          setCast(mediaData.credits.cast);
        } else if (mediaData.tmdbId) {
          try {
            const castRes = await api.get(`/tmdb/credits/${mediaData.tmdbId}`);
            setCast(castRes.data.cast || []);
          } catch (e) {
            console.error('Failed to load local cast', e);
          }
        }
      } catch (err) {
        console.error('Failed to fetch media', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id, type]);

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>;
  if (!media) return <div className="h-full flex items-center justify-center text-gray-400">Media not found</div>;

  const backdropUrl = media.backdropPath
    ? `https://image.tmdb.org/t/p/original${media.backdropPath}`
    : null;

  return (
    // ... (wrapper and backdrop code remains same) ...
    <div className="relative min-h-screen text-white -ml-64 w-[calc(100%+16rem)]">
      {/* Video Player Overlay */}
      {playing && (
        <VideoPlayer mediaId={id!} onClose={() => setPlaying(false)} />
      )}

      {/* Backdrop - Fixed & Full Screen */}
      <div className="fixed inset-0 h-screen w-full overflow-hidden z-0">
        {backdropUrl ? (
          <img src={backdropUrl} className="w-full h-full object-cover object-top opacity-50" alt="Backdrop" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black" />
        )}
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-12 pt-8 pl-[calc(16rem+3rem)]">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-300 hover:text-white mb-8">
          <ArrowLeft className="mr-2" size={20} /> Back
        </Button>

        <div className="flex gap-12 mt-4">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-[300px] shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900"
          >
            {displayPoster ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${displayPoster}`}
                alt={media.title}
                key={displayPoster} // Add key to trigger animation on change
                className="w-full h-full object-cover animate-in fade-in duration-300"
              />
            ) : (
              <div className="h-[450px] flex items-center justify-center flex-col gap-4 text-gray-500">
                <FileVideo size={48} />
                <span>No Poster</span>
              </div>
            )}
          </motion.div>

          {/* Info */}
          <div className="flex-1 max-w-4xl pt-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-bold mb-4"
            >
              {media.title || media.filename}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-6 text-gray-300 mb-8"
            >
              {/* ... (metadata) ... */}
              {media.releaseDate && (
                <span className="flex items-center gap-2">
                  <Calendar size={18} />
                  {new Date(media.releaseDate).getFullYear()}
                </span>
              )}
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium uppercase tracking-wide">
                {media.type}
              </span>
              {/* File details */}
              <span className="flex items-center gap-2 text-gray-500 text-sm">
                <HardDrive size={16} />
                {media.filename}
              </span>

              {/* Technical Badges */}
              {media.mediaInfo && (
                <div className="flex items-center gap-2 border-l border-white/20 pl-6 ml-2">
                  {media.mediaInfo.resolution && (
                    <span className="px-1.5 py-0.5 border border-gray-500 rounded text-xs font-bold text-gray-300">
                      {media.mediaInfo.resolution}
                    </span>
                  )}
                  {media.mediaInfo.isHdr && (
                    <span className="px-1.5 py-0.5 border border-gray-500 rounded text-xs font-bold text-gray-300">
                      HDR
                    </span>
                  )}
                  {media.mediaInfo.audioCodec && (
                    <span className="px-1.5 py-0.5 border border-gray-500 rounded text-xs font-bold text-gray-300">
                      {media.mediaInfo.audioCodec}
                    </span>
                  )}
                  {media.mediaInfo.audioChannels && (
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                      <span className="bg-gray-800 px-1 rounded">{media.mediaInfo.audioChannels}</span>
                    </span>
                  )}
                </div>
              )}
            </motion.div>

            <div className="flex items-center gap-4 mb-10">
              {/* ... (buttons) ... */}
              {!media.isTmdb && (
                <Button
                  size="lg"
                  onClick={() => setPlaying(true)}
                  className="bg-apple-blue hover:bg-blue-600 border-none px-8 py-6 text-lg"
                >
                  <Play fill="currentColor" className="mr-3" />
                  Play Movie
                </Button>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-200">Synopsis</h3>
              <p className="text-lg text-gray-400 leading-relaxed max-w-3xl mb-12">
                {media.overview || "No overview available for this title."}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Cast Carousel (Full Width) */}
        <div className="mt-12">
          <CastCarousel cast={cast} />
        </div>

        {/* Season View (TV Shows Only) */}
        {media.type === 'tv' && media.seasons && media.tmdbId && (
          <div className="mt-12">
            <SeasonView
              tmdbId={media.tmdbId}
              seasons={media.seasons}
              onSeasonSelect={async (seasonNum, poster) => {
                setDisplayPoster(poster);
                // Fetch season specific cast
                if (media.tmdbId) {
                  try {
                    const res = await api.get(`/tmdb/tv/${media.tmdbId}/season/${seasonNum}/credits`);
                    if (res.data.cast) {
                      setCast(res.data.cast);
                    }
                  } catch (e) {
                    console.error("Failed to fetch season credits", e);
                  }
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
