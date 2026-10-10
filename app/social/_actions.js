"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { customAlphabet } from "nanoid";
import { checkBlocklist, checkOpenAIModeration } from "@/lib/moderation";
import { isValidFlair } from "@/lib/flairs";
import { sanitizeDoc, extractText, makeExcerpt } from "@/lib/tiptap";
import { isTrustedUploadUrl } from "@/lib/uploads";
import { assertContentRateLimit, consumeRateLimit } from "@/lib/rateLimit";
import { deleteUploads, postUploadUrls, removedUrls } from "@/lib/blobCleanup";

import slugify from "slugify";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 8);

function isModeratorRole(user) {
  return user?.role === "Admin" || user?.role === "Moderator";
}

const MAX_ATTACHMENTS = 5;

// Once this many different pirates report a post or comment, it is hidden
// and sent back to the moderation queue.
const REPORTS_BEFORE_AUTO_HIDE = 3;

// Posts a user may interact with (vote, comment): approved ones, plus their
// own and — for moderators — pending ones.
async function findInteractablePost(postId, user) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, moderationStatus: true },
  });
  if (!post) return null;
  if (post.moderationStatus === "Approved") return post;
  if (post.moderationStatus === "Pending") {
    if (post.authorId === user.id || isModeratorRole(user)) return post;
  }
  return null;
}

export async function upsertPostAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = formData.get("id");
  const title = String(formData.get("title") || "").trim();
  const flair = String(formData.get("flair") || "General");
  const contentJson = sanitizeDoc(
    JSON.parse(formData.get("contentJson") || "null")
  );
  const attachments = JSON.parse(formData.get("attachments") || "[]");

  if (!title) throw new Error("Title is required");
  if (title.length > 255) throw new Error("Title is too long");
  if (!isValidFlair(flair)) throw new Error("Invalid flair");
  if (!contentJson?.type) throw new Error("Post body is required");
  if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) {
    throw new Error("Too many attachments");
  }
  if (!attachments.every((attachment) => isTrustedUploadUrl(attachment?.url, "social"))) {
    throw new Error("Invalid attachment");
  }

  const bodyText = extractText(contentJson);
  if (!bodyText && !contentJson.content?.some((n) => n.type === "image")) {
    throw new Error("Post body is required");
  }

  // Content moderation — same pipeline as events
  const textToCheck = [title, bodyText].filter(Boolean).join(" ");
  if (checkBlocklist(textToCheck)) {
    throw new Error(
      "Your post contains inappropriate language and cannot be submitted."
    );
  }
  const { flagged } = await checkOpenAIModeration(textToCheck);
  let moderationStatus = flagged ? "Pending" : "Approved";

  const attachmentData = attachments.map((a) => ({
    url: String(a.url),
    fileName: a.fileName ? String(a.fileName).slice(0, 255) : null,
    mimeType: a.mimeType ? String(a.mimeType) : null,
    sizeBytes: Number.isFinite(a.sizeBytes) ? a.sizeBytes : null,
  }));

  if (id) {
    const existing = await prisma.post.findUnique({
      where: { id: Number(id) },
      select: {
        authorId: true,
        slug: true,
        moderationStatus: true,
        contentJson: true,
        attachments: { select: { url: true } },
      },
    });
    if (!existing) throw new Error("Post not found");

    const isOwner = existing.authorId === user.id;
    if (!isOwner && !isModeratorRole(user)) {
      throw new Error("You do not have permission to edit this post");
    }
    // Editing a rejected post never re-publishes it on its own; it goes back
    // to the queue for a moderator to look at again.
    if (existing.moderationStatus === "Rejected" && !isModeratorRole(user)) {
      moderationStatus = "Pending";
    }

    await prisma.post.update({
      where: { id: Number(id) },
      data: {
        title,
        flair,
        contentJson,
        excerpt: makeExcerpt(contentJson),
        moderationStatus,
        attachments: {
          deleteMany: {},
          create: attachmentData,
        },
      },
    });
    await deleteUploads(
      removedUrls(
        postUploadUrls(existing),
        postUploadUrls({ contentJson, attachments: attachmentData })
      )
    );
    return { slug: existing.slug, moderationStatus };
  }

  await assertContentRateLimit("post", user.id);

  const base = slugify(title, { lower: true, strict: true }) || "post";
  const slug = `${base}-${nanoid()}`;

  await prisma.post.create({
    data: {
      title,
      slug,
      flair,
      contentJson,
      excerpt: makeExcerpt(contentJson),
      published: true,
      moderationStatus,
      authorId: user.id,
      attachments: { create: attachmentData },
    },
  });
  return { slug, moderationStatus };
}

export async function deletePostAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Post id is required");

  const existing = await prisma.post.findUnique({
    where: { id },
    select: {
      authorId: true,
      contentJson: true,
      attachments: { select: { url: true } },
    },
  });
  if (!existing) throw new Error("Post not found");

  if (existing.authorId !== user.id && !isModeratorRole(user)) {
    throw new Error("You do not have permission to delete this post");
  }

  await prisma.post.delete({ where: { id } });
  // Uploads are public URLs; remove them so a deleted post is really gone.
  await deleteUploads(postUploadUrls(existing));
  revalidatePath("/[locale]/admin/moderation", "page");
}

// value: 1 (upvote) or -1 (downvote). Voting the same way twice removes
// the vote, voting the other way switches it — Reddit semantics.
export async function votePostAction(postId, value) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  if (value !== 1 && value !== -1) throw new Error("Invalid vote");
  if (!consumeRateLimit(`vote:${user.id}`, 60, 60 * 1000)) {
    throw new Error("You're voting too fast. Please slow down.");
  }

  postId = Number(postId);
  if (!(await findInteractablePost(postId, user))) {
    throw new Error("Post not found");
  }

  const existing = await prisma.postVote.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (existing?.value === value) {
    await prisma.postVote.delete({ where: { id: existing.id } });
    return { myVote: 0 };
  }

  await prisma.postVote.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    update: { value },
    create: { userId: user.id, postId, value },
  });
  return { myVote: value };
}

export async function voteCommentAction(commentId, value) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  if (value !== 1 && value !== -1) throw new Error("Invalid vote");
  if (!consumeRateLimit(`vote:${user.id}`, 60, 60 * 1000)) {
    throw new Error("You're voting too fast. Please slow down.");
  }

  commentId = Number(commentId);
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { postId: true },
  });
  if (!comment || !(await findInteractablePost(comment.postId, user))) {
    throw new Error("Comment not found");
  }

  const existing = await prisma.commentVote.findUnique({
    where: { userId_commentId: { userId: user.id, commentId } },
  });

  if (existing?.value === value) {
    await prisma.commentVote.delete({ where: { id: existing.id } });
    return { myVote: 0 };
  }

  await prisma.commentVote.upsert({
    where: { userId_commentId: { userId: user.id, commentId } },
    update: { value },
    create: { userId: user.id, commentId, value },
  });
  return { myVote: value };
}

export async function createCommentAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const postId = Number(formData.get("postId"));
  const parentId = formData.get("parentId")
    ? Number(formData.get("parentId"))
    : null;
  const content = String(formData.get("content") || "").trim();

  if (!postId) throw new Error("Post id is required");
  if (!content) throw new Error("Comment can't be empty");
  if (content.length > 5000) throw new Error("Comment is too long");

  if (checkBlocklist(content)) {
    throw new Error(
      "Your comment contains inappropriate language and cannot be submitted."
    );
  }

  if (!(await findInteractablePost(postId, user))) {
    throw new Error("Post not found");
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { postId: true },
    });
    if (!parent || parent.postId !== postId) {
      throw new Error("Parent comment not found");
    }
  }

  await assertContentRateLimit("comment", user.id);

  // Same moderation as posts: flagged comments wait for a moderator.
  const { flagged } = await checkOpenAIModeration(content);

  await prisma.comment.create({
    data: {
      content,
      postId,
      parentId,
      authorId: user.id,
      moderationStatus: flagged ? "Pending" : "Approved",
    },
  });
  return { moderationStatus: flagged ? "Pending" : "Approved" };
}

export async function deleteCommentAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Comment id is required");

  const existing = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!existing) throw new Error("Comment not found");

  if (existing.authorId !== user.id && !isModeratorRole(user)) {
    throw new Error("You do not have permission to delete this comment");
  }

  await prisma.comment.delete({ where: { id } });
  revalidatePath("/[locale]/admin/moderation", "page");
}

// kind: "post" | "comment"
export async function reportContentAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");

  const kind = formData.get("kind");
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") || "").trim();
  if (kind !== "post" && kind !== "comment") throw new Error("Invalid report");
  if (!id) throw new Error("Missing id");
  if (!reason) throw new Error("Please tell us what's wrong");
  if (reason.length > 500) throw new Error("Reason is too long");

  const target =
    kind === "post"
      ? await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
      : await prisma.comment.findUnique({ where: { id }, select: { authorId: true } });
  if (!target) throw new Error("Not found");
  if (target.authorId === user.id) {
    throw new Error("You can't report your own content");
  }

  const field = kind === "post" ? "postId" : "commentId";
  const uniqueKey = kind === "post" ? "reporterId_postId" : "reporterId_commentId";
  const existing = await prisma.report.findUnique({
    where: { [uniqueKey]: { reporterId: user.id, [field]: id } },
    select: { id: true },
  });
  // One report per pirate per item; reporting again updates the reason.
  if (existing) {
    await prisma.report.update({ where: { id: existing.id }, data: { reason } });
  } else {
    await assertContentRateLimit("report", user.id);
    await prisma.report.create({
      data: { reason, reporterId: user.id, [field]: id },
    });
  }

  const reportCount = await prisma.report.count({ where: { [field]: id } });
  if (reportCount >= REPORTS_BEFORE_AUTO_HIDE) {
    const model = kind === "post" ? prisma.post : prisma.comment;
    await model.updateMany({
      where: { id, moderationStatus: "Approved" },
      data: { moderationStatus: "Pending" },
    });
  }
}

export async function moderatePostAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  if (!isModeratorRole(user)) throw new Error("Not authorized");

  const id = Number(formData.get("id"));
  const status = formData.get("status"); // "Approved" | "Rejected"

  if (!["Approved", "Rejected"].includes(status)) {
    throw new Error("Invalid status");
  }

  // A moderator decision resolves any open reports on the post.
  await prisma.$transaction([
    prisma.post.update({ where: { id }, data: { moderationStatus: status } }),
    prisma.report.deleteMany({ where: { postId: id } }),
  ]);
  revalidatePath("/[locale]/admin/moderation", "page");
}

export async function moderateCommentAction(formData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  if (!isModeratorRole(user)) throw new Error("Not authorized");

  const id = Number(formData.get("id"));
  const status = formData.get("status"); // "Approved" | "Rejected"

  if (!["Approved", "Rejected"].includes(status)) {
    throw new Error("Invalid status");
  }

  await prisma.$transaction([
    prisma.comment.update({ where: { id }, data: { moderationStatus: status } }),
    prisma.report.deleteMany({ where: { commentId: id } }),
  ]);
  revalidatePath("/[locale]/admin/moderation", "page");
}
