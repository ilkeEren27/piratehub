import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MessageSquare, Paperclip, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import FlairBadge from "@/components/social/FlairBadge";
import VoteButtons from "@/components/social/VoteButtons";
import UserAvatar from "@/components/UserAvatar";

export default function PostCard({ post, locale, isSignedIn }) {
  const t = useTranslations("social");

  return (
    <Card className="animate-fade-in hover-lift flex flex-row gap-0 p-0 overflow-hidden">
      {/* Vote rail */}
      <div className="flex flex-col items-center justify-start px-2 py-4 bg-muted/20 border-r border-border/50">
        <VoteButtons
          kind="post"
          id={post.id}
          score={post.score}
          myVote={post.myVote}
          isSignedIn={isSignedIn}
        />
      </div>

      {/* Content */}
      <Link
        href={`/${locale}/social/${post.slug}`}
        className="flex-1 min-w-0 p-4 sm:p-5 space-y-2"
      >
        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
          <FlairBadge flair={post.flair} />
          {post.moderationStatus === "Pending" && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
              {t("pendingBadge")}
            </Badge>
          )}
          <span className="flex items-center gap-1.5">
            <UserAvatar
              name={post.authorName}
              image={post.authorImage}
              size="xs"
            />
            <span className="font-medium text-foreground">
              {post.authorName}
            </span>
          </span>
          <Badge variant="secondary">{post.authorRole}</Badge>
          <span className="flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" />
            {post.timeAgo}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold leading-snug">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-muted-foreground text-sm sm:text-base line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* First image from the body, previewed straight in the timeline */}
        {post.image && (
          <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-border/50 bg-muted/20">
            <Image
              src={post.image.src}
              alt={post.image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          </div>
        )}

        <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            {t("commentCount", { count: post.commentCount })}
          </span>
          {post.attachmentCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-4 h-4" />
              {post.attachmentCount}
            </span>
          )}
        </div>
      </Link>
    </Card>
  );
}
