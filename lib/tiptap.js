import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { generateHTML } from "@tiptap/html";
import { isTrustedUploadUrl } from "@/lib/uploads";

// Extensions shared by the client editor and the server-side renderer.
// Placeholder is editor-only and lives in RichTextEditor.
export const contentExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Image,
  Link.configure({ openOnClick: false }),
];

// Links may be http(s), mailto, or a path on this site ("//host" is a
// protocol-relative link to another site, so it's excluded).
const SAFE_LINK = /^(https?:\/\/|mailto:|\/(?!\/))/i;

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function cleanAttrs(attrs) {
  if (!attrs || typeof attrs !== "object") return attrs;
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !UNSAFE_KEYS.has(key))
  );
}

// Strips links with unexpected protocols (javascript:, data:, …) and images
// that aren't our own uploads before the JSON is stored or rendered.
// Outside images would bypass moderation and let their host see the IP
// address of everyone who opens the post.
export function sanitizeDoc(node) {
  if (!node || typeof node !== "object") return node;

  // TipTap 2's mergeAttributes() turns an own "__proto__" key (which
  // JSON.parse happily creates) into real DOM attributes, e.g. onerror
  // handlers (GHSA-cp6q-959q-f8rh). Drop such keys from every attrs object.
  node.attrs = cleanAttrs(node.attrs);
  if (Array.isArray(node.marks)) {
    node.marks = node.marks.map((mark) => ({ ...mark, attrs: cleanAttrs(mark?.attrs) }));
    node.marks = node.marks.filter(
      (mark) =>
        mark.type !== "link" || SAFE_LINK.test(String(mark.attrs?.href ?? ""))
    );
  }
  if (
    node.type === "image" &&
    !isTrustedUploadUrl(String(node.attrs?.src ?? ""), "social")
  ) {
    return null;
  }
  if (Array.isArray(node.content)) {
    node.content = node.content.map(sanitizeDoc).filter(Boolean);
  }
  return node;
}

export function renderPostHtml(contentJson) {
  try {
    const doc = sanitizeDoc(structuredClone(contentJson));
    if (!doc?.type) return "";
    return generateHTML(doc, contentExtensions);
  } catch (error) {
    console.error("Failed to render post content:", error);
    return "";
  }
}

// Walks the TipTap JSON and returns the plain text (used for excerpts
// and content moderation).
export function extractText(node) {
  if (!node || typeof node !== "object") return "";
  const own = node.type === "text" ? node.text ?? "" : "";
  const children = Array.isArray(node.content)
    ? node.content.map(extractText).join(" ")
    : "";
  return [own, children].filter(Boolean).join(" ").trim();
}

// Every image src in a post body (used to clean up uploads on delete).
export function extractImageSources(node) {
  if (!node || typeof node !== "object") return [];
  const own = node.type === "image" ? [String(node.attrs?.src ?? "")] : [];
  const children = Array.isArray(node.content)
    ? node.content.flatMap(extractImageSources)
    : [];
  return [...own, ...children].filter(Boolean);
}

// First image in a post body, used as the timeline preview. next/image only
// accepts hosts listed in next.config.mjs, so only our own uploads qualify.
export function extractFirstImage(node) {
  if (!node || typeof node !== "object") return null;

  if (node.type === "image") {
    const src = String(node.attrs?.src ?? "");
    return isTrustedUploadUrl(src, "social")
      ? { src, alt: String(node.attrs?.alt ?? "") }
      : null;
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const found = extractFirstImage(child);
      if (found) return found;
    }
  }
  return null;
}

export function makeExcerpt(contentJson, maxLength = 280) {
  const text = extractText(contentJson).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
