import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiUsage1795479802982 implements MigrationInterface {
  name = 'AddAiUsage1795479802982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ai_usage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "date" date NOT NULL, "count" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_8e36c687d8b8859c62a6f9cb132" UNIQUE ("userId", "date"), CONSTRAINT "PK_3dddab3a15520a9c3eba859195d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" ADD CONSTRAINT "FK_78dc7868aa4f86176b5b7c4395c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_usage" DROP CONSTRAINT "FK_78dc7868aa4f86176b5b7c4395c"`,
    );
    await queryRunner.query(`DROP TABLE "ai_usage"`);
  }
}
