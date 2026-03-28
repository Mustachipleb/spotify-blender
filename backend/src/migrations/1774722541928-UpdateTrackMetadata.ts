import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTrackMetadata1774722541928 implements MigrationInterface {
    name = 'UpdateTrackMetadata1774722541928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_track" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "spotifyId" varchar NOT NULL, "name" varchar NOT NULL, "uri" varchar NOT NULL, "artists" varchar, "albumName" varchar, "albumImageUrl" varchar, "externalUrl" varchar, CONSTRAINT "UQ_a7b080a0cbf4d1d9d22b2a41f62" UNIQUE ("spotifyId"))`);
        await queryRunner.query(`INSERT INTO "temporary_track"("id", "spotifyId", "name", "uri") SELECT "id", "spotifyId", "name", "uri" FROM "track"`);
        await queryRunner.query(`DROP TABLE "track"`);
        await queryRunner.query(`ALTER TABLE "temporary_track" RENAME TO "track"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "track" RENAME TO "temporary_track"`);
        await queryRunner.query(`CREATE TABLE "track" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "spotifyId" varchar NOT NULL, "name" varchar NOT NULL, "uri" varchar NOT NULL, CONSTRAINT "UQ_a7b080a0cbf4d1d9d22b2a41f62" UNIQUE ("spotifyId"))`);
        await queryRunner.query(`INSERT INTO "track"("id", "spotifyId", "name", "uri") SELECT "id", "spotifyId", "name", "uri" FROM "temporary_track"`);
        await queryRunner.query(`DROP TABLE "temporary_track"`);
    }

}
