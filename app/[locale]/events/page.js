import EventCard from "@/components/cards/EventCard";
import PageHeader, { PAGE_MARGIN } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CalendarPlus, CalendarDays } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { places } from "@/data/places";
import { getSessionUser } from "@/utils/roles";
import { getTranslations, setRequestLocale } from "next-intl/server";

function getLocationName(locationId) {
  const place = places.find((p) => p.id === locationId);
  return place ? place.name : locationId;
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
      <section
        className={`grid justify-center mt-10 mb-16 ${PAGE_MARGIN} grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4`}
      >
        {transformedEvents.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-4 py-16 rounded-xl border border-dashed bg-card/50 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <CalendarDays className="h-7 w-7 text-primary" />
            </div>
            <p className="text-lg text-muted-foreground max-w-md px-4">{t("noEvents")}</p>
          </div>
        ) : (
          transformedEvents
            .toReversed()
            .map((event) => <EventCard key={event.id} {...event} locale={locale} />)
        )}
      </section>
    </main>
  );
}
