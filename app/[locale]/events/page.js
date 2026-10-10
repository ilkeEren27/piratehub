import EventsBrowser from "@/components/events/EventsBrowser";
import PageHeader, { PAGE_MARGIN } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { places } from "@/data/places";
import { getSessionUser } from "@/utils/roles";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CAMPUS_TIME_ZONE, campusDayKey, campusDayKeys, daysAgo } from "@/lib/time";

function getLocationName(locationId) {
  const place = places.find((p) => p.id === locationId);
  return place ? place.name : locationId;
}

// Dates are formatted in the campus time zone so they read the same on the
// server (UTC on Vercel) and for every visitor.
function formatEventDate(startsAt, endsAt, allDay, locale) {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  const localeCode = locale === "es" ? "es-ES" : "en-US";

  const dayOf = (date) =>
    date.toLocaleDateString(localeCode, {
      month: "long",
      day: "numeric",
      timeZone: CAMPUS_TIME_ZONE,
    });
  const timeOf = (date) =>
    date.toLocaleTimeString(localeCode, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: CAMPUS_TIME_ZONE,
    });

  const sameDay = campusDayKey(startDate) === campusDayKey(endDate);

  if (allDay) {
    return sameDay ? dayOf(startDate) : `${dayOf(startDate)} - ${dayOf(endDate)}`;
  }
  if (sameDay) {
    return `${dayOf(startDate)} ${timeOf(startDate)}`;
  }
  return `${dayOf(startDate)} ${timeOf(startDate)} - ${dayOf(endDate)} ${timeOf(endDate)}`;
}

export default async function EventsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");
  
  const user = await getSessionUser();
  const role = user?.role ?? "User";
  const allowedRoles = new Set(["ClubLeader", "ASWU", "Faculty", "Admin"]);
  const canCreate = allowedRoles.has(role);
  const isModerator = role === "Admin" || role === "Moderator";

  const appUserId = user?.id ?? null;

  let events = [];
  try {
    events = await prisma.event.findMany({
      where: {
        published: true,
        moderationStatus: "Approved",
        // Coarse cut here; the exact "ended before today" check is below.
        endsAt: { gte: daysAgo(2) },
      },
      include: { organizer: { select: { name: true, role: true } } },
      orderBy: { startsAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    events = [];
  }

  // Events that ended before today (campus time) are hidden.
  const todayKey = campusDayKey(new Date());
  const upcomingEvents = events.filter(
    (event) => campusDayKey(event.endsAt) >= todayKey
  );

  const transformedEvents = upcomingEvents.map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description || "",
    image: event.imageUrl || "/pirate-icon.png",
    location: getLocationName(event.location),
    locationId: event.location,
    date: formatEventDate(event.startsAt, event.endsAt, event.allDay, locale),
    dayKeys: campusDayKeys(event.startsAt, event.endsAt),
    organizer: event.organizer?.name || "Unknown",
    organizerRole: event.organizer?.role ?? "Unknown",
    canEdit:
      isModerator || (appUserId !== null && event.organizerId === appUserId),
  }));

  return (
    <main className="animate-fade-in">
      <PageHeader title={t("title")} description={t("description")}>
        {canCreate && (
          <Link href={`/${locale}/events/editor`}>
            <Button size="lg" className="shadow-md">
              <CalendarPlus />
              {t("createNew")}
            </Button>
          </Link>
        )}
      </PageHeader>
      <div className={`mt-10 mb-16 ${PAGE_MARGIN}`}>
        <EventsBrowser
          events={transformedEvents}
          locale={locale}
        />
      </div>
    </main>
  );
}
