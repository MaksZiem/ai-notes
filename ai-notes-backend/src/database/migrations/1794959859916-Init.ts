import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1794959859916 implements MigrationInterface {
    name = 'Init1794959859916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."project_member_accesslevel_enum" AS ENUM('VIEW', 'EDIT', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "project_member" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "projectId" integer NOT NULL, "accessLevel" "public"."project_member_accesslevel_enum" NOT NULL DEFAULT 'VIEW', CONSTRAINT "UQ_1f95533c37d5a7215c796d6ac9f" UNIQUE ("userId", "projectId"), CONSTRAINT "PK_64dba8e9dcf96ce383cfd19d6fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."note_member_accesslevel_enum" AS ENUM('VIEW', 'EDIT', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "note_member" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "noteId" integer NOT NULL, "accessLevel" "public"."note_member_accesslevel_enum" NOT NULL DEFAULT 'VIEW', CONSTRAINT "UQ_a492f93f27c2657c20ec0e593c2" UNIQUE ("userId", "noteId"), CONSTRAINT "PK_ca3bbea040cc161ad5cdc068c00" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" text, "keywords" text, "color" character varying, "projectId" integer, "ownerId" integer NOT NULL, "embedding" jsonb, "yjsState" bytea, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_96d0c172a4fba276b1bbed43058" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "color" character varying, "ownerId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "surname" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'USER', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_project_preference" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "projectId" integer NOT NULL, "isPinned" boolean NOT NULL DEFAULT false, "isFavourite" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_a8ea2f6f902a05c1ea7cb368743" UNIQUE ("userId", "projectId"), CONSTRAINT "PK_c471a2db2e548e36970e44f02f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."project_share_link_accesslevel_enum" AS ENUM('VIEW', 'EDIT', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "project_share_link" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "projectId" integer NOT NULL, "accessLevel" "public"."project_share_link_accesslevel_enum" NOT NULL DEFAULT 'VIEW', "email" character varying, "expiresAt" TIMESTAMP, "revoked" boolean NOT NULL DEFAULT false, "createdByUserId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9213caf1db7968d3d724bc7aef8" UNIQUE ("token"), CONSTRAINT "PK_63eae345188260f1e1e87c6d1a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."note_share_link_accesslevel_enum" AS ENUM('VIEW', 'EDIT', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "note_share_link" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "noteId" integer NOT NULL, "accessLevel" "public"."note_share_link_accesslevel_enum" NOT NULL DEFAULT 'VIEW', "email" character varying, "expiresAt" TIMESTAMP, "revoked" boolean NOT NULL DEFAULT false, "createdByUserId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8d8b834537ee829fd8f5580d467" UNIQUE ("token"), CONSTRAINT "PK_4db6a0862486681f3c73a0756ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('NOTE_SHARED', 'NOTE_ACCESS_REVOKED', 'SHARE_LINK_CLAIMED', 'NOTE_INVITE', 'PROJECT_SHARED', 'PROJECT_ACCESS_REVOKED', 'PROJECT_SHARE_LINK_CLAIMED', 'PROJECT_INVITE')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_accesslevel_enum" AS ENUM('VIEW', 'EDIT', 'DELETE')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "type" "public"."notification_type_enum" NOT NULL, "actorId" integer, "noteId" integer, "projectId" integer, "accessLevel" "public"."notification_accesslevel_enum", "shareLinkId" integer, "projectShareLinkId" integer, "status" "public"."notification_status_enum", "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_note_preference" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "noteId" integer NOT NULL, "isPinned" boolean NOT NULL DEFAULT false, "isFavourite" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_412b071d54ba4ca5c3ea8a7cc6a" UNIQUE ("userId", "noteId"), CONSTRAINT "PK_7308133b54a1493290b37374e6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "project_member" ADD CONSTRAINT "FK_e7520163dafa7c1104fd672caad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_member" ADD CONSTRAINT "FK_7115f82a61e31ac95b2681d83e4" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_member" ADD CONSTRAINT "FK_c3655fc09ef9dad13e6df43a928" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_member" ADD CONSTRAINT "FK_60480f363b129e3babe852bc669" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_62eff03c08cd08ac0cde9bf4c0d" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_b09836eba01a8653c0628a78af8" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_9884b2ee80eb70b7db4f12e8aed" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_project_preference" ADD CONSTRAINT "FK_5e8820032627a2f2d7dab34c466" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_project_preference" ADD CONSTRAINT "FK_8c2e7536bab135639b69bee7b49" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_share_link" ADD CONSTRAINT "FK_09dabc238ad99dd44a2f9752739" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_share_link" ADD CONSTRAINT "FK_ea10ff16d83c4a0287d7e43339a" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_c5133a026bd1b3d9feccac1a234" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_769cb6b73a1efe22ddf733ac453" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_28a43a0b8c114e48b5bb002dc22" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_92d2379c3ac50ff645fc52e66e5" FOREIGN KEY ("shareLinkId") REFERENCES "note_share_link"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_a93a573c381bc52a9aa7d4aae1a" FOREIGN KEY ("projectShareLinkId") REFERENCES "project_share_link"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_note_preference" ADD CONSTRAINT "FK_75306def72dd517e83bdfcd6fed" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_note_preference" ADD CONSTRAINT "FK_c9bbcb7cf0ce43160392b0c4a2b" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_note_preference" DROP CONSTRAINT "FK_c9bbcb7cf0ce43160392b0c4a2b"`);
        await queryRunner.query(`ALTER TABLE "user_note_preference" DROP CONSTRAINT "FK_75306def72dd517e83bdfcd6fed"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_a93a573c381bc52a9aa7d4aae1a"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_92d2379c3ac50ff645fc52e66e5"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_28a43a0b8c114e48b5bb002dc22"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_769cb6b73a1efe22ddf733ac453"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_c5133a026bd1b3d9feccac1a234"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "note_share_link" DROP CONSTRAINT "FK_ea10ff16d83c4a0287d7e43339a"`);
        await queryRunner.query(`ALTER TABLE "project_share_link" DROP CONSTRAINT "FK_09dabc238ad99dd44a2f9752739"`);
        await queryRunner.query(`ALTER TABLE "user_project_preference" DROP CONSTRAINT "FK_8c2e7536bab135639b69bee7b49"`);
        await queryRunner.query(`ALTER TABLE "user_project_preference" DROP CONSTRAINT "FK_5e8820032627a2f2d7dab34c466"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_9884b2ee80eb70b7db4f12e8aed"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_b09836eba01a8653c0628a78af8"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_62eff03c08cd08ac0cde9bf4c0d"`);
        await queryRunner.query(`ALTER TABLE "note_member" DROP CONSTRAINT "FK_60480f363b129e3babe852bc669"`);
        await queryRunner.query(`ALTER TABLE "note_member" DROP CONSTRAINT "FK_c3655fc09ef9dad13e6df43a928"`);
        await queryRunner.query(`ALTER TABLE "project_member" DROP CONSTRAINT "FK_7115f82a61e31ac95b2681d83e4"`);
        await queryRunner.query(`ALTER TABLE "project_member" DROP CONSTRAINT "FK_e7520163dafa7c1104fd672caad"`);
        await queryRunner.query(`DROP TABLE "user_note_preference"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_accesslevel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP TABLE "note_share_link"`);
        await queryRunner.query(`DROP TYPE "public"."note_share_link_accesslevel_enum"`);
        await queryRunner.query(`DROP TABLE "project_share_link"`);
        await queryRunner.query(`DROP TYPE "public"."project_share_link_accesslevel_enum"`);
        await queryRunner.query(`DROP TABLE "user_project_preference"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "project"`);
        await queryRunner.query(`DROP TABLE "note"`);
        await queryRunner.query(`DROP TABLE "note_member"`);
        await queryRunner.query(`DROP TYPE "public"."note_member_accesslevel_enum"`);
        await queryRunner.query(`DROP TABLE "project_member"`);
        await queryRunner.query(`DROP TYPE "public"."project_member_accesslevel_enum"`);
    }

}
