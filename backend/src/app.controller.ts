import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Query,
  Redirect,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as querystring from 'node:querystring';
import type { HttpRedirectResponse } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import type { AxiosResponse } from 'axios';

@Controller()
export class AppController {
  private readonly client_id!: string;
  private readonly client_secret!: string;

  private stateSet = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.client_id = this.configService.getOrThrow('SPOTIFY_CLIENT_ID');
    this.client_secret = this.configService.getOrThrow('SPOTIFY_CLIENT_SECRET');
  }

  @Get('/login')
  @Redirect()
  login(): HttpRedirectResponse {
    // random string
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    this.stateSet.add(state);
    return {
      url:
        'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
          response_type: 'code',
          client_id: this.configService.getOrThrow('SPOTIFY_CLIENT_ID'),
          scope:
            'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private',
          redirect_uri: this.configService.getOrThrow('AUTH_CODE_REDIRECT_URL'),
          state: state,
        }),
      statusCode: 302,
    };
  }

  @Get('/callback')
  @Redirect()
  async callback(
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Query('state') state: string,
  ): Promise<HttpRedirectResponse> {
    if (this.stateSet.has(state)) {
      this.stateSet.delete(state);
    } else {
      throw new BadRequestException('Invalid state');
    }

    if (error || !code) {
      throw new BadRequestException(error);
    }

    const formData = new URLSearchParams();

    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append(
      'redirect_uri',
      this.configService.getOrThrow('AUTH_CODE_REDIRECT_URL'),
    );

    let response: AxiosResponse<{
      access_token: string;
      token_type: string;
      scope: string;
      expires_in: number;
      refresh_token: string;
    }>;
    try {
      response = await lastValueFrom(
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
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to exchange code for token',
      );
    }

    const data = response.data;
    const frontendUrl = 'http://localhost:5173/auth/callback'; // Default vite port for RR
    const query = querystring.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });

    return {
      url: `${frontendUrl}?${query}`,
      statusCode: 302,
    };
  }
}
