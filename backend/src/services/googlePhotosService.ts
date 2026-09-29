import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

class GooglePhotosService {
  constructor() {}

  getOAuthClient(): OAuth2Client {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUri = `${frontendUrl}/google-callback`;
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  }

  getClientForRefreshToken(refreshToken: string): OAuth2Client {
    const client = this.getOAuthClient();
    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  generateAuthUrl() {
    return this.getOAuthClient().generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/photoslibrary',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
        'email'
      ],
      prompt: 'consent' // Force refresh token
    });
  }

  async authenticate(code: string) {
    const client = this.getOAuthClient();
    const { tokens } = await client.getToken(code);
    return tokens;
  }

  async listAlbums(client: OAuth2Client) {
    try {
      const url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=50';
      const res = await client.request({ url });
      return (res.data as any).albums || [];
    } catch (error) {
      console.error('Error listing albums:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async listMediaItems(client: OAuth2Client, albumId?: string, filter?: 'PHOTO' | 'VIDEO') {
    try {
      let url = 'https://photoslibrary.googleapis.com/v1/mediaItems';
      let method = 'GET';
      let data: any = undefined;

      if (albumId || filter) {
        url = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
        method = 'POST';
        data = {
          pageSize: 100,
          albumId: albumId,
          filters: filter ? {
            mediaTypeFilter: {
              mediaTypes: [filter]
            }
          } : undefined
        };
      } else {
        url = 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100';
      }

      const res = await client.request({ url, method, data });
      return (res.data as any).mediaItems || [];
    } catch (error) {
      console.error('Error listing media items:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

export default new GooglePhotosService();
