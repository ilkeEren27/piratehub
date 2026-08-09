import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/utils/roles";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FLAIRS } from "@/lib/flairs";
import { timeAgo } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/social/PostCard";
import FlairBadge from "@/components/social/FlairBadge";
import { Button } from "@/components/ui/button";
import { PenSquare, MessagesSquare, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function SocialPage({ params, searchParams }) {
  const { locale } = await params;
  const { flair, sort = "new" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("social");

  const user = await getSessionUser();
  const isSignedIn = !!user;
  const isModerator = user?.role === "Admin" || user?.role === "Moderator";

  const activeFlair = FLAIRS.includes(flair) ? flair : null;
  const activeSort = sort === "top" ? "top" : "new";

  let posts = [];
  try {
    const rows = await prisma.post.findMany({
      where: {
        published: true,
        ...(activeFlair ? { flair: activeFlair } : {}),
        // Everyone sees approved posts; authors also see their own pending
        // posts; moderators see everything except rejected.
        ...(isModerator
          ? {}
          : {
              OR: [
                { moderationStatus: "Approved" },
                ...(user ? [{ authorId: user.id }] : []),
              ],
            }),
        moderationStatus: { not: "Rejected" },
      },
      include: {
        author: { select: { name: true, role: true, image: true } },
        votes: { select: { value: true, userId: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    posts = rows.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      flair: post.flair,
      moderationStatus: post.moderationStatus,
      authorName: post.author?.name ?? "Unknown",
      authorRole: post.author?.role ?? "User",
      authorImage: post.author?.image ?? null,
      timeAgo: timeAgo(post.createdAt, locale),
      score: post.votes.reduce((sum, v) => sum + v.value, 0),
      myVote: user
        ? post.votes.find((v) => v.userId === user.id)?.value ?? 0
        : 0,
      commentCount: post._count.comments,
      attachmentCount: post._count.attachments,
    }));

    if (activeSort === "top") {
      posts.sort((a, b) => b.score - a.score);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    posts = [];
  }

  const boardHref = (overrides = {}) => {
    const p = new URLSearchParams();
    const f = "flair" in overrides ? overrides.flair : activeFlair;
    const s = "sort" in overrides ? overrides.sort : activeSort;
    if (f) p.set("flair", f);
    if (s && s !== "new") p.set("sort", s);
    const qs = p.toString();
    return `/${locale}/social${qs ? `?${qs}` : ""}`;
  };

  return (
    <main className="animate-fade-in">
      <PageHeader title={t("title")} description={t("description")}>
        <Link href={isSignedIn ? `/${locale}/social/editor` : `/${locale}/log-in`}>
          <Button size="lg" className="shadow-md">
            <PenSquare />
            {t("newPost")}
          </Button>
        </Link>
      </PageHeader>

      <section className="mt-10 mb-16 max-w-3xl mx-6 sm:mx-12 lg:mx-auto lg:px-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={boardHref({ flair: null })}>
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium transition-colors",
                  !activeFlair
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {t("allFlairs")}
              </span>
            </Link>
            {FLAIRS.map((f) => (
              <Link key={f} href={boardHref({ flair: f })}>
                <FlairBadge
                  flair={f}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm cursor-pointer transition-opacity",
                    activeFlair && activeFlair !== f && "opacity-50 hover:opacity-100"
                  )}
                />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl">
            <Link
              href={boardHref({ sort: "new" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                activeSort === "new"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-4 h-4" />
              {t("sortNew")}
            </Link>
            <Link
              href={boardHref({ sort: "top" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                activeSort === "top"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Flame className="w-4 h-4" />
              {t("sortTop")}
            </Link>
          </div>
        </div>

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 rounded-xl border border-dashed bg-card/50 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <MessagesSquare className="h-7 w-7 text-primary" />
            </div>
            <p className="text-lg text-muted-foreground max-w-md px-4">
              {t("noPosts")}
            </p>
            <Link href={isSignedIn ? `/${locale}/social/editor` : `/${locale}/log-in`}>
              <Button>
                <PenSquare className="w-4 h-4" />
                {t("newPost")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                locale={locale}
                isSignedIn={isSignedIn}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
