"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { customAlphabet } from "nanoid";
import { checkBlocklist, checkOpenAIModeration } from "@/lib/moderation";
import { isTrustedUploadUrl } from "@/lib/uploads";
import { sanitizeDoc } from "@/lib/tiptap";
import { assertContentRateLimit } from "@/lib/rateLimit";
import { deleteUploads } from "@/lib/blobCleanup";
import { places } from "@/data/places";

import slugify from "slugify";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 8);
const EVENT_CREATOR_ROLES = new Set(["ClubLeader", "ASWU", "Faculty", "Admin"]);
const PLACE_IDS = new Set(places.map((place) => place.id));

export async function upsertEventAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = formData.get("id");
  if (!id && !EVENT_CREATOR_ROLES.has(user.role)) {
    throw new Error("You do not have permission to create events");
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const detailsJson = formData.get("detailsJson")
    ? sanitizeDoc(JSON.parse(formData.get("detailsJson")))
    : null;
  const imageUrl = formData.get("imageUrl") || null;
  const location = String(formData.get("location") || "").trim();
  // The form sends UTC ISO strings, so these are exact moments in time.
  const startsAt = new Date(formData.get("startsAt"));
  const endsAt = new Date(formData.get("endsAt"));
  const allDay =
    formData.get("allDay") === "on" || formData.get("allDay") === "true";

  if (!title) throw new Error("Title is required");
  if (title.length > 255) throw new Error("Title is too long");
  if (description && description.length > 5000) {
    throw new Error("Description is too long");
  }
  if (imageUrl && !isTrustedUploadUrl(imageUrl, "events")) {
    throw new Error("Invalid event image");
  }
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Invalid dates");
  }
  if (startsAt > endsAt)
    throw new Error("End date can't be earlier than start date");
  if (!location) throw new Error("Location is required");
  if (!PLACE_IDS.has(location)) throw new Error("Unknown location");

  // Content moderation
  const textToCheck = [title, description].filter(Boolean).join(" ");

  if (checkBlocklist(textToCheck)) {
    throw new Error(
      "Your event contains inappropriate language and cannot be submitted."
    );
  }

  const { flagged } = await checkOpenAIModeration(textToCheck);
  let moderationStatus = flagged ? "Pending" : "Approved";
  const isModerator = user.role === "Admin" || user.role === "Moderator";

  if (id) {
    const existing = await prisma.event.findUnique({
      where: { id: Number(id) },
      select: { organizerId: true, imageUrl: true, moderationStatus: true },
    });
    if (!existing) throw new Error("Event not found");

    const isOwner = existing.organizerId === user.id;
    if (!isOwner && !isModerator) {
      throw new Error("You do not have permission to edit this event");
    }
    // Editing a rejected event never re-publishes it on its own.
    if (existing.moderationStatus === "Rejected" && !isModerator) {
      moderationStatus = "Pending";
    }

    await prisma.event.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        detailsJson,
        imageUrl,
        location,
        startsAt,
        endsAt,
        allDay,
        moderationStatus,
      },
    });
    if (existing.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteUploads([existing.imageUrl]);
    }
    return { moderationStatus };
  }

  await assertContentRateLimit("event", user.id);

  const base = slugify(title, { lower: true, strict: true }) || "event";
  const slug = `${base}-${nanoid()}`;

  await prisma.event.create({
    data: {
      title,
      slug,
      description,
      detailsJson,
      imageUrl,
      location,
      startsAt,
      endsAt,
      allDay,
      organizerId: user.id,
      published: true,
      moderationStatus,
    },
  });
  return { moderationStatus };
}

export async function deleteEventAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Event id is required");

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { organizerId: true, imageUrl: true },
  });
  if (!existing) throw new Error("Event not found");

  const isOwner = existing.organizerId === user.id;
  const isModerator = user.role === "Admin" || user.role === "Moderator";
  if (!isOwner && !isModerator) {
    throw new Error("You do not have permission to delete this event");
  }

  await prisma.event.delete({ where: { id } });
  await deleteUploads([existing.imageUrl]);
  revalidatePath("/[locale]/admin/moderation", "page");
}

export async function moderateEventAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  if (user.role !== "Admin" && user.role !== "Moderator") {
    throw new Error("Not authorized");
  }

  const id = Number(formData.get("id"));
  const status = formData.get("status"); // "Approved" | "Rejected"

  if (!["Approved", "Rejected"].includes(status)) {
    throw new Error("Invalid status");
  }

  await prisma.event.update({
    where: { id },
    data: { moderationStatus: status },
  });
  revalidatePath("/[locale]/admin/moderation", "page");
}
