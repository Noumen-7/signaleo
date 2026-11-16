-- CreateEnum
CREATE TYPE "AuthorOrigin" AS ENUM ('VICTIME', 'PARENT');

-- AlterTable Report : origine déclarée au dépôt
ALTER TABLE "Report" ADD COLUMN "authorOrigin" "AuthorOrigin" NOT NULL DEFAULT 'VICTIME';

-- AlterTable StaffUser : secret TOTP
ALTER TABLE "StaffUser" ADD COLUMN "totpSecret" TEXT;

-- CreateTable InternalNote
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "contentEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalNote_reportId_idx" ON "InternalNote"("reportId");

ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
