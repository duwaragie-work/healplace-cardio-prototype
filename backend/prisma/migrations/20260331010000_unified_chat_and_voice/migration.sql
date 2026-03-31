-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ScheduledCall" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "callDate" TEXT NOT NULL,
    "callTime" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "notes" TEXT,
    "status" "CallStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledCall_userId_status_idx" ON "ScheduledCall"("userId", "status");

-- CreateIndex
CREATE INDEX "ScheduledCall_status_callDate_idx" ON "ScheduledCall"("status", "callDate");

-- CreateIndex
CREATE INDEX "ScheduledCall_alertId_idx" ON "ScheduledCall"("alertId");

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledCall" ADD CONSTRAINT "ScheduledCall_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeviationAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Conversation — add source column
ALTER TABLE "Conversation" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'text';

-- AlterTable: Conversation — rename aiResponse to aiSummary
ALTER TABLE "Conversation" RENAME COLUMN "aiResponse" TO "aiSummary";

-- AlterTable: Conversation — drop legacy columns
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "medicalLens";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "tone";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "detailLevel";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "careApproach";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "spirituality";

-- AlterTable: Session — add rolling summary and message count
ALTER TABLE "Session" ADD COLUMN "summary" TEXT;
ALTER TABLE "Session" ADD COLUMN "messageCount" INTEGER NOT NULL DEFAULT 0;
