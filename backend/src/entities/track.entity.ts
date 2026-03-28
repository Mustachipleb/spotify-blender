import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Playlist } from './playlist.entity';

@Entity()
export class Track {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  spotifyId: string;

  @Column()
  name: string;

  @Column()
  uri: string;

  @ManyToMany(() => Playlist, (playlist) => playlist.tracks)
  playlists: Playlist[];
}
