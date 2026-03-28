import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlacklist1774722300228 implements MigrationInterface {
    name = 'AddBlacklist1774722300228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_blacklist" ("userId" integer NOT NULL, "trackId" integer NOT NULL, PRIMARY KEY ("userId", "trackId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_19036e4c61e4271b59ea49caee" ON "user_blacklist" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b14ccc3140614fffd192874f9" ON "user_blacklist" ("trackId") `);
        await queryRunner.query(`DROP INDEX "IDX_19036e4c61e4271b59ea49caee"`);
        await queryRunner.query(`DROP INDEX "IDX_0b14ccc3140614fffd192874f9"`);
        await queryRunner.query(`CREATE TABLE "temporary_user_blacklist" ("userId" integer NOT NULL, "trackId" integer NOT NULL, CONSTRAINT "FK_19036e4c61e4271b59ea49caee1" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_0b14ccc3140614fffd192874f9d" FOREIGN KEY ("trackId") REFERENCES "track" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("userId", "trackId"))`);
        await queryRunner.query(`INSERT INTO "temporary_user_blacklist"("userId", "trackId") SELECT "userId", "trackId" FROM "user_blacklist"`);
        await queryRunner.query(`DROP TABLE "user_blacklist"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_blacklist" RENAME TO "user_blacklist"`);
        await queryRunner.query(`CREATE INDEX "IDX_19036e4c61e4271b59ea49caee" ON "user_blacklist" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b14ccc3140614fffd192874f9" ON "user_blacklist" ("trackId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_0b14ccc3140614fffd192874f9"`);
        await queryRunner.query(`DROP INDEX "IDX_19036e4c61e4271b59ea49caee"`);
        await queryRunner.query(`ALTER TABLE "user_blacklist" RENAME TO "temporary_user_blacklist"`);
        await queryRunner.query(`CREATE TABLE "user_blacklist" ("userId" integer NOT NULL, "trackId" integer NOT NULL, PRIMARY KEY ("userId", "trackId"))`);
        await queryRunner.query(`INSERT INTO "user_blacklist"("userId", "trackId") SELECT "userId", "trackId" FROM "temporary_user_blacklist"`);
        await queryRunner.query(`DROP TABLE "temporary_user_blacklist"`);
        await queryRunner.query(`CREATE INDEX "IDX_0b14ccc3140614fffd192874f9" ON "user_blacklist" ("trackId") `);
        await queryRunner.query(`CREATE INDEX "IDX_19036e4c61e4271b59ea49caee" ON "user_blacklist" ("userId") `);
        await queryRunner.query(`DROP INDEX "IDX_0b14ccc3140614fffd192874f9"`);
        await queryRunner.query(`DROP INDEX "IDX_19036e4c61e4271b59ea49caee"`);
        await queryRunner.query(`DROP TABLE "user_blacklist"`);
    }

}
