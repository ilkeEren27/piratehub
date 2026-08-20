"use server";

import { getSessionUser } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { customAlphabet } from "nanoid";
import { checkBlocklist, checkOpenAIModeration } from "@/lib/moderation";
import { isValidFlair } from "@/lib/flairs";
import { sanitizeDoc, extractText, makeExcerpt } from "@/lib/tiptap";
import { isTrustedUploadUrl } from "@/lib/uploads";

import slugify from "slugify";
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 8);

function isModeratorRole(user) {
  return user?.role === "Admin" || user?.role === "Moderator";
}

const MAX_ATTACHMENTS = 5;

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
  const moderationStatus = flagged ? "Pending" : "Approved";

  const attachmentData = attachments.map((a) => ({
    url: String(a.url),
    fileName: a.fileName ? String(a.fileName) : null,
    mimeType: a.mimeType ? String(a.mimeType) : null,
    sizeBytes: Number.isFinite(a.sizeBytes) ? a.sizeBytes : null,
  }));

  if (id) {
    const existing = await prisma.post.findUnique({
      where: { id: Number(id) },
      select: { authorId: true, slug: true },
    });
    if (!existing) throw new Error("Post not found");

    const isOwner = existing.authorId === user.id;
    if (!isOwner && !isModeratorRole(user)) {
      throw new Error("You do not have permission to edit this post");
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
    return { slug: existing.slug, moderationStatus };
  }

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
    select: { authorId: true },
  });
  if (!existing) throw new Error("Post not found");

  if (existing.authorId !== user.id && !isModeratorRole(user)) {
    throw new Error("You do not have permission to delete this post");
  }

  return prisma.post.delete({ where: { id } });
}

// value: 1 (upvote) or -1 (downvote). Voting the same way twice removes
// the vote, voting the other way switches it — Reddit semantics.
export async function votePostAction(postId, value) {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  if (value !== 1 && value !== -1) throw new Error("Invalid vote");

  postId = Number(postId);
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

  commentId = Number(commentId);
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) throw new Error("Post not found");

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { postId: true },
    });
    if (!parent || parent.postId !== postId) {
      throw new Error("Parent comment not found");
    }
  }

  return prisma.comment.create({
    data: { content, postId, parentId, authorId: user.id },
  });
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

  return prisma.comment.delete({ where: { id } });
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

  return prisma.post.update({
    where: { id },
    data: { moderationStatus: status },
  });
}
