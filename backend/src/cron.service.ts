import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SpotifyService } from './spotify.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private readonly TARGET_PLAYLIST_ID: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly spotifyService: SpotifyService,
    private readonly configService: ConfigService,
  ) {
    this.TARGET_PLAYLIST_ID =
      this.configService.get('TARGET_PLAYLIST_ID') || '1pJO26tWnsZRAfVl1hT5Dp';
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: process.env.TZ || 'UTC',
  })
  async handleCron() {
    this.logger.log('Starting automated playlist update...');

    try {
      const users = await this.userRepository.find({
        relations: ['blacklist'],
      });
      if (users.length === 0) {
        this.logger.warn('No users found in database. Skipping.');
        return;
      }

      // uri -> { count, bestPosition, artistId }
      const trackMap = new Map<
        string,
        { count: number; bestPosition: number; artistId: string }
      >();
      let playlistOwnerToken: string | null = null;

      const allBlacklistedUris = new Set<string>();
      for (const user of users) {
        user.blacklist.forEach((t) => allBlacklistedUris.add(t.uri));
      }

      for (const user of users) {
        try {
          this.logger.log(`Fetching top tracks for user: ${user.display_name}`);
          const tokenData = await this.spotifyService.refreshToken(
            user.refresh_token,
          );
          const accessToken = tokenData.access_token;

          // We'll use the first user we successfully refresh as the "executor" for the playlist update
          if (!playlistOwnerToken) {
            playlistOwnerToken = accessToken;
          }

          const topTracks = await this.spotifyService.getTopTracks(
            accessToken,
            25,
          );

          topTracks.items.forEach((track, index) => {
            if (allBlacklistedUris.has(track.uri)) {
              this.logger.log(
                `Skipping track ${track.name} - it is blacklisted by at least one user.`,
              );
              return;
            }
            const current = trackMap.get(track.uri) || {
              count: 0,
              bestPosition: Infinity,
              artistId: track.artists[0]?.id || 'unknown',
            };
            trackMap.set(track.uri, {
              count: current.count + 1,
              bestPosition: Math.min(current.bestPosition, index),
              artistId: current.artistId,
            });
          });
        } catch (error) {
          this.logger.error(
            `Failed to process user ${user.display_name}: ${error.message}`,
          );
        }
      }

      if (trackMap.size > 0 && playlistOwnerToken) {
        this.logger.log(
          `Updating playlist with ${trackMap.size} unique tracks.`,
        );

        // Sort strategy:
        // 1. By occurrence count (descending)
        // 2. By "artist rank" (ascending) - how many tracks of this artist we've already seen in this count tier
        // 3. By best position in top lists (ascending)
        const tracksWithData = Array.from(trackMap.entries()).map(
          ([uri, data]) => ({
            uri,
            ...data,
          }),
        );

        // First, sort by count and position as a baseline to assign artist ranks
        tracksWithData.sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return a.bestPosition - b.bestPosition;
        });

        const sortedTracks = this.sortTracks(tracksWithData, users.length);

        // Clear and replace playlist tracks
        await this.spotifyService.replacePlaylistTracks(
          playlistOwnerToken,
          this.TARGET_PLAYLIST_ID,
          sortedTracks.map((track) => track.uri),
        );
        this.logger.log('Playlist updated successfully.');
      } else {
        this.logger.warn(
          'No tracks collected or no valid token found. Playlist not updated.',
        );

        // Even if no tracks, we should probably clear it if that's the intention
        if (playlistOwnerToken) {
          this.logger.log('Clearing playlist as requested (PUT empty array).');
          await this.spotifyService.replacePlaylistTracks(
            playlistOwnerToken,
            this.TARGET_PLAYLIST_ID,
            [],
          );
        }
      }
    } catch (error) {
      this.logger.error(`Cron job failed: ${error.message}`);
    }
  }

  getTrackScore(count: number, bestPosition: number, userCount: number) {
    const baseScore = Math.log10(userCount) * 100;
    const trackUserCountScore = Math.round((count / userCount) * 100);

    // The lower the bestPosition, the higher the score. Maxes out relative to maxPosition
    const positionFactor = 2 * Math.pow(Math.E, -0.1 * bestPosition);

    return (baseScore + trackUserCountScore) * positionFactor;
  }

  sortTracks(
    tracks: {
      uri: string;
      count: number;
      bestPosition: number;
      artistId: string;
    }[],
    userCount: number,
  ) {
    const initialSet = tracks
      .map((t) => ({
        ...t,
        score: this.getTrackScore(t.count, t.bestPosition, userCount),
      }))
      .toSorted((a, b) => b.score - a.score);

    const previousTracks: {
      uri: string;
      count: number;
      bestPosition: number;
      artistId: string;
    }[] = [];
    for (const track of initialSet) {
      if (previousTracks.length === 0) {
        previousTracks.push(track);
        continue;
      }

      const previousTrack = previousTracks[previousTracks.length - 1];
      const hasNextTrack = previousTracks.length < initialSet.length - 1;
      if (hasNextTrack && previousTrack.artistId === track.artistId) {
        const nextTrack = initialSet[previousTracks.length + 1];
        track.score = nextTrack.score * 0.9;
      }

      if (previousTracks.some((t) => t.artistId === track.artistId)) {
        const amountOfSameArtists = previousTracks.filter(
          (t) => t.artistId === track.artistId,
        ).length;
        track.score = track.score * Math.pow(0.8, amountOfSameArtists);
      }
    }

    return initialSet.toSorted((a, b) => b.score - a.score);
  }
}
