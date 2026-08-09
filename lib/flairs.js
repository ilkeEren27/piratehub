// Flair config for the social board. Keys mirror the Prisma `Flair` enum;
// labels are translated in messages/*.json under social.flairs.*
export const FLAIRS = [
  "General",
  "Class",
  "Clubs",
  "Events",
  "Announcements",
  "Help",
];

export const FLAIR_STYLES = {
  General:
    "bg-secondary/20 text-foreground/80 border-secondary/40",
  Class:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  Clubs:
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  Events:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Announcements:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Help:
    "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

export function isValidFlair(flair) {
  return FLAIRS.includes(flair);
}
