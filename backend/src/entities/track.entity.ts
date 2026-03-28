import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Playlist } from './playlist.entity';
import { User } from './user.entity';

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

  @Column({ nullable: true })
  artists: string;

  @Column({ nullable: true })
  albumName: string;

  @Column({ nullable: true })
  albumImageUrl: string;

  @Column({ nullable: true })
  externalUrl: string;

  @ManyToMany(() => Playlist, (playlist) => playlist.tracks)
  playlists: Playlist[];

  @ManyToMany(() => User, (user) => user.blacklist)
  blacklistedBy: User[];
}
