import { consumeRateLimit } from "@/lib/rateLimit";

// Per-user upload rate limit shared by the upload routes.
export function consumeUploadQuota(userId) {
  return consumeRateLimit(`upload:${userId}`, 10, 60 * 1000);
}
