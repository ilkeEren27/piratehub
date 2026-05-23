import EventCard from "@/components/cards/EventCard";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { places } from "@/data/places";
import { currentUser } from "@clerk/nextjs/server";
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
  
  const user = await currentUser();
  const role = user?.publicMetadata?.role ?? "User";
  const allowedRoles = new Set(["ClubLeader", "ASWU", "Faculty", "Admin"]);
  const canCreate = allowedRoles.has(role);
  const isModerator = role === "Admin" || role === "Moderator";

  let appUserId = null;
  if (user) {
    try {
      const appUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        select: { id: true },
      });
      appUserId = appUser?.id ?? null;
    } catch (error) {
      console.error("Error resolving app user:", error);
    }
  }

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
    image: event.imageUrl || "/whitworth.png",
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
      <div className="flex justify-end my-4 mx-4">
        {canCreate && (
          <Link href={`/${locale}/events/editor`}>
            <Button>
              <CalendarPlus />
              {t("createNew")}
            </Button>
          </Link>
        )}
      </div>
      <section className="grid justify-center mt-16 mx-4 sm:mx-10 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {transformedEvents.length === 0 ? (
          <p className="col-span-full text-center text-lg text-muted-foreground">
            {t("noEvents")}
          </p>
        ) : (
          transformedEvents
            .toReversed()
            .map((event) => <EventCard key={event.id} {...event} locale={locale} />)
        )}
      </section>
    </main>
  );
}
