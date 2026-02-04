
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Loader2, Image as ImageIcon, Lock } from 'lucide-react';
import api from '../../lib/api';

interface GoogleMediaItem {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
}

const GooglePhotos = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [photos, setPhotos] = useState<GoogleMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      // Try to fetch albums or media to check valid token
      // If 401/403, we are not connected.
      // For now, let's just fetch media.
      const res = await api.get('/google-photos/media');
      setPhotos(res.data);
      setIsConnected(true);
    } catch (err) {
      // Not connected or token expired
      setIsConnected(false);
      fetchAuthUrl();
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthUrl = async () => {
    try {
      const res = await api.get('/google-photos/auth/url');
      setAuthUrl(res.data.url);
    } catch (err) {
      console.error('Failed to get auth url', err);
    }
  };

  const handleConnect = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-apple-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 pb-20 h-full overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <ImageIcon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Google Photos</h1>
          <p className="text-gray-400 text-sm mt-1">View your cloud memories</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Lock size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Google Photos</h2>
          <p className="text-gray-400 max-w-md mb-8">
            Link your Google account to access your photos and albums directly within the dashboard.
          </p>
          <Button onClick={handleConnect} className="bg-white text-black hover:bg-gray-200">
            Connect Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-800 relative group">
              <img
                src={photo.baseUrl}
                alt={photo.filename}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
          {photos.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-10">No photos found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GooglePhotos;
