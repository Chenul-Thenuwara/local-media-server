import { useEffect, useState } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
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

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/media?type=photo');
      if (Array.isArray(res.data)) {
        setPhotos(res.data);
      }
      setErrorMsg('');
    } catch (err: any) {
      console.error('Failed to fetch local photos', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to load local photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

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
        <button onClick={fetchPhotos} className="text-gray-400 hover:text-white underline">
          Retry
        </button>
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {photos.map((photo) => {
        // Construct standard static file URL for viewing
        // Assuming the backend has a /stream route or static serving, 
        // usually /api/media/stream/:id or similar is used for local media
        const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stream/${photo._id}`;

        return (
          <div key={photo._id} className="aspect-square rounded-lg overflow-hidden bg-gray-800 relative group cursor-pointer">
            <img
              src={imageUrl}
              alt={photo.filename}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs truncate drop-shadow-md">{photo.filename}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
