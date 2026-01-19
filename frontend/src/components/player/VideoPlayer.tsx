import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, FastForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface VideoPlayerProps {
  mediaId: string;
  onClose: () => void;
  title: string;
  posterPath?: string;
  tmdbId?: number;
  mediaType: 'movie' | 'tv';
}

const Volume3 = ({ size = 24, className }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="9 5 4 9 0 9 0 15 4 15 9 19 9 5" />
    <path d="M13.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M16.36 5.64a9 9 0 0 1 0 12.72" />
    <path d="M19.19 2.81a13 13 0 0 1 0 18.38" />
  </svg>
);

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ mediaId, onClose, title, posterPath, tmdbId, mediaType }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');
  const streamUrl = `http://localhost:3000/api/stream/${mediaId}?token=${token}`;

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVolAnimating, setIsVolAnimating] = useState(false);
  const volAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Seek feedback state
  const [seekFeedback, setSeekFeedback] = useState<{ type: 'forward' | 'backward'; seconds: number } | null>(null);
  const seekAccumulatorRef = useRef(0);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [nextUpMedia, setNextUpMedia] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [showNextUp, setShowNextUp] = useState(false);
  const [hasShownNextUp, setHasShownNextUp] = useState(false);

  // Fetch Up Next
  useEffect(() => {
    if (!tmdbId) return;
    api.get(`/history/next/${tmdbId}?type=${mediaType}`)
      .then(res => setNextUpMedia(res.data))
      .catch(console.error);
  }, [tmdbId, mediaType]);

  // Check for End of Video
  useEffect(() => {
    if (duration > 0 && currentTime > 0) {
      const remaining = duration - currentTime;
      // Show when credits likely start (approx 5 mins remaining or 95% done)
      // This is a heuristic since we don't have exact credit markers
      if (remaining < 300 && !hasShownNextUp && !showNextUp && nextUpMedia) {
        console.log('Showing Up Next (Credits Helper)');
        setShowNextUp(true);
        setHasShownNextUp(true);
      }
    }
  }, [currentTime, duration, hasShownNextUp, showNextUp, nextUpMedia]);

  // Track History on Mount
  useEffect(() => {
    const trackHistory = async () => {
      try {
        await api.post('/history', {
          mediaId: tmdbId ? undefined : mediaId, // Only send mediaId if local
          tmdbId,
          mediaType,
          title,
          posterPath
        });
        console.log('Added to history');
      } catch (err) {
        console.error('Failed to track history', err);
      }
    };
    trackHistory();
  }, [mediaId, tmdbId, mediaType, title, posterPath]);


  const triggerVolAnim = useCallback(() => {
    setIsVolAnimating(true);
    if (volAnimTimeoutRef.current) clearTimeout(volAnimTimeoutRef.current);
    volAnimTimeoutRef.current = setTimeout(() => setIsVolAnimating(false), 200);
  }, []);

  // Helpers defined first with useCallback for stability
  const handleActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!videoRef.current?.paused) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    }
  }, []);

  const seek = useCallback((amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;

      // Feedback logic
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);

      seekAccumulatorRef.current += amount;
      const totalSeconds = Math.abs(seekAccumulatorRef.current);
      const isForward = seekAccumulatorRef.current > 0;

      setSeekFeedback({
        type: isForward ? 'forward' : 'backward',
        seconds: totalSeconds
      });

      seekTimeoutRef.current = setTimeout(() => {
        setSeekFeedback(null);
        seekAccumulatorRef.current = 0;
      }, 1000);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setMuted(newMuted);
    }
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    if (videoRef.current) {
      const newVol = Math.min(Math.max(videoRef.current.volume + delta, 0), 1);
      videoRef.current.volume = newVol;
      setVolume(newVol);
      setMuted(newVol === 0);
      triggerVolAnim();
    }
  }, [triggerVolAnim]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setVolume(vol);
      setMuted(vol === 0);
      triggerVolAnim();
    }
  }, [triggerVolAnim]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  // Keyboard Event Listener
  useEffect(() => {
    // Auto-play
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      handleActivity();
      switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleMute(); break;
        case 'ArrowRight': seek(5); break;
        case 'ArrowLeft': seek(-5); break;
        case 'ArrowUp': e.preventDefault(); adjustVolume(0.1); break;
        case 'ArrowDown': e.preventDefault(); adjustVolume(-0.1); break;
        case 'Escape': onClose(); break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleActivity, togglePlay, toggleFullscreen, toggleMute, seek, adjustVolume, onClose]);

  return (
    <div
      ref={playerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center group"
      onMouseMove={handleActivity}
      onClick={handleActivity}
    >
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
        onEnded={() => setPlaying(false)}
      />

      {/* Seek Feedback Overlay */}
      {seekFeedback && (
        <div className={cn(
          "absolute inset-0 flex items-center z-30 pointer-events-none px-20 animate-in fade-in zoom-in-95 duration-200",
          seekFeedback.type === 'backward' ? "justify-start" : "justify-end"
        )}>
          <div className="flex items-center gap-4 text-3xl font-bold text-white drop-shadow-md">
            {seekFeedback.type === 'backward' && <ChevronLeft size={48} />}
            <span>
              {seekFeedback.type === 'forward' ? '+' : '-'} {seekFeedback.seconds}
            </span>
            {seekFeedback.type === 'forward' && <ChevronRight size={48} />}
          </div>
        </div>
      )}

      {/* Overlay Gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none transition-opacity duration-300",
        showControls && !showNextUp ? "opacity-100" : "opacity-0"
      )} />

      {/* UP NEXT OVERLAY */}
      {showNextUp && nextUpMedia && (
        <div className="absolute inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
          {/* Background Image with Gradient */}
          <div className="absolute inset-0 z-0 opacity-40">
            <img
              src={`https://image.tmdb.org/t/p/original${nextUpMedia.backdropPath}`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black via-black/80 to-transparent" />
          </div>

          <div className="relative z-10 p-12 max-w-2xl text-right flex flex-col items-end gap-6 mr-10">
            <div className="space-y-2">
              <span className="text-gray-400 font-medium uppercase tracking-widest text-sm">Up Next</span>
              <h2 className="text-5xl font-bold text-white leading-tight drop-shadow-2xl">
                {nextUpMedia.title}
              </h2>
              <p className="text-lg text-gray-300 line-clamp-2 max-w-xl text-right drop-shadow-md">
                {nextUpMedia.overview}
              </p>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={onClose}
                className="px-8 py-4 rounded-xl font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // This is a bit of a hack: reload the window with new ID or use callback
                  // Ideally, we'd have a prop to switch media, but for now navigate/reload works
                  window.location.href = `/media/tmdb/${nextUpMedia.mediaType}/${nextUpMedia.tmdbId}`;
                }}
                className="px-10 py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-transform active:scale-95 flex items-center gap-3 shadow-xl"
              >
                <Play fill="currentColor" size={24} />
                Play Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Container */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-6 transition-all duration-300 flex flex-col gap-2 z-20",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Progress Bar */}
        <div className="flex items-center gap-3 group/timeline cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 transition-all hover:h-2"
            style={{
              background: `linear-gradient(to right, #dc2626 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%)`
            }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-gray-200 transition-transform active:scale-95 focus:outline-none">
              {playing ? <Pause fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />}
            </button>

            <button onClick={() => seek(10)} className="text-gray-300 hover:text-white focus:outline-none">
              <FastForward size={24} />
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className={cn(
                  "text-white hover:text-gray-200 transition-transform duration-200 focus:outline-none",
                  isVolAnimating && "scale-125"
                )}
              >
                {muted || volume === 0 ? (
                  <VolumeX size={24} />
                ) : volume < 0.33 ? (
                  <Volume1 size={24} />
                ) : volume < 0.66 ? (
                  <Volume2 size={24} />
                ) : (
                  <Volume3 size={24} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden group-hover/vol:w-28 transition-all duration-300 h-1 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:h-1.5"
                style={{
                  background: `linear-gradient(to right, #ffffff ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%)`
                }}
              />
            </div>

            <span className="text-sm text-gray-300 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              {fullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Top Controls */}
      <div className={cn(
        "absolute top-0 right-0 p-6 z-20 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/50 hover:bg-white/20 text-white backdrop-blur-md transition-colors focus:outline-none"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
}
