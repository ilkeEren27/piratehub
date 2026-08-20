const PUBLIC_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const UPLOAD_PATHS = {
  social: /^\/social\/[a-z0-9]{10}-[a-zA-Z0-9._-]{1,80}$/,
  events: /^\/events\/[a-z0-9]{10}-[a-zA-Z0-9._-]{1,80}$/,
};

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
