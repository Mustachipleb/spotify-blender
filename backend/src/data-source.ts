import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Playlist } from './entities/playlist.entity';
import { Track } from './entities/track.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_PATH || 'database.sqlite',
  entities: [User, Playlist, Track],
  migrations: [__dirname + '/migrations/*.js'],
  synchronize: false,
});
