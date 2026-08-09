"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, CalendarX2, X } from "lucide-react";

import EventCard from "@/components/cards/EventCard";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

// "YYYY-MM-DD" for a local date. The server builds each event's dayKeys the
// same way, so a day the user clicks lines up with the days an event covers.
export function toDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function EventsBrowser({ events, locale }) {
  const t = useTranslations("events");
  const [selectedDay, setSelectedDay] = useState(null);

  // Every day that has at least one event, for the dots on the calendar.
  const busyDays = useMemo(
    () => new Set(events.flatMap((event) => event.dayKeys)),
    [events]
  );

  // Without an explicit range the year dropdown stops at the current year.
  const [firstMonth, lastMonth] = useMemo(() => {
    const year = new Date().getFullYear();
    return [new Date(year - 1, 0, 1), new Date(year + 3, 11, 31)];
  }, []);

  const selectedKey = selectedDay ? toDayKey(selectedDay) : null;
  const visibleEvents = selectedKey
    ? events.filter((event) => event.dayKeys.includes(selectedKey))
    : events;

  const selectedLabel = selectedDay
    ? selectedDay.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
      {/* Date picker */}
      <aside className="w-full rounded-2xl border border-border/50 bg-card shadow-sm p-4 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            {t("calendarTitle")}
          </h2>
          {selectedDay && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDay(null)}
            >
              <X className="w-4 h-4" />
              {t("allDates")}
            </Button>
          )}
        </div>

        <Calendar
          mode="single"
          selected={selectedDay ?? undefined}
          onSelect={(day) => setSelectedDay(day ?? null)}
          captionLayout="dropdown"
          startMonth={firstMonth}
          endMonth={lastMonth}
          className="mx-auto [--cell-size:--spacing(9)]"
          modifiers={{ hasEvent: (day) => busyDays.has(toDayKey(day)) }}
          modifiersClassNames={{
            hasEvent:
              "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary data-[selected=true]:after:bg-primary-foreground",
          }}
        />

        <p className="mt-2 text-sm text-muted-foreground text-center">
          {selectedDay
            ? t("eventsOnDay", {
                date: selectedLabel,
                count: visibleEvents.length,
              })
            : t("allEventsCount", { count: events.length })}
        </p>
      </aside>

      {/* Event grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleEvents.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-4 py-16 rounded-xl border border-dashed bg-card/50 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              {selectedDay ? (
                <CalendarX2 className="h-7 w-7 text-primary" />
              ) : (
                <CalendarDays className="h-7 w-7 text-primary" />
              )}
            </div>
            <p className="text-lg text-muted-foreground max-w-md px-4">
              {selectedDay ? t("noEventsOnDay") : t("noEvents")}
            </p>
            {selectedDay && (
              <Button variant="outline" onClick={() => setSelectedDay(null)}>
                {t("allDates")}
              </Button>
            )}
          </div>
        ) : (
          visibleEvents.map((event) => (
            <EventCard key={event.id} {...event} locale={locale} />
          ))
        )}
      </section>
    </div>
  );
}
