const PUBLIC_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const UPLOAD_PATHS = {
  social: /^\/social\/[a-z0-9]{10}-[a-zA-Z0-9._-]{1,80}$/,
  events: /^\/events\/[a-z0-9]{10}-[a-zA-Z0-9._-]{1,80}$/,
  marketplace: /^\/marketplace\/[a-z0-9]{10}-[a-zA-Z0-9._-]{1,80}$/,
  avatars: /^\/avatars\/[a-zA-Z0-9_-]{1,64}\/[a-z0-9]{10}-[a-zA-Z0-9._-]{1,80}$/,
};

// Validates the pathname a client asks to upload to (no leading slash, as
// passed to Vercel Blob client uploads).
export function isAllowedUploadPathname(pathname, folder) {
  return typeof pathname === "string" && !!UPLOAD_PATHS[folder]?.test(`/${pathname}`);
}

// Profile pictures live under avatars/<userId>/, so a user can only ever
// point their avatar at a file they uploaded themselves.
export function isOwnAvatarUrl(value, userId) {
  if (!userId || !isTrustedUploadUrl(value, "avatars")) return false;
  return new URL(value).pathname.startsWith(`/avatars/${userId}/`);
}

// User-supplied content may only reference Vercel Blob URLs using this app's
// upload path format. Each content type has its own path namespace.
export function isTrustedUploadUrl(value, folder) {
  if (typeof value !== "string" || !value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.length > PUBLIC_BLOB_HOST_SUFFIX.length &&
      url.hostname.endsWith(PUBLIC_BLOB_HOST_SUFFIX) &&
      UPLOAD_PATHS[folder]?.test(url.pathname)
    );
  } catch {
    return false;
  }
}
