-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER', 'SPECTATOR');

-- CreateEnum
CREATE TYPE "StageFormat" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS', 'FREE_FOR_ALL');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('INTERNAL', 'FILE_IMPORT', 'STARTGG');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'CALLED', 'LIVE', 'DISPUTED', 'DONE', 'FORFEIT');

-- CreateEnum
CREATE TYPE "PickemTemplate" AS ENUM ('MOST_PICKED', 'BEST_ON_STAT', 'TOTAL', 'RANKING', 'YES_NO');

-- CreateEnum
CREATE TYPE "PickemStatus" AS ENUM ('OPEN', 'LOCKED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatKind" AS ENUM ('CHOICE', 'NUMBER', 'PLAYER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('ONLINE', 'ONSITE', 'MIXED');

-- CreateEnum
CREATE TYPE "ResultEventType" AS ENUM ('ENTERED', 'DECLARED', 'CONFIRMED', 'CORRECTED', 'IMPORTED', 'SYNCED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SPECTATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatDefinition" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "StatKind" NOT NULL,
    "choices" TEXT[],

    CONSTRAINT "StatDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "source" "Source" NOT NULL DEFAULT 'INTERNAL',
    "externalId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" "LocationType" NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "teamSize" INTEGER NOT NULL DEFAULT 1,
    "maxSubs" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "readOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "format" "StageFormat" NOT NULL,
    "settings" JSONB NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seed" INTEGER,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isSub" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId","userId")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "bestOf" INTEGER NOT NULL DEFAULT 1,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "slots" JSONB NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchGame" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "result" JSONB NOT NULL,
    "stats" JSONB NOT NULL,

    CONSTRAINT "MatchGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ResultEventType" NOT NULL,
    "actordId" TEXT,

    CONSTRAINT "ResultEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "winner" TEXT NOT NULL,
    "score" TEXT,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickemQuestion" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "template" "PickemTemplate" NOT NULL,
    "config" JSONB NOT NULL,
    "points" INTEGER NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" "PickemStatus" NOT NULL,
    "answer" JSONB,

    CONSTRAINT "PickemQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickemAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "points" INTEGER,

    CONSTRAINT "PickemAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StatDefinition_gameId_key_key" ON "StatDefinition"("gameId", "key");

-- CreateIndex
CREATE INDEX "Tournament_gameId_idx" ON "Tournament"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_source_externalId_key" ON "Tournament"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_tournamentId_order_key" ON "Stage"("tournamentId", "order");

-- CreateIndex
CREATE INDEX "Team_tournamentId_idx" ON "Team"("tournamentId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_stageId_round_number_key" ON "Match"("stageId", "round", "number");

-- CreateIndex
CREATE UNIQUE INDEX "MatchGame_matchId_number_key" ON "MatchGame"("matchId", "number");

-- CreateIndex
CREATE INDEX "ResultEvent_matchId_createdAt_idx" ON "ResultEvent"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_userId_matchId_key" ON "Prediction"("userId", "matchId");

-- CreateIndex
CREATE INDEX "PickemQuestion_tournamentId_idx" ON "PickemQuestion"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "PickemAnswer_questionId_userId_key" ON "PickemAnswer"("questionId", "userId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_target_idx" ON "AuditLog"("target");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "StatDefinition" ADD CONSTRAINT "StatDefinition_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGame" ADD CONSTRAINT "MatchGame_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultEvent" ADD CONSTRAINT "ResultEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickemQuestion" ADD CONSTRAINT "PickemQuestion_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickemAnswer" ADD CONSTRAINT "PickemAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PickemQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickemAnswer" ADD CONSTRAINT "PickemAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
