import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SpotifyService } from './spotify.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private readonly TARGET_PLAYLIST_ID = '1pJO26tWnsZRAfVl1hT5Dp';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly spotifyService: SpotifyService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Starting automated playlist update...');

    try {
      const users = await this.userRepository.find();
      if (users.length === 0) {
        this.logger.warn('No users found in database. Skipping.');
        return;
      }

      // uri -> { count, totalPosition }
      const trackMap = new Map<
        string,
        { count: number; totalPosition: number }
      >();
      let playlistOwnerToken: string | null = null;

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
            10,
          );

          topTracks.items.forEach((track, index) => {
            const current = trackMap.get(track.uri) || {
              count: 0,
              totalPosition: 0,
            };
            trackMap.set(track.uri, {
              count: current.count + 1,
              totalPosition: current.totalPosition + index,
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

        // Sort:
        // 1. By occurrence count (descending)
        // 2. By total position in top lists (ascending)
        const sortedTracks = Array.from(trackMap.entries())
          .sort((a, b) => {
            if (b[1].count !== a[1].count) {
              return b[1].count - a[1].count;
            }
            return a[1].totalPosition - b[1].totalPosition;
          })
          .map(([uri]) => uri);

        // Clear and replace playlist tracks
        await this.spotifyService.replacePlaylistTracks(
          playlistOwnerToken,
          this.TARGET_PLAYLIST_ID,
          sortedTracks,
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
}
