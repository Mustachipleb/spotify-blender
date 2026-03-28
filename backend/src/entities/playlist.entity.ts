import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Track } from './track.entity';

@Entity()
export class Playlist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  spotifyId: string;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.playlists)
  owner: User;

  @ManyToMany(() => Track, (track) => track.playlists)
  @JoinTable()
  tracks: Track[];
}
