import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { moderateEventAction } from "@/app/events/_actions";
import { moderatePostAction, moderateCommentAction } from "@/app/social/_actions";
import { moderateListingAction } from "@/app/marketplace/_actions";
import { formatPrice } from "@/lib/marketplace";
import { CAMPUS_TIME_ZONE } from "@/lib/time";
import { places } from "@/data/places";
import { Button } from "@/components/ui/button";
import FlairBadge from "@/components/social/FlairBadge";
import CategoryBadge from "@/components/marketplace/CategoryBadge";
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

function ReportReasons({ reports, label }) {
  if (!reports?.length) return null;
  return (
    <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
      <p className="text-sm font-medium text-destructive">{label}</p>
      <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-0.5">
        {reports.map((report) => (
          <li key={report.id} className="break-words">
            {report.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

// One card in the queue. `actions` decides what Approve/Reject do.
function QueueItem({ badge, title, meta, body, reports, reportLabel, link, linkLabel, actions }) {
  return (
    <div className="border border-border rounded-xl p-5 bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {badge}
            {title && <h3 className="font-semibold text-lg truncate">{title}</h3>}
          </div>
          {meta.map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              {line}
            </p>
          ))}
          {body && (
            <p className="text-sm mt-2 text-foreground/80 line-clamp-4 whitespace-pre-line break-words">
              {body}
            </p>
          )}
          <ReportReasons reports={reports} label={reportLabel} />
          {link && (
            <Link href={link} className="text-sm text-primary underline underline-offset-2">
              {linkLabel}
            </Link>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}

function QueueSection({ title, empty, children }) {
  const items = [children].flat().filter(Boolean);
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-4">{items}</div>
      )}
    </section>
  );
}

export default async function ModerationPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderation");

  const user = await getSessionUser();
  if (user?.role !== "Admin" && user?.role !== "Moderator") {
    redirect(`/${locale}`);
  }

  const reportsInclude = {
    select: { id: true, reason: true },
    orderBy: { createdAt: "desc" },
  };
  const person = { select: { name: true, email: true } };

  const [
    pendingPosts,
    reportedPosts,
    pendingComments,
    reportedComments,
    pendingListings,
    reportedListings,
    pendingEvents,
  ] = await Promise.all([
    prisma.post.findMany({
      where: { moderationStatus: "Pending" },
      include: { author: person, reports: reportsInclude },
      orderBy: { createdAt: "desc" },
    }),
    // Still-visible content that pirates have reported, below the auto-hide
    // threshold.
    prisma.post.findMany({
      where: { moderationStatus: "Approved", reports: { some: {} } },
      include: { author: person, reports: reportsInclude },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.comment.findMany({
      where: { moderationStatus: "Pending" },
      include: {
        author: person,
        reports: reportsInclude,
        post: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.findMany({
      where: { moderationStatus: "Approved", reports: { some: {} } },
      include: {
        author: person,
        reports: reportsInclude,
        post: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.findMany({
      where: { moderationStatus: "Pending" },
      include: { seller: person, reports: reportsInclude },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.findMany({
      where: { moderationStatus: "Approved", reports: { some: {} } },
      include: { seller: person, reports: reportsInclude },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.event.findMany({
      where: { moderationStatus: "Pending" },
      include: { organizer: person },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const dateLocale = locale === "es" ? "es-ES" : "en-US";
  const byLine = (p) =>
    `${t("by")} ${p?.name ?? t("unknownOrganizer")} · ${p?.email ?? ""}`;
  const reportLabel = (reports) => t("reportCount", { count: reports.length });
  const placeName = (id) => places.find((p) => p.id === id)?.name ?? id;

  const actions = (action, id, reported) => (
    <ModerationActions
      action={action}
      id={id}
      approveLabel={reported ? t("keep") : t("approve")}
      rejectLabel={reported ? t("remove") : t("reject")}
    />
  );

  const postItem = (post, reported) => (
    <QueueItem
      key={post.id}
      badge={<FlairBadge flair={post.flair} />}
      title={post.title}
      meta={[byLine(post.author)]}
      body={post.excerpt}
      reports={post.reports}
      reportLabel={reportLabel(post.reports)}
      link={`/${locale}/social/${post.slug}`}
      linkLabel={t("viewPost")}
      actions={actions(moderatePostAction, post.id, reported)}
    />
  );

  const commentItem = (comment, reported) => (
    <QueueItem
      key={comment.id}
      meta={[byLine(comment.author), `${t("onPost")} ${comment.post?.title ?? ""}`]}
      body={comment.content}
      reports={comment.reports}
      reportLabel={reportLabel(comment.reports)}
      link={comment.post ? `/${locale}/social/${comment.post.slug}` : null}
      linkLabel={t("viewPost")}
      actions={actions(moderateCommentAction, comment.id, reported)}
    />
  );

  const listingItem = (listing, reported) => (
    <QueueItem
      key={listing.id}
      badge={
        <>
          <CategoryBadge category={listing.category} />
          <span className="font-semibold text-primary">
            {formatPrice(listing.priceCents, locale)}
          </span>
        </>
      }
      title={listing.title}
      meta={[byLine(listing.seller)]}
      body={listing.description}
      reports={listing.reports}
      reportLabel={reportLabel(listing.reports)}
      link={`/${locale}/marketplace/${listing.slug}`}
      linkLabel={t("viewListing")}
      actions={actions(moderateListingAction, listing.id, reported)}
    />
  );

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <QueueSection title={t("postsSection")} empty={t("noPosts")}>
        {pendingPosts.map((post) => postItem(post, false))}
      </QueueSection>
      <QueueSection title={t("reportedPostsSection")} empty={t("noReportedPosts")}>
        {reportedPosts.map((post) => postItem(post, true))}
      </QueueSection>

      <QueueSection title={t("commentsSection")} empty={t("noComments")}>
        {pendingComments.map((comment) => commentItem(comment, false))}
      </QueueSection>
      <QueueSection title={t("reportedCommentsSection")} empty={t("noReportedComments")}>
        {reportedComments.map((comment) => commentItem(comment, true))}
      </QueueSection>

      <QueueSection title={t("listingsSection")} empty={t("noListings")}>
        {pendingListings.map((listing) => listingItem(listing, false))}
      </QueueSection>
      <QueueSection title={t("reportedSection")} empty={t("noReported")}>
        {reportedListings.map((listing) => listingItem(listing, true))}
      </QueueSection>

      <QueueSection title={t("eventsSection")} empty={t("noEvents")}>
        {pendingEvents.map((event) => (
          <QueueItem
            key={event.id}
            title={event.title}
            meta={[
              byLine(event.organizer),
              `${new Date(event.startsAt).toLocaleDateString(dateLocale, {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: CAMPUS_TIME_ZONE,
              })} ${t("at")} ${placeName(event.location)}`,
            ]}
            body={event.description}
            actions={actions(moderateEventAction, event.id, false)}
          />
        ))}
      </QueueSection>
    </main>
  );
}
