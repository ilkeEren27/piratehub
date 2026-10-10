// Marketplace config. Keys mirror the Prisma `ListingCategory` and
// `ListingCondition` enums; labels are translated in messages/*.json under
// marketplace.categories.* and marketplace.conditions.*
export const LISTING_CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
  "Tickets",
  "Services",
  "Other",
];

export const LISTING_CONDITIONS = ["New", "LikeNew", "Good", "Fair", "Poor"];

export const CATEGORY_STYLES = {
  Textbooks: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  Electronics:
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  Furniture:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Clothing: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  Tickets:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Services: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  Other: "bg-secondary/20 text-foreground/80 border-secondary/40",
};

export const MAX_LISTING_MEDIA = 8;
export const MAX_LISTING_VIDEOS = 2;
export const MAX_PRICE_CENTS = 10_000_000; // $100,000
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const LISTING_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const LISTING_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// A listing is hidden and sent back to the moderation queue once this many
// different pirates have reported it.
export const REPORTS_BEFORE_AUTO_HIDE = 3;

export function isValidCategory(value) {
  return LISTING_CATEGORIES.includes(value);
}

export function isValidCondition(value) {
  return LISTING_CONDITIONS.includes(value);
}

export function isVideoMime(mimeType) {
  return LISTING_VIDEO_TYPES.includes(mimeType);
}

// "12.5" -> 1250. Returns null for anything that isn't a non-negative amount
// with at most two decimals.
export function parsePriceToCents(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function formatPrice(cents, locale = "en") {
  return new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

// Items that can't be sold on the marketplace (see the marketplace terms).
// A match doesn't reject the listing outright — plenty of matches are
// innocent ("wine rack", "water gun") — it holds the listing for a moderator.
const PROHIBITED_TERMS = [
  "gun",
  "firearm",
  "handgun",
  "pistol",
  "rifle",
  "shotgun",
  "ammo",
  "ammunition",
  "taser",
  "brass knuckles",
  "weed",
  "marijuana",
  "cannabis",
  "thc",
  "cbd",
  "edible",
  "shroom",
  "vape",
  "juul",
  "nicotine",
  "cigarette",
  "cigar",
  "tobacco",
  "alcohol",
  "beer",
  "wine",
  "vodka",
  "whiskey",
  "tequila",
  "liquor",
  "adderall",
  "xanax",
  "oxy",
  "percocet",
  "prescription",
  "pill",
  "fake id",
  "counterfeit",
  "replica",
  "test bank",
  "answer key",
  "exam answers",
  "essay writing",
  "write your essay",
  "puppy",
  "kitten",
];

const PROHIBITED_PATTERN = new RegExp(
  `\\b(${PROHIBITED_TERMS.map((term) => term.replace(/ /g, "\\s+")).join("|")})(s|es)?\\b`,
  "i"
);

export function mentionsProhibitedItem(text) {
  return PROHIBITED_PATTERN.test(text);
}
