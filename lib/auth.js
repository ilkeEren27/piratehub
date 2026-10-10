import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { checkBlocklist } from "@/lib/moderation";
import { isOwnAvatarUrl } from "@/lib/uploads";
import { collectUserUploads, deleteUploads } from "@/lib/blobCleanup";

const MAX_NAME_LENGTH = 50;

// Optional: comma-separated email domains allowed to sign up, e.g.
// "school.edu". When unset, anyone can create an account.
const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || "")
  .split(",")
  .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
  .filter(Boolean);

function rejectWith(code, message) {
  throw new APIError("BAD_REQUEST", { code, message });
}

function isAllowedEmail(email) {
  if (!ALLOWED_EMAIL_DOMAINS.length) return true;
  const domain = String(email).toLowerCase().split("@").pop();
  return ALLOWED_EMAIL_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
}

// Display names show up next to everything a user posts, so they get the
// same blocklist as posts and a hard length limit.
function cleanName(name) {
  const trimmed = String(name ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) rejectWith("INVALID_NAME", "Name is required");
  if (trimmed.length > MAX_NAME_LENGTH) {
    rejectWith("NAME_TOO_LONG", `Name must be at most ${MAX_NAME_LENGTH} characters`);
  }
  if (checkBlocklist(trimmed)) {
    rejectWith("INAPPROPRIATE_NAME", "That name contains inappropriate language");
  }
  return trimmed;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ user, url });
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ user, url });
    },
  },
  user: {
    additionalFields: {
      // Role lives only in our DB. `input: false` means clients can never
      // set it during sign-up — only the admin panel (server-side) can.
      role: {
        type: "string",
        defaultValue: "User",
        input: false,
      },
      termsAcceptedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
    // Pirates can delete their own account from the profile page (they
    // confirm with their password).
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await deleteUploads(await collectUserUploads(user.id));
      },
    },
  },
  // Request-level checks, run before Better Auth handles the endpoint.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        if (ctx.body?.acceptTerms !== true) {
          rejectWith(
            "TERMS_NOT_ACCEPTED",
            "You must accept the Terms of Service and Privacy Policy"
          );
        }
        if (!isAllowedEmail(ctx.body?.email)) {
          rejectWith(
            "EMAIL_DOMAIN_NOT_ALLOWED",
            "Sign-up is limited to campus email addresses"
          );
        }
        if (ctx.body?.image) {
          rejectWith("INVALID_IMAGE", "Upload a profile picture after signing up");
        }
        cleanName(ctx.body?.name);
      }

      if (ctx.path === "/update-user") {
        if (ctx.body && "name" in ctx.body) cleanName(ctx.body.name);
        // Avatars must be a file this user uploaded through /api/upload;
        // any other URL would load a stranger's image (or tracking pixel)
        // for everyone who sees the avatar.
        if (ctx.body?.image) {
          const session = await getSessionFromCtx(ctx);
          if (!isOwnAvatarUrl(ctx.body.image, session?.user?.id)) {
            rejectWith("INVALID_IMAGE", "Invalid profile picture");
          }
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Every account is created through the sign-up form, which the hook
        // above only lets through once the Terms box is ticked.
        before: async (user) => ({
          data: {
            ...user,
            name: cleanName(user.name),
            termsAcceptedAt: new Date(),
          },
        }),
      },
      update: {
        before: async (data) =>
          "name" in data ? { data: { ...data, name: cleanName(data.name) } } : undefined,
      },
    },
  },
  // Must be the last plugin: makes set-cookie work in server actions.
  plugins: [nextCookies()],
});
