-- AlterEnum
ALTER TYPE "AuthorOrigin" ADD VALUE 'TEMOIN';

-- AlterTable
ALTER TABLE "StaffUser" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "createdById" TEXT,
ALTER COLUMN "active" SET DEFAULT false;
