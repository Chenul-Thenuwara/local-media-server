import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Image as ImageIcon, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

interface LocalPhotoItem {
  _id: string;
  filename: string;
  path: string;
  size: number;
}

export function LocalPhotoGrid() {
  const [photos, setPhotos] = useState<LocalPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Lightbox state
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);

  const getImageUrl = (photo: LocalPhotoItem) => {
    const token = localStorage.getItem('token');
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stream/${photo._id}?token=${token}`;
  };

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/media?type=photo');
      if (Array.isArray(res.data)) setPhotos(res.data);
      setErrorMsg('');
    } catch (err: unknown) {
      console.error('Failed to fetch local photos', err);
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(e.response?.data?.error || e.message || 'Failed to load local photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPhotos(); }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedIndex === null) return;
    if (e.key === 'Escape') { setSelectedIndex(null); setZoomed(false); }
    if (e.key === 'ArrowRight') setSelectedIndex(i => i !== null ? (i + 1) % photos.length : null);
    if (e.key === 'ArrowLeft') setSelectedIndex(i => i !== null ? (i - 1 + photos.length) % photos.length : null);
  }, [selectedIndex, photos.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = selectedIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedIndex]);

  const openPhoto = (index: number) => { setSelectedIndex(index); setZoomed(false); };
  const closePhoto = () => { setSelectedIndex(null); setZoomed(false); };
  const prevPhoto = () => { setSelectedIndex(i => i !== null ? (i - 1 + photos.length) % photos.length : null); setZoomed(false); };
  const nextPhoto = () => { setSelectedIndex(i => i !== null ? (i + 1) % photos.length : null); setZoomed(false); };

  // Touch swipe handlers
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { if (diff > 0) { nextPhoto(); } else { prevPhoto(); } }
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-apple-blue" size={32} />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-xl border border-white/10">
        <p className="text-red-400 mb-4">{errorMsg}</p>
        <button onClick={fetchPhotos} className="text-gray-400 hover:text-white underline">Retry</button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white/5 rounded-xl border border-white/10">
        <ImageIcon size={48} className="mb-4 opacity-50" />
        <p>No local photos found.</p>
        <p className="text-sm mt-2">Add a folder containing images to get started.</p>
      </div>
    );
  }

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo._id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="aspect-square rounded-xl overflow-hidden bg-gray-800 relative group cursor-pointer shadow-md"
            onClick={() => openPhoto(index)}
          >
            <img
              src={getImageUrl(photo)}
              alt={photo.filename}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end p-2 opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs truncate drop-shadow-md">{photo.filename}</span>
            </div>
            {/* Zoom icon on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                <ZoomIn size={14} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 shrink-0 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={closePhoto}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div>
                  <p className="text-white text-sm font-medium truncate max-w-[200px] sm:max-w-xs">{selectedPhoto.filename}</p>
                  <p className="text-gray-500 text-xs">{selectedIndex + 1} / {photos.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomed(z => !z)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title={zoomed ? 'Zoom out' : 'Zoom in'}
                >
                  {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
                </button>
                <a
                  href={getImageUrl(selectedPhoto)}
                  download={selectedPhoto.filename}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </a>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-16 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedPhoto._id}
                  src={getImageUrl(selectedPhoto)}
                  alt={selectedPhoto.filename}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: zoomed ? 1.8 : 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onClick={() => setZoomed(z => !z)}
                  draggable={false}
                />
              </AnimatePresence>
            </div>

            {/* Nav Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors backdrop-blur-sm border border-white/10 z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors backdrop-blur-sm border border-white/10 z-10"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Bottom Filmstrip Thumbnails */}
            <div className="shrink-0 pb-4 px-4 bg-gradient-to-t from-black/80 to-transparent pt-8">
              <div className="flex gap-2 overflow-x-auto pb-1 justify-center scrollbar-hide max-w-full">
                {photos.map((p, i) => (
                  <button
                    key={p._id}
                    onClick={() => { setSelectedIndex(i); setZoomed(false); }}
                    className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden transition-all duration-200 border-2 ${
                      i === selectedIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img src={getImageUrl(p)} alt={p.filename} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
