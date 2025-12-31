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
}

import VideoPlayer from '../../components/player/VideoPlayer';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await api.get(`/media/${id}`);
        setMedia(res.data);
      } catch (err) {
        console.error('Failed to fetch media', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [id]);

  if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>;
  if (!media) return <div className="h-full flex items-center justify-center text-gray-400">Media not found</div>;

  const backdropUrl = media.backdropPath
    ? `https://image.tmdb.org/t/p/original${media.backdropPath}`
    : null;

  return (
    // -ml-64 pulls the container back under the sidebar (Immersive effect)
    <div className="relative min-h-screen bg-black text-white -ml-64 w-[calc(100%+16rem)]">
      {/* Video Player Overlay */}
      {playing && (
        <VideoPlayer mediaId={id!} onClose={() => setPlaying(false)} />
      )}

      {/* Backdrop */}
      <div className="absolute inset-0 h-[70vh] w-full overflow-hidden">
        {backdropUrl ? (
          <img src={backdropUrl} className="w-full h-full object-cover opacity-50" alt="Backdrop" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content - Add pl-64 to compensate for the negative margin */}
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
            {media.posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${media.posterPath}`}
                alt={media.title}
                className="w-full h-full object-cover"
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
            </motion.div>

            <div className="flex items-center gap-4 mb-10">
              <Button
                size="lg"
                onClick={() => setPlaying(true)}
                className="bg-apple-blue hover:bg-blue-600 border-none px-8 py-6 text-lg"
              >
                <Play fill="currentColor" className="mr-3" />
                Play Movie
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-3 text-gray-200">Synopsis</h3>
              <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
                {media.overview || "No overview available for this title."}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
