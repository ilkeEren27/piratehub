"use server";

import { del } from "@vercel/blob";
import { getSessionUser } from "@/utils/roles";

// Deletes a replaced profile picture from Blob storage so old avatars don't
// pile up. Ownership is proven by the blob path: the upload route stores
// avatars under `avatars/<userId>/`, so a user can only delete their own.
// Call this *after* the user record has been updated — a failure here only
// leaves an unused file, never a broken image.
export async function deleteAvatarBlobAction(url) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  if (!url) return { deleted: false };

  let pathname;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return { deleted: false };
    }
    pathname = parsed.pathname;
  } catch {
    return { deleted: false };
  }

  if (!pathname.startsWith(`/avatars/${user.id}/`)) {
    return { deleted: false };
  }

  try {
    await del(url);
    return { deleted: true };
  } catch (error) {
    console.error("Failed to delete old avatar:", error);
    return { deleted: false };
  }
}
