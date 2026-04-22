import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2, X } from 'lucide-react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  localPath?: string; // tunnel URL for local file
  previewUrl?: string; // Spotify 30s preview
  spotifyUrl?: string; // link to open in Spotify
  durationMs?: number;
}

interface PlayerContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  playTrack: () => {},
  togglePlay: () => {},
  next: () => {},
  prev: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  return useContext(PlayerContext);
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const playTrack = (track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
    setCurrentTrack(track);
    const src = track.localPath || track.previewUrl || '';
    if (audioRef.current) {
      if (src) {
        audioRef.current.src = src;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      } else {
        // No audio source — show track info but don't attempt playback
        audioRef.current.src = '';
        setIsPlaying(false);
      }
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const next = (queueIndex + 1) % queue.length;
    setQueueIndex(next);
    playTrack(queue[next]);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prev = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prev);
    playTrack(queue[prev]);
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
    const audio = audioRef.current;

    const onTime = () => setProgress(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnded = () => handleNext();

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('ended', onEnded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };


  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !muted;
    setMuted(newMuted);
    audioRef.current.volume = newMuted ? 0 : volume;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, queue, isPlaying, playTrack, togglePlay, next: handleNext, prev: handlePrev }}>
      {children}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-t border-white/10 px-4 py-3"
          >
            <div className="max-w-screen-xl mx-auto flex items-center gap-4">
              {/* Album Art */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 shrink-0 shadow-lg">
                {currentTrack.albumArt ? (
                  <img src={currentTrack.albumArt} alt={currentTrack.album} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={20} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="w-40 shrink-0">
                <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
                <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
              </div>

              {/* Controls */}
              <div className="flex-1 flex flex-col items-center gap-1">
                {!currentTrack.localPath && !currentTrack.previewUrl ? (
                  // No audio available — show Spotify link
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-gray-400">No preview available</p>
                    {currentTrack.spotifyUrl && (
                      <a
                        href={currentTrack.spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 underline transition-colors"
                      >
                        Open in Spotify ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors">
                        <SkipBack size={18} />
                      </button>
                      <button
                        onClick={togglePlay}
                        className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform"
                      >
                        {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" />}
                      </button>
                      <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors">
                        <SkipForward size={18} />
                      </button>
                    </div>
                    {/* Seek Bar */}
                    <div className="flex items-center gap-2 w-full max-w-md">
                      <span className="text-xs text-gray-500 w-8 text-right">{fmt(progress)}</span>
                      <input
                        type="range" min={0} max={duration || 1} step={0.1} value={progress}
                        onChange={seek}
                        className="flex-1 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 w-8">{fmt(duration)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Volume + Close */}
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
                  onChange={changeVolume}
                  className="w-20 h-1 appearance-none bg-white/20 rounded-full accent-white cursor-pointer"
                />
                <button
                  onClick={() => { audioRef.current?.pause(); setCurrentTrack(null); setIsPlaying(false); }}
                  className="text-gray-400 hover:text-white transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PlayerContext.Provider>
  );
}
