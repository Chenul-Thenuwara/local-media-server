import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface SpotifyStatus {
  connected: boolean;
  accessToken?: string;
  displayName?: string;
  image?: string;
  product?: string;
}

export function useSpotifyAuth() {
  const [status, setStatus] = useState<SpotifyStatus>({ connected: false });
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/spotify/auth/me');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch Spotify status:', err);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Re-check status if we just returned from OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify') === 'connected') {
      fetchStatus();
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [fetchStatus]);

  const connect = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const tunnelUrl = localStorage.getItem('tunnelUrl') || '';
    window.location.href = `${tunnelUrl}/api/spotify/auth/login?token=${token}`;
  };

  const disconnect = async () => {
    try {
      await api.delete('/spotify/auth/logout');
      setStatus({ connected: false });
    } catch (err) {
      console.error('Failed to disconnect Spotify:', err);
    }
  };

  return {
    ...status,
    loading,
    connect,
    disconnect,
    refreshStatus: fetchStatus
  };
}
