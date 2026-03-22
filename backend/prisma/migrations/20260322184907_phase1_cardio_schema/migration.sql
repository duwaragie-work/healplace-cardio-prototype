-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'TIP', 'FAQ');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PARTIALLY_APPROVED', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "ContentRevisionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PARTIALLY_APPROVED');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('EDITORIAL', 'CLINICAL');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('APPROVED', 'APPROVED_WITH_MINOR_REVISIONS', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeviationType" AS ENUM ('SYSTOLIC_BP', 'DIASTOLIC_BP', 'WEIGHT', 'MEDICATION_ADHERENCE');

-- CreateEnum
CREATE TYPE "DeviationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "EscalationLevel" AS ENUM ('LEVEL_1', 'LEVEL_2');

-- CreateEnum
CREATE TYPE "CommunicationPreference" AS ENUM ('TEXT_FIRST', 'AUDIO_FIRST');

-- CreateEnum
CREATE TYPE "EntrySource" AS ENUM ('MANUAL', 'HEALTHKIT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GUEST', 'REGISTERED_USER', 'VERIFIED_USER', 'CONTENT_ADMIN', 'ARTICLE_ADMIN', 'ARTICLE_APPROVER', 'CONTENT_APPROVER', 'KB_UPLOADER', 'KB_APPROVER', 'CHAT_REVIEWER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('STANDARD', 'ELEVATED', 'HIGH');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_COMPLETED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "BaselineSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "computedForDate" DATE NOT NULL,
    "baselineSystolic" DECIMAL(5,2),
    "baselineDiastolic" DECIMAL(5,2),
    "baselineWeight" DECIMAL(6,2),
    "sampleSize" INTEGER DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaselineSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "author" TEXT,
    "humanId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "tags" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedVersionNo" INTEGER,
    "reviewVersionNo" INTEGER,
    "revisionStatus" "ContentRevisionStatus",
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "ratingAvg" DOUBLE PRECISION DEFAULT 0,
    "ratingsCount" INTEGER NOT NULL DEFAULT 0,
    "mediaUrl" TEXT,
    "lastReviewed" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAuditLog" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRating" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ratingValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReview" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "reviewType" "ReviewType" NOT NULL,
    "outcome" "ReviewOutcome" NOT NULL,
    "notes" TEXT,
    "reviewedById" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "changeReason" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentView" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "embedding" vector(1024),
    "medicalLens" TEXT,
    "tone" TEXT,
    "detailLevel" TEXT,
    "careApproach" TEXT,
    "spirituality" BOOLEAN,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "systolicBP" INTEGER,
    "diastolicBP" INTEGER,
    "weight" DECIMAL(65,30),
    "medicationTaken" BOOLEAN,
    "missedDoses" INTEGER DEFAULT 0,
    "symptoms" TEXT[],
    "teachBackAnswer" TEXT,
    "teachBackCorrect" BOOLEAN,
    "notes" TEXT,
    "source" "EntrySource" NOT NULL DEFAULT 'MANUAL',
    "sourceMetadata" JSONB,
    "snapshotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT,
    "deviceType" TEXT,
    "deviceName" TEXT,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviationAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "type" "DeviationType" NOT NULL,
    "severity" "DeviationSeverity" NOT NULL,
    "magnitude" DECIMAL(6,2) NOT NULL,
    "baselineValue" DECIMAL(6,2),
    "actualValue" DECIMAL(6,2),
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "DeviationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceFormat" TEXT NOT NULL,
    "sourceSize" INTEGER NOT NULL,
    "sourceChunkCount" INTEGER NOT NULL,
    "sourceResourceLink" TEXT NOT NULL,
    "sourceTags" TEXT[],
    "sourceActiveStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVector" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1024),
    "documentId" TEXT NOT NULL,
    "sourceActiveStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentVector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "prompt" TEXT NOT NULL,
    "isEmergency" BOOLEAN NOT NULL,
    "emergency_situation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationEvent" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "escalationLevel" "EscalationLevel" NOT NULL,
    "reason" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationSentAt" TIMESTAMP(3),

    CONSTRAINT "EscalationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT,
    "escalationEventId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tips" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "pwdhash" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "timezone" TEXT,
    "communicationPreference" "CommunicationPreference",
    "preferredLanguage" TEXT DEFAULT 'en',
    "riskTier" "RiskTier" DEFAULT 'STANDARD',
    "diagnosisDate" TIMESTAMP(3),
    "primaryCondition" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "roles" "UserRole"[] DEFAULT ARRAY['GUEST']::"UserRole"[],
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_COMPLETED',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerId_key" ON "Account"("provider", "providerId");

-- CreateIndex
CREATE INDEX "AuthLog_userId_idx" ON "AuthLog"("userId");

-- CreateIndex
CREATE INDEX "AuthLog_identifier_idx" ON "AuthLog"("identifier");

-- CreateIndex
CREATE INDEX "AuthLog_event_idx" ON "AuthLog"("event");

-- CreateIndex
CREATE INDEX "AuthLog_createdAt_idx" ON "AuthLog"("createdAt");

-- CreateIndex
CREATE INDEX "BaselineSnapshot_userId_computedForDate_idx" ON "BaselineSnapshot"("userId", "computedForDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "BaselineSnapshot_userId_computedForDate_key" ON "BaselineSnapshot"("userId", "computedForDate");

-- CreateIndex
CREATE UNIQUE INDEX "Content_humanId_key" ON "Content"("humanId");

-- CreateIndex
CREATE INDEX "Content_contentType_idx" ON "Content"("contentType");

-- CreateIndex
CREATE INDEX "Content_status_idx" ON "Content"("status");

-- CreateIndex
CREATE INDEX "Content_needsReview_idx" ON "Content"("needsReview");

-- CreateIndex
CREATE INDEX "Content_lastReviewed_idx" ON "Content"("lastReviewed");

-- CreateIndex
CREATE INDEX "Content_submittedById_idx" ON "Content"("submittedById");

-- CreateIndex
CREATE INDEX "Content_deletedAt_idx" ON "Content"("deletedAt");

-- CreateIndex
CREATE INDEX "ContentAuditLog_contentId_idx" ON "ContentAuditLog"("contentId");

-- CreateIndex
CREATE INDEX "ContentAuditLog_event_idx" ON "ContentAuditLog"("event");

-- CreateIndex
CREATE INDEX "ContentAuditLog_createdAt_idx" ON "ContentAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ContentRating_contentId_idx" ON "ContentRating"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRating_contentId_userId_key" ON "ContentRating"("contentId", "userId");

-- CreateIndex
CREATE INDEX "ContentReview_contentId_idx" ON "ContentReview"("contentId");

-- CreateIndex
CREATE INDEX "ContentReview_versionNo_idx" ON "ContentReview"("versionNo");

-- CreateIndex
CREATE INDEX "ContentReview_reviewedById_idx" ON "ContentReview"("reviewedById");

-- CreateIndex
CREATE INDEX "ContentVersion_contentId_idx" ON "ContentVersion"("contentId");

-- CreateIndex
CREATE INDEX "ContentVersion_isDraft_idx" ON "ContentVersion"("isDraft");

-- CreateIndex
CREATE INDEX "ContentVersion_isPublished_idx" ON "ContentVersion"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_contentId_versionNo_key" ON "ContentVersion"("contentId", "versionNo");

-- CreateIndex
CREATE INDEX "ContentView_contentId_idx" ON "ContentView"("contentId");

-- CreateIndex
CREATE INDEX "ContentView_userId_idx" ON "ContentView"("userId");

-- CreateIndex
CREATE INDEX "ContentView_viewedAt_idx" ON "ContentView"("viewedAt");

-- CreateIndex
CREATE INDEX "Conversation_sessionId_idx" ON "Conversation"("sessionId");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_entryDate_idx" ON "JournalEntry"("userId", "entryDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_userId_entryDate_key" ON "JournalEntry"("userId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- CreateIndex
CREATE INDEX "DeviationAlert_userId_createdAt_idx" ON "DeviationAlert"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DeviationAlert_userId_status_createdAt_idx" ON "DeviationAlert"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DeviationAlert_journalEntryId_type_key" ON "DeviationAlert"("journalEntryId", "type");

-- CreateIndex
CREATE INDEX "EmergencyEvent_userId_idx" ON "EmergencyEvent"("userId");

-- CreateIndex
CREATE INDEX "EmergencyEvent_sessionId_idx" ON "EmergencyEvent"("sessionId");

-- CreateIndex
CREATE INDEX "EscalationEvent_alertId_triggeredAt_idx" ON "EscalationEvent"("alertId", "triggeredAt" DESC);

-- CreateIndex
CREATE INDEX "EscalationEvent_userId_triggeredAt_idx" ON "EscalationEvent"("userId", "triggeredAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_sentAt_idx" ON "Notification"("userId", "sentAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "OtpCode_email_idx" ON "OtpCode"("email");

-- CreateIndex
CREATE INDEX "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_id_idx" ON "Session"("id");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserDevice_userId_idx" ON "UserDevice"("userId");

-- CreateIndex
CREATE INDEX "UserDevice_deviceId_idx" ON "UserDevice"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_deviceId_key" ON "UserDevice"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthLog" ADD CONSTRAINT "AuthLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaselineSnapshot" ADD CONSTRAINT "BaselineSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAuditLog" ADD CONSTRAINT "ContentAuditLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRating" ADD CONSTRAINT "ContentRating_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRating" ADD CONSTRAINT "ContentRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReview" ADD CONSTRAINT "ContentReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentView" ADD CONSTRAINT "ContentView_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "BaselineSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviationAlert" ADD CONSTRAINT "DeviationAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviationAlert" ADD CONSTRAINT "DeviationAlert_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVector" ADD CONSTRAINT "DocumentVector_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeviationAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "DeviationAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_escalationEventId_fkey" FOREIGN KEY ("escalationEventId") REFERENCES "EscalationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
