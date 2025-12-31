import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface VideoPlayerProps {
  mediaId: string;
  onClose: () => void;
}

export default function VideoPlayer({ mediaId, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const token = localStorage.getItem('token');

  // Construct stream URL with auth token
  const streamUrl = `http://localhost:3000/api/stream/${mediaId}?token=${token}`;

  useEffect(() => {
    // Auto-play when mounted
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.error("Auto-play blocked", err));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header / Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-end z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full object-contain"
        controls
        autoPlay
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
