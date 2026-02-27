/*
  Warnings:

  - You are about to drop the column `isConsumed` on the `OtpCode` table. All the data in the column will be lost.
  - You are about to drop the column `isFailedAttempt` on the `OtpCode` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `OtpCode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OtpCode" DROP CONSTRAINT "OtpCode_userId_fkey";

-- AlterTable
ALTER TABLE "OtpCode" DROP COLUMN "isConsumed",
DROP COLUMN "isFailedAttempt",
DROP COLUMN "userId",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AuthLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "identifier" TEXT,
    "userId" TEXT,
    "method" TEXT,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthLog_userId_idx" ON "AuthLog"("userId");

-- CreateIndex
CREATE INDEX "AuthLog_identifier_idx" ON "AuthLog"("identifier");

-- CreateIndex
CREATE INDEX "AuthLog_event_idx" ON "AuthLog"("event");

-- CreateIndex
CREATE INDEX "AuthLog_createdAt_idx" ON "AuthLog"("createdAt");

-- CreateIndex
CREATE INDEX "OtpCode_email_idx" ON "OtpCode"("email");

-- CreateIndex
CREATE INDEX "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "AuthLog" ADD CONSTRAINT "AuthLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
