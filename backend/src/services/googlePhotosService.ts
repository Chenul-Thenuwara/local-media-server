
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

class GooglePhotosService {
  private oauth2Client: OAuth2Client | null = null;

  constructor() { }

  private getClient(): OAuth2Client {
    if (!this.oauth2Client) {
      const redirectUri = 'http://localhost:5173/google-callback';
      console.log('Initializing Google OAuth2 with Redirect URI:', redirectUri);
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );
    }
    return this.oauth2Client;
  }

  generateAuthUrl() {
    return this.getClient().generateAuthUrl({
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
    const client = this.getClient();
    const { tokens } = await client.getToken(code);
    console.log('--- TOKENS RECEIVED ---');
    console.log('Refresh Token:', !!tokens.refresh_token);
    console.log('Access Token:', !!tokens.access_token);
    console.log('Scope:', tokens.scope);
    console.log('-----------------------');
    client.setCredentials(tokens);
    return tokens;
  }

  setCredentials(tokens: any) {
    this.getClient().setCredentials(tokens);
  }

  async listAlbums() {
    try {
      const url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=50';
      const res = await this.getClient().request({ url });
      return (res.data as any).albums || [];
    } catch (error) {
      console.error('Error listing albums:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async listMediaItems(albumId?: string, filter?: 'PHOTO' | 'VIDEO') {
    try {
      let url = 'https://photoslibrary.googleapis.com/v1/mediaItems';
      let method = 'GET';
      let data: any = undefined;

      // If we need to search (albumId or filters), we must use :search endpoint via POST
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
        // Standard list
        url = 'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100';
      }

      const res = await this.getClient().request({ url, method, data });
      return (res.data as any).mediaItems || [];
    } catch (error) {
      console.error('Error listing media items:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

export default new GooglePhotosService();
