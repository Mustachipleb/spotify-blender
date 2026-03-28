import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { User } from './entities/user.entity';
import { Playlist } from './entities/playlist.entity';
import { Track } from './entities/track.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Playlist, Track],
      synchronize: true, // Only for development!
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
