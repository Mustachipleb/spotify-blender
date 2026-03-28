import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { User } from './entities/user.entity';
import { Playlist } from './entities/playlist.entity';
import { Track } from './entities/track.entity';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { SpotifyService } from './spotify.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DATABASE_PATH') || 'database.sqlite',
        entities: [User, Playlist, Track],
        synchronize: configService.get('NODE_ENV') === 'development',
        migrations: ['dist/migrations/*.js'],
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Playlist, Track]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [CronService, SpotifyService],
})
export class AppModule {}
