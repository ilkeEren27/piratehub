import Link from "next/link";
import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { moderateEventAction } from "@/app/events/_actions";
import { moderatePostAction } from "@/app/social/_actions";
import { Button } from "@/components/ui/button";
import FlairBadge from "@/components/social/FlairBadge";
import { getTranslations, setRequestLocale } from "next-intl/server";

function ModerationActions({ action, id, approveLabel, rejectLabel }) {
  return (
    <div className="flex flex-col gap-2 shrink-0">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="Approved" />
        <Button
          type="submit"
          size="sm"
          className="w-24 bg-green-600 hover:bg-green-700 text-white"
        >
          {approveLabel}
        </Button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="Rejected" />
        <Button type="submit" size="sm" variant="destructive" className="w-24">
          {rejectLabel}
        </Button>
      </form>
    </div>
  );
}

export default async function ModerationPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderation");

  if (!(await checkRole("Admin")) && !(await checkRole("Moderator"))) {
    redirect(`/${locale}`);
  }

  const [pendingEvents, pendingPosts] = await Promise.all([
    prisma.event.findMany({
      where: { moderationStatus: "Pending" },
      include: { organizer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.findMany({
      where: { moderationStatus: "Pending" },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {/* Pending posts */}
      <h2 className="text-lg font-semibold mb-3">{t("postsSection")}</h2>
      {pendingPosts.length === 0 ? (
        <p className="text-muted-foreground mb-8">{t("noPosts")}</p>
      ) : (
        <div className="space-y-4 mb-8">
          {pendingPosts.map((post) => (
            <div
              key={post.id}
              className="border border-border rounded-xl p-5 bg-card space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FlairBadge flair={post.flair} />
                    <h3 className="font-semibold text-lg truncate">
                      {post.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("by")} {post.author?.name ?? t("unknownOrganizer")}{" "}
                    &middot; {post.author?.email ?? ""}
                  </p>
                  {post.excerpt && (
                    <p className="text-sm mt-2 text-foreground/80 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <Link
                    href={`/${locale}/social/${post.slug}`}
                    className="text-sm text-primary underline underline-offset-2"
                  >
                    {t("viewPost")}
                  </Link>
                </div>
                <ModerationActions
                  action={moderatePostAction}
                  id={post.id}
                  approveLabel={t("approve")}
                  rejectLabel={t("reject")}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending events */}
      <h2 className="text-lg font-semibold mb-3">{t("eventsSection")}</h2>
      {pendingEvents.length === 0 ? (
        <p className="text-muted-foreground">{t("noEvents")}</p>
      ) : (
        <div className="space-y-4">
          {pendingEvents.map((event) => (
            <div
              key={event.id}
              className="border border-border rounded-xl p-5 bg-card space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("by")} {event.organizer?.name ?? t("unknownOrganizer")}{" "}
                    &middot; {event.organizer?.email ?? ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startsAt).toLocaleDateString(dateLocale, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    {t("at")} {event.location}
                  </p>
                  {event.description && (
                    <p className="text-sm mt-2 text-foreground/80 line-clamp-3">
                      {event.description}
                    </p>
                  )}
                </div>
                <ModerationActions
                  action={moderateEventAction}
                  id={event.id}
                  approveLabel={t("approve")}
                  rejectLabel={t("reject")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
