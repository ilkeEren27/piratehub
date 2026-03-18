-- CreateEnum
CREATE TYPE "public"."ModerationStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "moderationStatus" "public"."ModerationStatus" NOT NULL DEFAULT 'Approved';

-- CreateIndex
CREATE INDEX "Event_moderationStatus_idx" ON "public"."Event"("moderationStatus");
