import EventsBrowser from "@/components/events/EventsBrowser";
import PageHeader, { PAGE_MARGIN } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { places } from "@/data/places";
import { getSessionUser } from "@/utils/roles";
import { getTranslations, setRequestLocale } from "next-intl/server";

function getLocationName(locationId) {
  const place = places.find((p) => p.id === locationId);
  return place ? place.name : locationId;
}

function toDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// Every calendar day an event touches, so the events page calendar can mark
// multi-day events on each of their days. Capped so a bad end date can't
// generate an unbounded list.
function getDayKeys(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const keys = [];
  while (cursor <= last && keys.length < 366) {
    keys.push(toDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys.length ? keys : [toDayKey(cursor)];
}

function formatEventDate(startsAt, endsAt, allDay, locale) {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  
  const localeCode = locale === 'es' ? 'es-ES' : 'en-US';

  const options = {
    month: "long",
    day: "numeric",
    hour: allDay ? undefined : "numeric",
    minute: allDay ? undefined : "2-digit",
    hour12: true,
  };

  if (allDay) {
    return startDate.toLocaleDateString(localeCode, {
      month: "long",
      day: "numeric",
    });
  }

  const startTime = startDate.toLocaleTimeString(localeCode, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (startDate.toDateString() === endDate.toDateString()) {
    return `${startDate.toLocaleDateString(localeCode, {
      month: "long",
      day: "numeric",
    })} ${startTime}`;
  }

  const endTime = endDate.toLocaleTimeString(localeCode, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${startDate.toLocaleDateString(localeCode, {
    month: "long",
    day: "numeric",
  })} ${startTime} - ${endDate.toLocaleDateString(localeCode, {
    month: "long",
    day: "numeric",
  })} ${endTime}`;
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
      where: { published: true },
      include: { organizer: { select: { name: true, role: true } } },
      orderBy: { startsAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    events = [];
  }

  const transformedEvents = events.map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description || "",
    image: event.imageUrl || "/pirate-icon.png",
    location: getLocationName(event.location),
    locationId: event.location,
    date: formatEventDate(event.startsAt, event.endsAt, event.allDay, locale),
    dayKeys: getDayKeys(event.startsAt, event.endsAt),
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
          events={transformedEvents.toReversed()}
          locale={locale}
        />
      </div>
    </main>
  );
}
