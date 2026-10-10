// Event times are stored as real moments in time (UTC) and always shown in
// the campus time zone, no matter where the server or the viewer is.
export const CAMPUS_TIME_ZONE =
  process.env.NEXT_PUBLIC_CAMPUS_TIME_ZONE || "America/Los_Angeles";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: CAMPUS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "YYYY-MM-DD" of the campus calendar day a moment falls on.
export function campusDayKey(date) {
  return dayKeyFormat.format(new Date(date));
}

// Every campus calendar day an event touches, so the events calendar can
// mark multi-day events on each of their days. Capped so a bad end date
// can't generate an unbounded list.
export function campusDayKeys(startsAt, endsAt) {
  const first = campusDayKey(startsAt);
  const last = campusDayKey(endsAt);
  const [year, month, day] = first.split("-").map(Number);
  // Walk the days on a UTC calendar so DST changes can't skip or repeat one.
  const cursor = new Date(Date.UTC(year, month - 1, day));

  const keys = [];
  while (keys.length < 366) {
    const key = cursor.toISOString().slice(0, 10);
    if (key > last) break;
    keys.push(key);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys.length ? keys : [first];
}

// A moment `days` days ago, for coarse "recent" database filters.
export function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
