import EventCard from "@/components/cards/EventCard";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { places } from "@/data/places";
import { currentUser } from "@clerk/nextjs/server";

function getLocationName(locationId) {
  const place = places.find((p) => p.id === locationId);
  return place ? place.name : locationId;
}

function formatEventDate(startsAt, endsAt, allDay) {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  const options = {
    month: "long",
    day: "numeric",
    hour: allDay ? undefined : "numeric",
    minute: allDay ? undefined : "2-digit",
    hour12: true,
  };

  if (allDay) {
    return startDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  }

  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (startDate.toDateString() === endDate.toDateString()) {
    return `${startDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })} ${startTime}`;
  }

  const endTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${startDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })} ${startTime} - ${endDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })} ${endTime}`;
}

export default async function EventsPage() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role ?? "User";
  const allowedRoles = new Set(["ClubLeader", "ASWU", "Faculty", "Admin"]);
  const canCreate = allowedRoles.has(role);

  let events = [];
  try {
    events = await prisma.event.findMany({
      where: { published: true, moderationStatus: "Approved" },
      include: { organizer: { select: { name: true, role: true } } }, // include role
      orderBy: { startsAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    events = [];
  }

  const transformedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || "",
    image: event.imageUrl || "/whitworth.png",
    location: getLocationName(event.location),
    locationId: event.location,
    date: formatEventDate(event.startsAt, event.endsAt, event.allDay),
    organizer: event.organizer?.name || "Unknown",
    organizerRole: event.organizer?.role ?? "Unknown",
  }));

  return (
    <main className="animate-fade-in">
      <div className="flex justify-end my-4 mx-4">
        {canCreate && (
          <Link href="/events/editor">
            <Button>
              <CalendarPlus />
              Create New Event
            </Button>
          </Link>
        )}
      </div>
      <section className="hidden md:grid justify-center mt-16 mx-10 grid-cols-4 gap-4">
        {transformedEvents.length === 0 ? (
          <p className="col-span-4 text-center text-lg text-muted-foreground">
            No events scheduled. Create the first event!
          </p>
        ) : (
          transformedEvents
            .toReversed()
            .map((event) => <EventCard key={event.id} {...event} />)
        )}
      </section>
      <section className="grid md:hidden justify-center mt-16 mx-10 grid-cols-1 gap-4">
        {transformedEvents.length === 0 ? (
          <p className="col-span-1 text-center text-lg text-muted-foreground">
            No events scheduled. Create the first event!
          </p>
        ) : (
          transformedEvents
            .toReversed()
            .map((event) => <EventCard key={event.id} {...event} />)
        )}
      </section>
    </main>
  );
}
