-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('HARCELEMENT_PHYSIQUE', 'HARCELEMENT_VERBAL', 'CYBERHARCELEMENT', 'INTIMIDATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "Gravity" AS ENUM ('FAIBLE', 'MOYENNE', 'ELEVEE', 'URGENTE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NOUVEAU', 'EN_COURS', 'TRAITE', 'CLOS');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('RESPONSABLE', 'ADMIN');

-- CreateEnum
CREATE TYPE "MessageAuthor" AS ENUM ('ELEVE', 'PARENT', 'STAFF');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "trackingCodeHash" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "gravity" "Gravity" NOT NULL DEFAULT 'MOYENNE',
    "status" "ReportStatus" NOT NULL DEFAULT 'NOUVEAU',
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "lieuEnc" TEXT NOT NULL,
    "personnesEnc" TEXT NOT NULL,
    "descriptionEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "author" "MessageAuthor" NOT NULL,
    "contentEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'RESPONSABLE',
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "staffId" TEXT,
    "reportId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_trackingCodeHash_key" ON "Report"("trackingCodeHash");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE INDEX "Report_gravity_idx" ON "Report"("gravity");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Message_reportId_idx" ON "Message"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
