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

    // Check if we just returned from OAuth (either in main window or popup)
    const params = new URLSearchParams(window.location.search);
    const spotifyParam = params.get('spotify');
    
    if (spotifyParam === 'connected' || spotifyParam === 'error' || spotifyParam === 'denied') {
      if (window.opener) {
        // We are inside the popup window! Close it immediately.
        window.close();
      } else {
        // We are in the main window (fallback if popup wasn't used)
        fetchStatus();
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [fetchStatus]);

  const connect = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const tunnelUrl = localStorage.getItem('tunnelUrl') || '';
    const loginUrl = `${tunnelUrl}/api/spotify/auth/login?token=${token}`;
    
    // In Electron, main.js will intercept this window.open and redirect it to the user's default OS browser
    window.open(loginUrl, '_blank');

    // Start polling the backend to see when the user finishes logging in
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get('/spotify/auth/me');
        if (res.data.connected) {
          setStatus(res.data);
          clearInterval(timer);
        }
      } catch (err) {
        // ignore errors during polling
      }

      // Stop polling after 5 minutes (150 attempts * 2s)
      if (attempts >= 150) {
        clearInterval(timer);
      }
    }, 2000);
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
