"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { customAlphabet } from "nanoid";
import { checkBlocklist, checkOpenAIModeration } from "@/lib/moderation";
import { isTrustedUploadUrl } from "@/lib/uploads";
import { assertContentRateLimit } from "@/lib/rateLimit";
import { deleteUploads, removedUrls } from "@/lib/blobCleanup";
import {
  LISTING_IMAGE_TYPES,
  LISTING_VIDEO_TYPES,
  MAX_LISTING_MEDIA,
  MAX_LISTING_VIDEOS,
  MAX_PRICE_CENTS,
  REPORTS_BEFORE_AUTO_HIDE,
  isValidCategory,
  isValidCondition,
  isVideoMime,
  mentionsProhibitedItem,
  parsePriceToCents,
} from "@/lib/marketplace";

import slugify from "slugify";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 8);

const MEDIA_TYPES = new Set([...LISTING_IMAGE_TYPES, ...LISTING_VIDEO_TYPES]);

function isModeratorRole(user) {
  return user?.role === "Admin" || user?.role === "Moderator";
}

export async function upsertListingAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = formData.get("id");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priceCents = parsePriceToCents(formData.get("price"));
  const negotiable = formData.get("negotiable") === "on";
  const category = String(formData.get("category") || "Other");
  const condition = String(formData.get("condition") || "") || null;
  const contactInfo = String(formData.get("contactInfo") || "").trim();
  const acceptedTerms = formData.get("acceptTerms") === "on";
  const media = JSON.parse(formData.get("media") || "[]");

  // The seller must accept the marketplace terms every time they publish or
  // change a listing; we store when they did.
  if (!acceptedTerms) {
    throw new Error("You must accept the marketplace terms to post a listing");
  }
  if (!title) throw new Error("Title is required");
  if (title.length > 120) throw new Error("Title is too long");
  if (!description) throw new Error("Description is required");
  if (description.length > 5000) throw new Error("Description is too long");
  if (priceCents === null) throw new Error("Enter a valid price");
  if (priceCents > MAX_PRICE_CENTS) throw new Error("Price is too high");
  if (!isValidCategory(category)) throw new Error("Invalid category");
  if (condition && !isValidCondition(condition)) {
    throw new Error("Invalid condition");
  }
  if (!contactInfo) throw new Error("Contact info is required");
  if (contactInfo.length > 200) throw new Error("Contact info is too long");

  if (!Array.isArray(media) || media.length > MAX_LISTING_MEDIA) {
    throw new Error("Too many photos or videos");
  }
  if (
    !media.every(
      (m) =>
        isTrustedUploadUrl(m?.url, "marketplace") && MEDIA_TYPES.has(m?.mimeType)
    )
  ) {
    throw new Error("Invalid photo or video");
  }
  if (media.filter((m) => isVideoMime(m.mimeType)).length > MAX_LISTING_VIDEOS) {
    throw new Error("Too many videos");
  }

  // Content moderation — same pipeline as posts and events. Listings that
  // mention a prohibited item are also held for a moderator.
  const textToCheck = [title, description, contactInfo].join(" ");
  if (checkBlocklist(textToCheck)) {
    throw new Error(
      "Your listing contains inappropriate language and cannot be submitted."
    );
  }
  const { flagged } = await checkOpenAIModeration(textToCheck);
  let moderationStatus =
    flagged || mentionsProhibitedItem(textToCheck) ? "Pending" : "Approved";

  const mediaData = media.map((m) => ({
    url: String(m.url),
    fileName: m.fileName ? String(m.fileName).slice(0, 255) : null,
    mimeType: String(m.mimeType),
    sizeBytes: Number.isFinite(m.sizeBytes) ? m.sizeBytes : null,
  }));

  const data = {
    title,
    description,
    priceCents,
    negotiable,
    category,
    condition,
    contactInfo,
    termsAcceptedAt: new Date(),
  };

  if (id) {
    const existing = await prisma.listing.findUnique({
      where: { id: Number(id) },
      select: {
        sellerId: true,
        slug: true,
        moderationStatus: true,
        attachments: { select: { url: true } },
      },
    });
    if (!existing) throw new Error("Listing not found");

    const isOwner = existing.sellerId === user.id;
    if (!isOwner && !isModeratorRole(user)) {
      throw new Error("You do not have permission to edit this listing");
    }
    // Editing a rejected listing never re-publishes it on its own; it goes
    // back to the queue for a moderator to look at again.
    if (existing.moderationStatus === "Rejected" && !isModeratorRole(user)) {
      moderationStatus = "Pending";
    }

    await prisma.listing.update({
      where: { id: Number(id) },
      data: {
        ...data,
        moderationStatus,
        attachments: { deleteMany: {}, create: mediaData },
      },
    });
    await deleteUploads(
      removedUrls(
        existing.attachments.map((a) => a.url),
        mediaData.map((m) => m.url)
      )
    );
    return { slug: existing.slug, moderationStatus };
  }

  await assertContentRateLimit("listing", user.id);

  const base = slugify(title, { lower: true, strict: true }) || "listing";
  const slug = `${base}-${nanoid()}`;

  await prisma.listing.create({
    data: {
      ...data,
      slug,
      moderationStatus,
      sellerId: user.id,
      attachments: { create: mediaData },
    },
  });
  return { slug, moderationStatus };
}

export async function deleteListingAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Listing id is required");

  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { sellerId: true, attachments: { select: { url: true } } },
  });
  if (!existing) throw new Error("Listing not found");

  if (existing.sellerId !== user.id && !isModeratorRole(user)) {
    throw new Error("You do not have permission to delete this listing");
  }

  await prisma.listing.delete({ where: { id } });
  // Uploads are public URLs; remove them so a deleted listing is really gone.
  await deleteUploads(existing.attachments.map((a) => a.url));
  revalidatePath("/[locale]/admin/moderation", "page");
}

export async function setListingSoldAction(listingId, sold) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = Number(listingId);
  const existing = await prisma.listing.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!existing) throw new Error("Listing not found");
  if (existing.sellerId !== user.id && !isModeratorRole(user)) {
    throw new Error("You do not have permission to change this listing");
  }

  await prisma.listing.update({ where: { id }, data: { sold: !!sold } });
  return { sold: !!sold };
}

export async function reportListingAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const listingId = Number(formData.get("listingId"));
  const reason = String(formData.get("reason") || "").trim();
  if (!listingId) throw new Error("Listing id is required");
  if (!reason) throw new Error("Please tell us what's wrong");
  if (reason.length > 500) throw new Error("Reason is too long");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });
  if (!listing) throw new Error("Listing not found");
  if (listing.sellerId === user.id) {
    throw new Error("You can't report your own listing");
  }

  const alreadyReported = await prisma.listingReport.findUnique({
    where: { reporterId_listingId: { reporterId: user.id, listingId } },
    select: { id: true },
  });
  if (!alreadyReported) await assertContentRateLimit("listingReport", user.id);

  // One report per pirate per listing; reporting again updates the reason.
  await prisma.listingReport.upsert({
    where: { reporterId_listingId: { reporterId: user.id, listingId } },
    update: { reason },
    create: { reason, reporterId: user.id, listingId },
  });

  const reportCount = await prisma.listingReport.count({ where: { listingId } });
  if (reportCount >= REPORTS_BEFORE_AUTO_HIDE) {
    await prisma.listing.updateMany({
      where: { id: listingId, moderationStatus: "Approved" },
      data: { moderationStatus: "Pending" },
    });
  }
}

export async function moderateListingAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  if (!isModeratorRole(user)) throw new Error("Not authorized");

  const id = Number(formData.get("id"));
  const status = formData.get("status"); // "Approved" | "Rejected"

  if (!["Approved", "Rejected"].includes(status)) {
    throw new Error("Invalid status");
  }

  // A moderator decision resolves any open reports on the listing.
  await prisma.$transaction([
    prisma.listing.update({
      where: { id },
      data: { moderationStatus: status },
    }),
    prisma.listingReport.deleteMany({ where: { listingId: id } }),
  ]);
  revalidatePath("/[locale]/admin/moderation", "page");
}
