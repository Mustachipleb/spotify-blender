import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class SpotifyService {
  private readonly client_id: string;
  private readonly client_secret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.client_id = this.configService.getOrThrow('SPOTIFY_CLIENT_ID');
    this.client_secret = this.configService.getOrThrow('SPOTIFY_CLIENT_SECRET');
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    refresh_token?: string;
  }> {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', refreshToken);

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          'https://accounts.spotify.com/api/token',
          formData.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization:
                'Basic ' +
                Buffer.from(this.client_id + ':' + this.client_secret).toString(
                  'base64',
                ),
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to refresh Spotify token:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to refresh Spotify token');
    }
  }

  async exchangeCode(code: string): Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token: string;
  }> {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append(
      'redirect_uri',
      this.configService.getOrThrow('URL') + '/callback',
    );

    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.post(
          'https://accounts.spotify.com/api/token',
          formData.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization:
                'Basic ' +
                Buffer.from(this.client_id + ':' + this.client_secret).toString(
                  'base64',
                ),
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error(
        'Failed to exchange code for token:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to exchange code for token',
      );
    }
  }

  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    display_name: string;
  }> {
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.get('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch user data:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch user data');
    }
  }

  async getTopTracks(
    accessToken: string,
    limit: number = 10,
  ): Promise<{ items: any[] }> {
    try {
      const response: AxiosResponse = await lastValueFrom(
        this.httpService.get('https://api.spotify.com/v1/me/top/tracks', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            limit: limit,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error(
        'Failed to fetch top tracks:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch top tracks');
    }
  }

  async replacePlaylistTracks(
    accessToken: string,
    playlistId: string,
    uris: string[],
  ): Promise<void> {
    try {
      await lastValueFrom(
        this.httpService.put(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          { uris },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (error) {
      console.error(
        'Failed to replace playlist tracks:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to replace playlist tracks',
      );
    }
  }

  async addTracksToPlaylist(
    accessToken: string,
    playlistId: string,
    uris: string[],
  ): Promise<void> {
    try {
      await lastValueFrom(
        this.httpService.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          { uris },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (error) {
      console.error(
        'Failed to add tracks to playlist:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to add tracks to playlist',
      );
    }
  }
}
