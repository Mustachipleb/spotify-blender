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

      const allTracksUris = new Set<string>();
      let playlistOwnerToken: string | null = null;

      for (const user of users) {
        try {
          this.logger.log(`Fetching top tracks for user: ${user.display_name}`);
          const tokenData = await this.spotifyService.refreshToken(
            user.refresh_token,
          );
          const accessToken = tokenData.access_token;

          // We'll use the first user we successfully refresh as the "executor" for the playlist update
          // In a real app, we might want to ensure this user has permissions for the specific playlist
          if (!playlistOwnerToken) {
            playlistOwnerToken = accessToken;
          }

          const topTracks = await this.spotifyService.getTopTracks(
            accessToken,
            10,
          );
          topTracks.items.forEach((track) => {
            allTracksUris.add(track.uri);
          });
        } catch (error) {
          this.logger.error(
            `Failed to process user ${user.display_name}: ${error.message}`,
          );
        }
      }

      if (allTracksUris.size > 0 && playlistOwnerToken) {
        this.logger.log(
          `Updating playlist with ${allTracksUris.size} unique tracks.`,
        );
        // Clear and replace playlist tracks
        await this.spotifyService.replacePlaylistTracks(
          playlistOwnerToken,
          this.TARGET_PLAYLIST_ID,
          Array.from(allTracksUris),
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
