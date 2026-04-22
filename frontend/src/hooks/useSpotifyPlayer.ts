import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export function useSpotifyPlayer(accessToken: string | undefined) {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const scriptId = 'spotify-player-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spPlayer = new window.Spotify.Player({
        name: 'LMS - Media Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      spPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify Player Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      spPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      spPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
        setError(message);
      });
      spPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        setError(message);
      });
      spPlayer.addListener('account_error', ({ message }: { message: string }) => {
        setError('Spotify Premium is required for playback.');
      });

      spPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setPlaybackState({
          position: state.position,
          duration: state.duration,
          paused: state.paused,
          track: state.track_window.current_track,
        });
      });

      spPlayer.connect();
      setPlayer(spPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken, player]);

  const [playbackState, setPlaybackState] = useState<{
    position: number;
    duration: number;
    paused: boolean;
    track: any;
  } | null>(null);

  const playTrack = useCallback(async (trackUri: string) => {
    if (!deviceId || !accessToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [trackUri] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      console.error('Failed to play Spotify track:', err);
    }
  }, [deviceId, accessToken]);

  const togglePlay = useCallback(async () => {
    if (player) {
      player.togglePlay();
    }
  }, [player]);

  const seek = useCallback(async (positionMs: number) => {
    if (player) {
      player.seek(positionMs);
    }
  }, [player]);

  const setVolume = useCallback(async (volume: number) => {
    if (player) {
      player.setVolume(volume);
    }
  }, [player]);

  return { player, deviceId, isReady, error, playTrack, togglePlay, seek, setVolume, playbackState };
}
