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

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  // "image" restricts to image types (used by the editor's inline images
  // and avatars)
  const kind = formData.get("kind") || "any";
  const folder = formData.get("folder") === "avatars" ? "avatars" : "social";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 10 MB" },
      { status: 413 }
    );
  }

  const allowed =
    kind === "image"
      ? IMAGE_TYPES.has(file.type)
      : IMAGE_TYPES.has(file.type) || DOCUMENT_TYPES.has(file.type);
  if (!allowed) {
    return NextResponse.json(
      { error: "Unsupported file type" },
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
      : `social/${nanoid()}-${safeName}`;

  try {
    const blob = await put(key, file, {
      access: "public",
    });
    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (error) {
    console.error("Blob upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
