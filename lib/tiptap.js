import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { generateHTML } from "@tiptap/html";

// Extensions shared by the client editor and the server-side renderer.
// Placeholder is editor-only and lives in RichTextEditor.
export const contentExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Image,
  Link.configure({ openOnClick: false }),
];

const SAFE_URL = /^(https?:\/\/|mailto:|\/)/i;

// Strips link/image URLs with unexpected protocols (javascript:, data:, …)
// before the JSON is stored or rendered.
export function sanitizeDoc(node) {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node.marks)) {
    node.marks = node.marks.filter(
      (mark) =>
        mark.type !== "link" || SAFE_URL.test(String(mark.attrs?.href ?? ""))
    );
  }
  if (node.type === "image" && !SAFE_URL.test(String(node.attrs?.src ?? ""))) {
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

export function makeExcerpt(contentJson, maxLength = 280) {
  const text = extractText(contentJson).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
