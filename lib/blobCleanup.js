import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { isTrustedUploadUrl } from "@/lib/uploads";
import { extractImageSources } from "@/lib/tiptap";

const FOLDERS = ["social", "events", "marketplace", "avatars"];

// Removes uploaded files from Blob storage once nothing references them
// (deleted posts, replaced images, deleted accounts). Uploads are public
// URLs, so without this a removed post's files would stay reachable.
// Never throws: a failure only leaves an unused file behind.
export async function deleteUploads(urls) {
  const unique = [
    ...new Set(
      (urls ?? []).filter((url) =>
        FOLDERS.some((folder) => isTrustedUploadUrl(url, folder))
      )
    ),
  ];
  if (!unique.length) return;

  try {
    await del(unique);
  } catch (error) {
    console.error("Failed to delete uploaded files:", error);
  }
}

// Files referenced before an edit that the edited version no longer uses.
export function removedUrls(before, after) {
  const kept = new Set(after.filter(Boolean));
  return before.filter((url) => url && !kept.has(url));
}

// Every file a user uploaded that disappears with their account: avatar,
// posts (attachments and inline images) and listing media. Events they
// organized are kept, so their images are too.
export async function collectUserUploads(userId) {
  const [user, posts, listings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { image: true } }),
    prisma.post.findMany({
      where: { authorId: userId },
      select: { contentJson: true, attachments: { select: { url: true } } },
    }),
    prisma.listing.findMany({
      where: { sellerId: userId },
      select: { attachments: { select: { url: true } } },
    }),
  ]);
  return [
    user?.image,
    ...posts.flatMap(postUploadUrls),
    ...listings.flatMap((listing) => listing.attachments.map((a) => a.url)),
  ];
}

// Every upload a post references: attachments plus images in the body.
export function postUploadUrls(post) {
  return [
    ...(post.attachments ?? []).map((a) => a.url),
    ...extractImageSources(post.contentJson),
  ];
}
