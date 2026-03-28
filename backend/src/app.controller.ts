import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Redirect,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as querystring from 'node:querystring';
import type { HttpRedirectResponse } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Track } from './entities/track.entity';
import { Repository } from 'typeorm';
import { SpotifyService } from './spotify.service';

@Controller()
export class AppController {
  private stateSet = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly spotifyService: SpotifyService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
  ) {}

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

    const data = await this.spotifyService.exchangeCode(code);
    const userData = await this.spotifyService.getUserInfo(data.access_token);

    // Upsert user in the database
    let user = await this.userRepository.findOne({
      where: { spotifyId: userData.id },
    });

    if (!user) {
      user = new User();
      user.spotifyId = userData.id;
    }

    user.email = userData.email;
    user.display_name = userData.display_name;
    user.refresh_token = data.refresh_token;

    await this.userRepository.save(user);

    const frontendUrl =
      this.configService.get('FRONTEND_CALLBACK_URL') ||
      'http://127.0.0.1:5173/auth/callback';
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

  @Get('/blacklist')
  async getBlacklist(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    const userData = await this.spotifyService.getUserInfo(token);
    const user = await this.userRepository.findOne({
      where: { spotifyId: userData.id },
      relations: ['blacklist'],
    });
    return user?.blacklist || [];
  }

  @Post('/blacklist')
  async addToBlacklist(
    @Headers('authorization') auth: string,
    @Body()
    trackData: {
      spotifyId: string;
      name: string;
      uri: string;
      artists: string;
      albumName: string;
      albumImageUrl: string;
      externalUrl: string;
    },
  ) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    const userData = await this.spotifyService.getUserInfo(token);
    const user = await this.userRepository.findOne({
      where: { spotifyId: userData.id },
      relations: ['blacklist'],
    });
    if (!user) throw new BadRequestException('User not found');

    let track = await this.trackRepository.findOne({
      where: { spotifyId: trackData.spotifyId },
    });
    if (!track) {
      track = this.trackRepository.create(trackData);
      await this.trackRepository.save(track);
    }

    if (!user.blacklist.find((t) => t.spotifyId === track.spotifyId)) {
      user.blacklist.push(track);
      await this.userRepository.save(user);
    }
    return user.blacklist;
  }

  @Delete('/blacklist/:spotifyId')
  async removeFromBlacklist(
    @Headers('authorization') auth: string,
    @Param('spotifyId') spotifyId: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();
    const userData = await this.spotifyService.getUserInfo(token);
    const user = await this.userRepository.findOne({
      where: { spotifyId: userData.id },
      relations: ['blacklist'],
    });
    if (!user) throw new BadRequestException('User not found');

    user.blacklist = user.blacklist.filter((t) => t.spotifyId !== spotifyId);
    await this.userRepository.save(user);
    return user.blacklist;
  }
}
