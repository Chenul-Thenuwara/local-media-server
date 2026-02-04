
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Lock, Image } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api';

interface GoogleMediaItem {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
}

interface GoogleMediaGridProps {
  filter?: 'PHOTO' | 'VIDEO';
}

export function GoogleMediaGrid({ filter }: GoogleMediaGridProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [media, setMedia] = useState<GoogleMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAuthUrl = useCallback(async () => {
    try {
      const res = await api.get('/google-photos/auth/url');
      setAuthUrl(res.data.url);
    } catch (error) {
      console.error('Failed to get auth url', error);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/google-photos/media${filter ? `?filter=${filter}` : ''}`);
      setMedia(res.data);
      setIsConnected(true);
      setErrorMsg('');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setIsConnected(false);
      setErrorMsg(error.response?.data?.error || error.message || 'Unknown error');
      fetchAuthUrl();
    } finally {
      setLoading(false);
    }
  }, [filter, fetchAuthUrl]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-apple-blue" size={32} />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-xl border border-white/10">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
          <Lock size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Connect Google Photos</h2>

        {errorMsg && (
          <div className="mb-4 p-2 bg-red-500/20 text-red-400 text-xs rounded font-mono max-w-xs break-all">
            Error: {errorMsg}
          </div>
        )}

        <p className="text-gray-400 max-w-sm mb-6 text-sm">
          Link your Google account to access your cloud {filter === 'VIDEO' ? 'videos' : 'photos'} directly here.
        </p>
        <Button onClick={() => window.location.href = authUrl} className="bg-white text-black hover:bg-gray-200">
          Connect Account
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {media.map((item) => (
        <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-gray-800 relative group">
          <img
            src={item.baseUrl}
            alt={item.filename}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          {item.mimeType?.startsWith('video/') && (
            <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs">Video</div>
          )}
        </div>
      ))}
      {media.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
          <Image size={40} className="mb-4 opacity-50" />
          <p>No {filter === 'VIDEO' ? 'videos' : 'photos'} found.</p>
        </div>
      )}
    </div>
  );
}
