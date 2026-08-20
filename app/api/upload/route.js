import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { customAlphabet } from "nanoid";
import { getSessionUser } from "@/utils/roles";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_WINDOW_MS = 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 10;

const FOLDERS = new Set(["social", "avatars", "events"]);
const EVENT_CREATOR_ROLES = new Set(["ClubLeader", "ASWU", "Faculty", "Admin"]);

const globalForUploadRateLimit = globalThis;
const uploadAttempts = globalForUploadRateLimit.uploadAttempts || new Map();
if (!globalForUploadRateLimit.uploadAttempts) {
  globalForUploadRateLimit.uploadAttempts = uploadAttempts;
}

function startsWith(bytes, signature, offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

async function detectMimeType(file) {
  const bytes = new Uint8Array(await file.slice(0, 8192).arrayBuffer());

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return "application/pdf";
  }
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return "application/msword";
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    const preview = new TextDecoder().decode(bytes);
    if (preview.includes("[Content_Types].xml") && preview.includes("word/")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  }

  return null;
}

function consumeUploadQuota(userId) {
  const now = Date.now();
  const earliestAllowed = now - UPLOAD_WINDOW_MS;
  const attempts = (uploadAttempts.get(userId) || []).filter(
    (attempt) => attempt > earliestAllowed
  );

  if (attempts.length >= MAX_UPLOADS_PER_WINDOW) return false;

  attempts.push(now);
  uploadAttempts.set(userId, attempts);

  if (uploadAttempts.size > 1000) {
    for (const [id, timestamps] of uploadAttempts) {
      const activeAttempts = timestamps.filter(
        (attempt) => attempt > earliestAllowed
      );
      if (activeAttempts.length) uploadAttempts.set(id, activeAttempts);
      else uploadAttempts.delete(id);
    }
  }

  return true;
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!consumeUploadQuota(user.id)) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  // "image" restricts to image types (used by the editor's inline images
  // and avatars)
  const kind = String(formData.get("kind") || "any");
  const requestedFolder = String(formData.get("folder") || "social");
  if (!FOLDERS.has(requestedFolder)) {
    return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
  }
  const folder = requestedFolder;

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 10 MB" },
      { status: 413 }
    );
  }

  if (folder === "events" && !EVENT_CREATOR_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Not authorized to upload event images" }, { status: 403 });
  }
  if (kind !== "any" && kind !== "image") {
    return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
  }

  const detectedMimeType = await detectMimeType(file);
  const isImage = detectedMimeType && IMAGE_TYPES.has(detectedMimeType);
  const isDocument = detectedMimeType && DOCUMENT_TYPES.has(detectedMimeType);
  const allowed =
    isImage || (folder === "social" && kind === "any" && isDocument);
  if (!allowed) {
    return NextResponse.json(
      { error: "Unsupported or invalid file type" },
      { status: 415 }
    );
  }

  const safeName = (file.name || "file")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .slice(-80);

  // Avatars are namespaced by user id so ownership can be verified from the
  // path alone when we later delete a replaced picture.
  const key =
    folder === "avatars"
      ? `avatars/${user.id}/${nanoid()}-${safeName}`
      : `${folder}/${nanoid()}-${safeName}`;

  try {
    const blob = await put(key, file, {
      access: "public",
      contentType: detectedMimeType,
    });
    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      mimeType: detectedMimeType,
      sizeBytes: file.size,
    });
  } catch (error) {
    console.error("Blob upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
