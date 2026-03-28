import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1774719336270 implements MigrationInterface {
    name = 'InitialSchema1774719336270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "track" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "spotifyId" varchar NOT NULL, "name" varchar NOT NULL, "uri" varchar NOT NULL, CONSTRAINT "UQ_a7b080a0cbf4d1d9d22b2a41f62" UNIQUE ("spotifyId"))`);
        await queryRunner.query(`CREATE TABLE "playlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "spotifyId" varchar NOT NULL, "name" varchar NOT NULL, "ownerId" integer, CONSTRAINT "UQ_c6822e059411971fae3c0c2aa1b" UNIQUE ("spotifyId"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "spotifyId" varchar NOT NULL, "email" varchar, "display_name" varchar, "refresh_token" varchar, CONSTRAINT "UQ_c01af379ecdaf34b61a94785074" UNIQUE ("spotifyId"))`);
        await queryRunner.query(`CREATE TABLE "playlist_tracks_track" ("playlistId" integer NOT NULL, "trackId" integer NOT NULL, PRIMARY KEY ("playlistId", "trackId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_53e780b9e2955ef02466636cda" ON "playlist_tracks_track" ("playlistId") `);
        await queryRunner.query(`CREATE INDEX "IDX_54dd1e92dd268df3dcc0cbb643" ON "playlist_tracks_track" ("trackId") `);
        await queryRunner.query(`CREATE TABLE "temporary_playlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "spotifyId" varchar NOT NULL, "name" varchar NOT NULL, "ownerId" integer, CONSTRAINT "UQ_c6822e059411971fae3c0c2aa1b" UNIQUE ("spotifyId"), CONSTRAINT "FK_7947a56ee78e24cadf39bf38ebd" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_playlist"("id", "spotifyId", "name", "ownerId") SELECT "id", "spotifyId", "name", "ownerId" FROM "playlist"`);
        await queryRunner.query(`DROP TABLE "playlist"`);
        await queryRunner.query(`ALTER TABLE "temporary_playlist" RENAME TO "playlist"`);
        await queryRunner.query(`DROP INDEX "IDX_53e780b9e2955ef02466636cda"`);
        await queryRunner.query(`DROP INDEX "IDX_54dd1e92dd268df3dcc0cbb643"`);
        await queryRunner.query(`CREATE TABLE "temporary_playlist_tracks_track" ("playlistId" integer NOT NULL, "trackId" integer NOT NULL, CONSTRAINT "FK_53e780b9e2955ef02466636cda7" FOREIGN KEY ("playlistId") REFERENCES "playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_54dd1e92dd268df3dcc0cbb643c" FOREIGN KEY ("trackId") REFERENCES "track" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, PRIMARY KEY ("playlistId", "trackId"))`);
        await queryRunner.query(`INSERT INTO "temporary_playlist_tracks_track"("playlistId", "trackId") SELECT "playlistId", "trackId" FROM "playlist_tracks_track"`);
        await queryRunner.query(`DROP TABLE "playlist_tracks_track"`);
        await queryRunner.query(`ALTER TABLE "temporary_playlist_tracks_track" RENAME TO "playlist_tracks_track"`);
        await queryRunner.query(`CREATE INDEX "IDX_53e780b9e2955ef02466636cda" ON "playlist_tracks_track" ("playlistId") `);
        await queryRunner.query(`CREATE INDEX "IDX_54dd1e92dd268df3dcc0cbb643" ON "playlist_tracks_track" ("trackId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_54dd1e92dd268df3dcc0cbb643"`);
        await queryRunner.query(`DROP INDEX "IDX_53e780b9e2955ef02466636cda"`);
        await queryRunner.query(`ALTER TABLE "playlist_tracks_track" RENAME TO "temporary_playlist_tracks_track"`);
        await queryRunner.query(`CREATE TABLE "playlist_tracks_track" ("playlistId" integer NOT NULL, "trackId" integer NOT NULL, PRIMARY KEY ("playlistId", "trackId"))`);
        await queryRunner.query(`INSERT INTO "playlist_tracks_track"("playlistId", "trackId") SELECT "playlistId", "trackId" FROM "temporary_playlist_tracks_track"`);
        await queryRunner.query(`DROP TABLE "temporary_playlist_tracks_track"`);
        await queryRunner.query(`CREATE INDEX "IDX_54dd1e92dd268df3dcc0cbb643" ON "playlist_tracks_track" ("trackId") `);
        await queryRunner.query(`CREATE INDEX "IDX_53e780b9e2955ef02466636cda" ON "playlist_tracks_track" ("playlistId") `);
        await queryRunner.query(`ALTER TABLE "playlist" RENAME TO "temporary_playlist"`);
        await queryRunner.query(`CREATE TABLE "playlist" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "spotifyId" varchar NOT NULL, "name" varchar NOT NULL, "ownerId" integer, CONSTRAINT "UQ_c6822e059411971fae3c0c2aa1b" UNIQUE ("spotifyId"))`);
        await queryRunner.query(`INSERT INTO "playlist"("id", "spotifyId", "name", "ownerId") SELECT "id", "spotifyId", "name", "ownerId" FROM "temporary_playlist"`);
        await queryRunner.query(`DROP TABLE "temporary_playlist"`);
        await queryRunner.query(`DROP INDEX "IDX_54dd1e92dd268df3dcc0cbb643"`);
        await queryRunner.query(`DROP INDEX "IDX_53e780b9e2955ef02466636cda"`);
        await queryRunner.query(`DROP TABLE "playlist_tracks_track"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "playlist"`);
        await queryRunner.query(`DROP TABLE "track"`);
    }

}
