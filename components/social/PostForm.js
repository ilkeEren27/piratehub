"use client";

import { useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { upsertPostAction, deletePostAction } from "@/app/social/_actions";
import { FLAIRS } from "@/lib/flairs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ChevronDownIcon,
  Type,
  FileText,
  Paperclip,
  Tags,
  MessagesSquare,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import RichTextEditor from "@/components/social/RichTextEditor";

const MAX_ATTACHMENTS = 5;

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PostForm({ initialPost }) {
  const t = useTranslations("postForm");
  const tf = useTranslations("social.flairs");
  const locale = useLocale();
  const router = useRouter();

  const isEditing = !!initialPost?.id;
  const [contentJson, setContentJson] = useState(
    initialPost?.contentJson ?? { type: "doc", content: [] }
  );
  const [attachments, setAttachments] = useState(
    initialPost?.attachments?.map((a) => ({
      url: a.url,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
    })) ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (attachments.length >= MAX_ATTACHMENTS) {
      alert(t("errors.tooManyAttachments"));
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAttachments((prev) => [...prev, data]);
    } catch (error) {
      console.error("Attachment upload error:", error);
      alert(`${t("errors.uploading")} ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function onDelete() {
    if (!initialPost?.id) return;
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.set("id", String(initialPost.id));
      await deletePostAction(fd);
      window.location.href = `/${locale}/social`;
    } catch (error) {
      console.error("Post deletion error:", error);
      alert(`${t("errors.deleting")} ${error.message}`);
      setDeleting(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("contentJson", JSON.stringify(contentJson));
      fd.set("attachments", JSON.stringify(attachments));
      if (initialPost?.id) fd.set("id", String(initialPost.id));
      const { slug, moderationStatus } = await upsertPostAction(fd);
      if (moderationStatus === "Pending") {
        alert(t("pendingNotice"));
      }
      router.push(`/${locale}/social/${slug}`);
      router.refresh();
    } catch (error) {
      console.error("Post submission error:", error);
      alert(`${t("errors.creating")} ${error.message}`);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MessagesSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isEditing ? t("editTitle") : t("createTitle")}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? t("editDescription") : t("createDescription")}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden">
          <form onSubmit={onSubmit} className="p-6 md:p-8 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Type className="w-4 h-4 text-primary" />
                {t("titleLabel")}
              </Label>
              <input
                id="title"
                name="title"
                defaultValue={initialPost?.title ?? ""}
                required
                maxLength={255}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/60"
                placeholder={t("titlePlaceholder")}
              />
            </div>

            {/* Flair */}
            <div className="space-y-2">
              <Label
                htmlFor="flair"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Tags className="w-4 h-4 text-primary" />
                {t("flairLabel")}
              </Label>
              <div className="relative">
                <select
                  id="flair"
                  name="flair"
                  defaultValue={initialPost?.flair ?? "General"}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none cursor-pointer"
                >
                  {FLAIRS.map((flair) => (
                    <option key={flair} value={flair}>
                      {tf(flair)}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-primary" />
                {t("bodyLabel")}
              </Label>
              <RichTextEditor
                initialContent={initialPost?.contentJson}
                onChange={setContentJson}
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Paperclip className="w-4 h-4 text-primary" />
                {t("attachmentsLabel")}
                <span className="text-xs text-muted-foreground font-normal">
                  {t("attachmentsHint")}
                </span>
              </Label>

              {attachments.length > 0 && (
                <ul className="space-y-2">
                  {attachments.map((a, i) => (
                    <li
                      key={a.url}
                      className="flex items-center gap-3 px-3 py-2 bg-muted/30 border border-border/50 rounded-xl text-sm"
                    >
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate flex-1">{a.fileName}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatSize(a.sizeBytes)}
                      </span>
                      <button
                        type="button"
                        title={t("removeAttachment")}
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                type="button"
                variant="outline"
                disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-dashed"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
                {uploading ? t("uploading") : t("addAttachment")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onPickFile}
              />
            </div>

            {/* Submit */}
            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                disabled={submitting || uploading}
                className="w-full py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : null}
                {isEditing ? t("saveChanges") : t("createButton")}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleting}
                  onClick={onDelete}
                  className="w-full py-6 text-lg font-semibold rounded-xl border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-all duration-200"
                >
                  <Trash2 className="w-5 h-5" />
                  {deleting ? t("deleting") : t("deleteButton")}
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("reviewNotice")}
        </p>
      </div>
    </main>
  );
}
