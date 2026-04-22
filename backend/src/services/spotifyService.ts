import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '005eba4dc9364770a51dd8bd47903ed6';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'c7ee6ab0d021406ea514cca1076d340d';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  cachedToken = res.data.access_token;
  tokenExpiresAt = Date.now() + (res.data.expires_in - 60) * 1000;
  return cachedToken!;
}

export function invalidateToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

export async function searchTrack(title: string, artist?: string) {
  try {
    const token = await getAccessToken();
    const query = artist ? `track:${title} artist:${artist}` : title;
    const res = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: 'track', limit: 1 },
    });

    const track = res.data.tracks?.items?.[0];
    if (!track) return null;

    return {
      spotifyTrackId: track.id,
      spotifyAlbumArt: track.album?.images?.[0]?.url || null,
      spotifyArtistImage: null, // Need separate artist call
      album: track.album?.name,
      genres: [] as string[],
      releaseDate: track.album?.release_date,
      durationMs: track.duration_ms,
      popularity: track.popularity,
      previewUrl: track.preview_url,
    };
  } catch {
    return null;
  }
}

export async function searchArtist(name: string) {
  try {
    const token = await getAccessToken();
    const res = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: `artist:${name}`, type: 'artist', limit: 1 },
    });

    const artist = res.data.artists?.items?.[0];
    if (!artist) return null;

    return {
      spotifyArtistId: artist.id,
      image: artist.images?.[0]?.url || null,
      genres: artist.genres,
      popularity: artist.popularity,
    };
  } catch {
    return null;
  }
}

export async function getSpotifyToken(): Promise<string> {
  return getAccessToken();
}
