import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Playlist } from './entities/playlist.entity';
import { Track } from './entities/track.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User, Playlist, Track],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
