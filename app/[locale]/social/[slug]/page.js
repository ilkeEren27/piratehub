import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/utils/roles";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { renderPostHtml } from "@/lib/tiptap";
import { timeAgo } from "@/lib/format";
import FlairBadge from "@/components/social/FlairBadge";
import VoteButtons from "@/components/social/VoteButtons";
import CommentSection from "@/components/social/CommentSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock3, FileText, Pencil, Download } from "lucide-react";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PostPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("social");

  const user = await getSessionUser();
  const isSignedIn = !!user;
  const isModerator = user?.role === "Admin" || user?.role === "Moderator";

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, role: true } },
      attachments: true,
      votes: { select: { value: true, userId: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, role: true } },
          votes: { select: { value: true, userId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post || !post.published) notFound();

  const isOwner = user && post.authorId === user.id;
  if (post.moderationStatus === "Rejected" && !isModerator) notFound();
  if (post.moderationStatus === "Pending" && !isOwner && !isModerator) {
    notFound();
  }

  const html = renderPostHtml(post.contentJson);

  // Build the nested comment tree; top level sorted by score, replies stay
  // chronological.
  const byId = new Map(
    post.comments.map((c) => [
      c.id,
      {
        id: c.id,
        content: c.content,
        parentId: c.parentId,
        authorId: c.author?.id ?? null,
        authorName: c.author?.name ?? "Unknown",
        authorRole: c.author?.role ?? "User",
        timeAgo: timeAgo(c.createdAt, locale),
        score: c.votes.reduce((sum, v) => sum + v.value, 0),
        myVote: user
          ? c.votes.find((v) => v.userId === user.id)?.value ?? 0
          : 0,
        children: [],
      },
    ])
  );
  const tree = [];
  for (const comment of byId.values()) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId).children.push(comment);
    } else {
      tree.push(comment);
    }
  }
  tree.sort((a, b) => b.score - a.score);

  const score = post.votes.reduce((sum, v) => sum + v.value, 0);
  const myVote = user
    ? post.votes.find((v) => v.userId === user.id)?.value ?? 0
    : 0;

  const imageAttachments = post.attachments.filter((a) =>
    a.mimeType?.startsWith("image/")
  );
  const fileAttachments = post.attachments.filter(
    (a) => !a.mimeType?.startsWith("image/")
  );

  const canEdit = isOwner || isModerator;

  return (
    <main className="animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 mt-8 md:mt-12 mb-16">
        <div className="flex items-center justify-between gap-2 mb-4">
          <Link href={`/${locale}/social`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              {t("backToBoard")}
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/${locale}/social/editor/${post.slug}`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4" />
                {t("edit")}
              </Button>
            </Link>
          )}
        </div>

        <article className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
          <div className="flex">
            {/* Vote rail */}
            <div className="flex flex-col items-center px-2 sm:px-3 py-6 bg-muted/20 border-r border-border/50">
              <VoteButtons
                kind="post"
                id={post.id}
                score={score}
                myVote={myVote}
                isSignedIn={isSignedIn}
              />
            </div>

            <div className="flex-1 min-w-0 p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                <FlairBadge flair={post.flair} />
                {post.moderationStatus === "Pending" && (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                  >
                    {t("pendingBadge")}
                  </Badge>
                )}
                <span className="font-medium text-foreground">
                  {post.author?.name ?? "Unknown"}
                </span>
                <Badge variant="secondary">{post.author?.role ?? "User"}</Badge>
                <span className="flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5" />
                  {timeAgo(post.createdAt, locale)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {post.title}
              </h1>

              <div
                className="tiptap-content"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {imageAttachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {imageAttachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-border/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.url}
                        alt={a.fileName ?? "attachment"}
                        className="w-full h-auto object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}

              {fileAttachments.length > 0 && (
                <div className="space-y-2">
                  {fileAttachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-sm hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <span className="truncate flex-1 font-medium">
                        {a.fileName ?? "file"}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatSize(a.sizeBytes)}
                      </span>
                      <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

        <div className="mt-8">
          <CommentSection
            postId={post.id}
            comments={{ tree, total: post.comments.length }}
            currentUser={{
              id: user?.id ?? null,
              isSignedIn,
              isModerator,
            }}
          />
        </div>
      </div>
    </main>
  );
}
