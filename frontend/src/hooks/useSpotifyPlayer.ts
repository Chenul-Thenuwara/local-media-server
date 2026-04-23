import { useState, useEffect, useCallback } from 'react';

interface SpotifyPlayerState {
  position: number;
  duration: number;
  paused: boolean;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
      album: { name: string; images: { url: string }[] };
      artists: { name: string }[];
    };
  };
}

interface SpotifyPlayer {
  addListener(event: string, callback: (data: unknown) => void): void;
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: { name: string; getOAuthToken: (cb: (token: string) => void) => void; volume: number }) => SpotifyPlayer;
    };
  }
}

export function useSpotifyPlayer(accessToken: string | undefined) {
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<{
    position: number;
    duration: number;
    paused: boolean;
    track: {
      id: string;
      uri: string;
      name: string;
      album: { name: string; images: { url: string }[] };
      artists: { name: string }[];
    };
  } | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const scriptId = 'spotify-player-sdk';
    
    const initPlayer = () => {
      if (window.Spotify) {
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
          setDeviceId(null);
        });

        spPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
          setError(message);
        });
        spPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
          setError(message);
        });
        spPlayer.addListener('account_error', () => {
          setError('Spotify Premium is required for playback.');
        });

        spPlayer.addListener('player_state_changed', (state: unknown) => {
          if (!state) return;
          const s = state as SpotifyPlayerState;
          setPlaybackState({
            position: s.position,
            duration: s.duration,
            paused: s.paused,
            track: s.track_window.current_track,
          });
        });

        spPlayer.connect();
        setPlayer(spPlayer);
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    } else if (window.Spotify) {
      initPlayer();
    }

    return () => {
      if (player) {
         try {
           player.disconnect();
         } catch (e) {
           console.error('Error disconnecting Spotify player:', e);
         }
      }
    };
  }, [accessToken, player]); // Added player back to dependencies but it should be fine with initPlayer guard

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
