import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Playlist } from './playlist.entity';

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
}
