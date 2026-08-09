-- CreateEnum
CREATE TYPE "public"."Flair" AS ENUM ('General', 'Class', 'Clubs', 'Events', 'Announcements', 'Help');

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "flair" "public"."Flair" NOT NULL DEFAULT 'General',
ADD COLUMN     "moderationStatus" "public"."ModerationStatus" NOT NULL DEFAULT 'Approved',
ALTER COLUMN "published" SET DEFAULT true;

-- CreateTable
CREATE TABLE "public"."PostVote" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "PostVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommentVote" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" INTEGER NOT NULL,

    CONSTRAINT "CommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostVote_postId_idx" ON "public"."PostVote"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "PostVote_userId_postId_key" ON "public"."PostVote"("userId", "postId");

-- CreateIndex
CREATE INDEX "CommentVote_commentId_idx" ON "public"."CommentVote"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentVote_userId_commentId_key" ON "public"."CommentVote"("userId", "commentId");

-- CreateIndex
CREATE INDEX "Post_flair_idx" ON "public"."Post"("flair");

-- CreateIndex
CREATE INDEX "Post_moderationStatus_idx" ON "public"."Post"("moderationStatus");

-- AddForeignKey
ALTER TABLE "public"."PostVote" ADD CONSTRAINT "PostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostVote" ADD CONSTRAINT "PostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentVote" ADD CONSTRAINT "CommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommentVote" ADD CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
