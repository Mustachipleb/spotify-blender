import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Playlist } from './playlist.entity';
import { Track } from './track.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  spotifyId: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  display_name: string;

  @Column({ nullable: true })
  refresh_token: string;

  @OneToMany(() => Playlist, (playlist) => playlist.owner)
  playlists: Playlist[];

  @ManyToMany(() => Track)
  @JoinTable({ name: 'user_blacklist' })
  blacklist: Track[];
}
