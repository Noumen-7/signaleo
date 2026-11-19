/*
  Warnings:

  - The values [TEMOIN] on the enum `AuthorOrigin` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuthorOrigin_new" AS ENUM ('VICTIME', 'PARENT');
ALTER TABLE "public"."Report" ALTER COLUMN "authorOrigin" DROP DEFAULT;
ALTER TABLE "Report" ALTER COLUMN "authorOrigin" TYPE "AuthorOrigin_new" USING ("authorOrigin"::text::"AuthorOrigin_new");
ALTER TYPE "AuthorOrigin" RENAME TO "AuthorOrigin_old";
ALTER TYPE "AuthorOrigin_new" RENAME TO "AuthorOrigin";
DROP TYPE "public"."AuthorOrigin_old";
ALTER TABLE "Report" ALTER COLUMN "authorOrigin" SET DEFAULT 'VICTIME';
COMMIT;
