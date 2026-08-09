"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Link2Off,
  ImagePlus,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ToolbarButton({ onClick, active = false, disabled = false, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        "disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-primary/15 text-primary"
      )}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ initialContent, onChange }) {
  const t = useTranslations("postForm");
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: t("bodyPlaceholder") }),
    ],
    content: initialContent ?? { type: "doc", content: [] },
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[220px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[266px] rounded-xl border border-border bg-background animate-pulse" />
    );
  }

  function setLink() {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt(t("linkPrompt"), previous ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      alert(t("errors.invalidLink"));
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
    } catch (error) {
      console.error("Image upload error:", error);
      alert(`${t("errors.uploading")} ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/20">
        <ToolbarButton
          title={t("toolbar.bold")}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={t("toolbar.italic")}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={t("toolbar.strike")}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          title={t("toolbar.heading")}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={t("toolbar.subheading")}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          title={t("toolbar.bulletList")}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={t("toolbar.orderedList")}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={t("toolbar.quote")}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={t("toolbar.codeBlock")}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton
          title={t("toolbar.link")}
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 className="w-4 h-4" />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton
            title={t("toolbar.unlink")}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Link2Off className="w-4 h-4" />
          </ToolbarButton>
        )}
        <ToolbarButton
          title={t("toolbar.image")}
          disabled={uploadingImage}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingImage ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          title={t("toolbar.undo")}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          title={t("toolbar.redo")}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onPickImage}
      />
    </div>
  );
}
