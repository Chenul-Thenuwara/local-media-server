import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2, X, ChevronDown } from 'lucide-react';
import { useSpotifyAuth } from '../../hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '../../hooks/useSpotifyPlayer';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  localPath?: string; // tunnel URL for local file
  previewUrl?: string; // Spotify 30s preview
  spotifyUrl?: string; // link to open in Spotify
  spotifyUri?: string; // spotify:track:ID
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const spotifyAuth = useSpotifyAuth();
  const spotifyPlayer = useSpotifyPlayer(spotifyAuth.accessToken);

  // Sync state from Spotify SDK player
  useEffect(() => {
    if (currentTrack?.spotifyUri && spotifyAuth.connected && spotifyPlayer.playbackState) {
      const ps = spotifyPlayer.playbackState;
      setIsPlaying(!ps.paused);
      setProgress(ps.position / 1000);
      setDuration(ps.duration / 1000);
    }
  }, [spotifyPlayer.playbackState, currentTrack, spotifyAuth.connected]);

  const playTrack = (track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
    setCurrentTrack(track);

    // Stop HTML5 audio if we switch to Spotify SDK or a new track
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    if (track.spotifyUri && spotifyAuth.connected) {
      spotifyPlayer.playTrack(track.spotifyUri);
      return;
    }

    const src = track.localPath || track.previewUrl || '';
    if (audioRef.current && src) {
      audioRef.current.src = src;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    } else {
      setIsPlaying(false);
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
    if (currentTrack?.spotifyUri && spotifyAuth.connected) {
      spotifyPlayer.togglePlay();
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const src = currentTrack?.localPath || currentTrack?.previewUrl || '';
      if (src) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  };


  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (currentTrack?.spotifyUri && spotifyAuth.connected) {
      spotifyPlayer.seek(t * 1000);
      setProgress(t);
      return;
    }

    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (currentTrack?.spotifyUri && spotifyAuth.connected) {
      spotifyPlayer.setVolume(v);
    }
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    const newVol = newMuted ? 0 : volume;

    if (currentTrack?.spotifyUri && spotifyAuth.connected) {
      spotifyPlayer.setVolume(newVol);
    }
    if (audioRef.current) audioRef.current.volume = newVol;
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
      <AnimatePresence>
        {currentTrack && !isExpanded && (
          <motion.div
            layoutId="player-container"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl border-t border-white/10 px-4 py-3 cursor-pointer group"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button, input, a')) return;
              setIsExpanded(true);
            }}
          >
            <div className="max-w-screen-xl mx-auto flex items-center gap-4">
              {/* Album Art */}
              <motion.div layoutId="player-art" className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 shrink-0 shadow-lg relative">
                {currentTrack.albumArt ? (
                  <img src={currentTrack.albumArt} alt={currentTrack.album} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={20} className="text-gray-400" />
                  </div>
                )}
                {/* Hover expand icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center transition-opacity">
                   <ChevronDown size={16} className="text-white rotate-180" />
                </div>
              </motion.div>

              {/* Track Info */}
              <div className="w-32 sm:w-40 shrink-0">
                <motion.p layoutId="player-title" className="text-sm font-semibold text-white truncate">{currentTrack.title}</motion.p>
                <motion.p layoutId="player-artist" className="text-xs text-gray-400 truncate">{currentTrack.artist}</motion.p>
              </div>

              {/* Controls */}
              <div className="flex-1 flex flex-col items-center gap-1">
                {!currentTrack.localPath && !currentTrack.previewUrl && !(currentTrack.spotifyUri && spotifyAuth.connected) ? (
                  // No audio available — show Spotify link
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                    <p className="hidden sm:block text-xs text-gray-500">No playback available</p>
                    {currentTrack.spotifyUrl && (
                      <a
                        href={currentTrack.spotifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 underline transition-colors whitespace-nowrap"
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
                        {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
                      </button>
                      <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors">
                        <SkipForward size={18} />
                      </button>
                    </div>
                    {/* Seek Bar */}
                    <div className="hidden md:flex items-center gap-2 w-full max-w-md">
                      <span className="text-xs text-gray-500 w-8 text-right">{fmt(progress)}</span>
                      <input
                        type="range" min={0} max={duration || 1} step={0.1} value={progress}
                        onChange={seek}
                        style={{
                          background: `linear-gradient(to right, #4ade80 ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.15) ${(progress / (duration || 1)) * 100}%)`
                        }}
                        className="flex-1 h-1 appearance-none rounded-full accent-green-400 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500 w-8">{fmt(duration)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Volume + Close */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-3">
                  <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                    {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
                    onChange={changeVolume}
                    style={{
                      background: `linear-gradient(to right, #4ade80 ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(muted ? 0 : volume) * 100}%)`
                    }}
                    className="w-20 h-1 appearance-none rounded-full accent-green-400 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => { audioRef.current?.pause(); setCurrentTrack(null); setIsPlaying(false); }}
                  className="text-gray-400 hover:text-white transition-colors ml-0 sm:ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {currentTrack && isExpanded && (
          <motion.div
            layoutId="player-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col px-6 py-8 sm:p-12 overflow-y-auto"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8 max-w-xl mx-auto w-full shrink-0">
              <button onClick={() => setIsExpanded(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <ChevronDown size={24} />
              </button>
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-semibold">Now Playing</p>
              </div>
              <button onClick={() => { audioRef.current?.pause(); setCurrentTrack(null); setIsPlaying(false); setIsExpanded(false); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full gap-8 pb-10">
              {/* Album Art */}
              <motion.div layoutId="player-art" className="w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-white/5 shadow-2xl shadow-black">
                {currentTrack.albumArt ? (
                  <img src={currentTrack.albumArt} alt={currentTrack.album} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={80} className="text-gray-600" />
                  </div>
                )}
              </motion.div>

              {/* Track Info */}
              <div className="text-center space-y-1">
                <motion.p layoutId="player-title" className="text-2xl sm:text-3xl font-bold text-white truncate px-2">{currentTrack.title}</motion.p>
                <motion.p layoutId="player-artist" className="text-base sm:text-lg text-gray-400 truncate px-2">{currentTrack.artist}</motion.p>
                {currentTrack.album && <p className="text-sm text-gray-500 truncate mt-1 px-2">{currentTrack.album}</p>}
              </div>

              {/* Playback Controls */}
              {!currentTrack.localPath && !currentTrack.previewUrl && !(currentTrack.spotifyUri && spotifyAuth.connected) ? (
                <div className="flex justify-center mt-4">
                  {currentTrack.spotifyUrl ? (
                    <a
                      href={currentTrack.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-8 py-3 rounded-full bg-green-400 text-black font-bold hover:bg-green-300 transition-colors"
                    >
                      Open in Spotify
                    </a>
                  ) : (
                    <p className="text-gray-500 text-sm">No playback available</p>
                  )}
                </div>
              ) : (
                <div className="space-y-8 mt-4">
                  {/* Seek Bar */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="range" min={0} max={duration || 1} step={0.1} value={progress}
                      onChange={seek}
                      style={{
                        background: `linear-gradient(to right, #4ade80 ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.15) ${(progress / (duration || 1)) * 100}%)`
                      }}
                      className="w-full h-1.5 appearance-none rounded-full accent-green-400 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                      <span>{fmt(progress)}</span>
                      <span>{fmt(duration)}</span>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center justify-center gap-8">
                    <button onClick={handlePrev} className="text-white hover:text-green-400 transition-colors">
                      <SkipBack size={36} fill="currentColor" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg shadow-white/10"
                    >
                      {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-2" />}
                    </button>
                    <button onClick={handleNext} className="text-white hover:text-green-400 transition-colors">
                      <SkipForward size={36} fill="currentColor" />
                    </button>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-4 px-4 hidden sm:flex">
                    <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors shrink-0">
                      {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
                      onChange={changeVolume}
                      style={{
                        background: `linear-gradient(to right, #4ade80 ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(muted ? 0 : volume) * 100}%)`
                      }}
                      className="flex-1 h-1.5 appearance-none rounded-full accent-green-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PlayerContext.Provider>
  );
}
