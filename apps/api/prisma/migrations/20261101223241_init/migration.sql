/*
  Warnings:

  - You are about to drop the column `actordId` on the `ResultEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PickemQuestion" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "ResultEvent" DROP COLUMN "actordId",
ADD COLUMN     "actorId" TEXT;

-- CreateIndex
CREATE INDEX "ResultEvent_actorId_idx" ON "ResultEvent"("actorId");

-- AddForeignKey
ALTER TABLE "ResultEvent" ADD CONSTRAINT "ResultEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
