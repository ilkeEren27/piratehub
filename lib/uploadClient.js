// Browser-side helper for /api/upload, shared by every form that uploads.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // keep in sync with the route

// Returns { url, fileName, mimeType, sizeBytes } or throws an Error with a
// readable message. Checks the size first, because Vercel rejects larger
// bodies with a plain-text error before our route ever runs.
export async function uploadFile(file, { kind = "any", folder = "social" } = {}) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is larger than 4 MB");
  }

  const fd = new FormData();
  fd.set("file", file);
  fd.set("kind", kind);
  fd.set("folder", folder);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}
