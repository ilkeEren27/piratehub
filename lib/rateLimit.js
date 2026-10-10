import { prisma } from "@/lib/db";

// In-memory sliding-window limiter. Each server instance keeps its own
// counts, so this only slows down bursts; use countRecentRows for limits
// that must hold across instances.
const globalForRateLimit = globalThis;
const attemptsByKey = globalForRateLimit.rateLimitAttempts || new Map();
if (!globalForRateLimit.rateLimitAttempts) {
  globalForRateLimit.rateLimitAttempts = attemptsByKey;
}

export function consumeRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const earliestAllowed = now - windowMs;
  const attempts = (attemptsByKey.get(key) || []).filter(
    (attempt) => attempt > earliestAllowed
  );

  if (attempts.length >= limit) return false;

  attempts.push(now);
  attemptsByKey.set(key, attempts);

  if (attemptsByKey.size > 5000) {
    for (const [otherKey, timestamps] of attemptsByKey) {
      if (!timestamps.some((attempt) => attempt > earliestAllowed)) {
        attemptsByKey.delete(otherKey);
      }
    }
  }

  return true;
}

// Database-backed limits for content creation: counts what the user already
// created in the window, so it holds no matter which instance handles the
// request. `model` is a Prisma delegate name, e.g. "post".
const CONTENT_LIMITS = {
  post: { ownerField: "authorId", limit: 5, windowMs: 10 * 60 * 1000 },
  comment: { ownerField: "authorId", limit: 20, windowMs: 5 * 60 * 1000 },
  event: { ownerField: "organizerId", limit: 10, windowMs: 60 * 60 * 1000 },
  listing: { ownerField: "sellerId", limit: 10, windowMs: 60 * 60 * 1000 },
  listingReport: { ownerField: "reporterId", limit: 10, windowMs: 60 * 60 * 1000 },
  report: { ownerField: "reporterId", limit: 10, windowMs: 60 * 60 * 1000 },
};

export async function assertContentRateLimit(model, userId) {
  const { ownerField, limit, windowMs } = CONTENT_LIMITS[model];
  const recent = await prisma[model].count({
    where: {
      [ownerField]: userId,
      createdAt: { gte: new Date(Date.now() - windowMs) },
    },
  });
  if (recent >= limit) {
    throw new Error("You're doing that too often. Please wait a few minutes.");
  }
}
