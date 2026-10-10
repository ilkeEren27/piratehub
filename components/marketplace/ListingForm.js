"use client";

import { uploadFile } from "@/lib/uploadClient";
import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { customAlphabet } from "nanoid";
import {
  upsertListingAction,
  deleteListingAction,
} from "@/app/marketplace/_actions";
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_IMAGE_TYPES,
  LISTING_VIDEO_TYPES,
  MAX_LISTING_MEDIA,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_SIZE_BYTES,
  isVideoMime,
} from "@/lib/marketplace";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ChevronDownIcon,
  Type,
  FileText,
  DollarSign,
  Tags,
  Sparkles,
  Contact,
  ImagePlus,
  Store,
  Trash2,
  X,
  Loader2,
  Video,
  ShieldAlert,
} from "lucide-react";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const inputClass =
  "w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/60";

function centsToInput(cents) {
  if (cents == null) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export default function ListingForm({ initialListing }) {
  const t = useTranslations("listingForm");
  const tc = useTranslations("marketplace.categories");
  const tcond = useTranslations("marketplace.conditions");
  const locale = useLocale();
  const router = useRouter();

  const isEditing = !!initialListing?.id;
  const [media, setMedia] = useState(initialListing?.media ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const videoCount = media.filter((m) => isVideoMime(m.mimeType)).length;

  function uploadImage(file) {
    return uploadFile(file, { kind: "image", folder: "marketplace" });
  }

  // Videos skip our server and go straight to Blob storage, so they aren't
  // limited by the function request size.
  async function uploadVideo(file) {
    const safeName = (file.name || "video")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .slice(-80);
    const blob = await upload(`marketplace/${nanoid()}-${safeName}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload/video",
      contentType: file.type,
    });
    return {
      url: blob.url,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    };
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    let total = media.length;
    let videos = videoCount;
    try {
      for (const file of files) {
        if (total >= MAX_LISTING_MEDIA) {
          alert(t("errors.tooManyMedia", { max: MAX_LISTING_MEDIA }));
          break;
        }
        const isVideo = LISTING_VIDEO_TYPES.includes(file.type);
        if (!isVideo && !LISTING_IMAGE_TYPES.includes(file.type)) {
          alert(t("errors.unsupportedType", { name: file.name }));
          continue;
        }
        if (isVideo && videos >= MAX_LISTING_VIDEOS) {
          alert(t("errors.tooManyVideos", { max: MAX_LISTING_VIDEOS }));
          continue;
        }
        if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
          alert(t("errors.videoTooLarge", { name: file.name }));
          continue;
        }

        const uploaded = isVideo ? await uploadVideo(file) : await uploadImage(file);
        setMedia((prev) => [...prev, uploaded]);
        total += 1;
        if (isVideo) videos += 1;
      }
    } catch (error) {
      console.error("Listing media upload error:", error);
      alert(`${t("errors.uploading")} ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function onDelete() {
    if (!initialListing?.id) return;
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.set("id", String(initialListing.id));
      await deleteListingAction(fd);
      router.push(`/${locale}/marketplace`);
      router.refresh();
    } catch (error) {
      console.error("Listing deletion error:", error);
      alert(`${t("errors.deleting")} ${error.message}`);
      setDeleting(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("media", JSON.stringify(media));
      if (initialListing?.id) fd.set("id", String(initialListing.id));
      const { slug, moderationStatus } = await upsertListingAction(fd);
      if (moderationStatus === "Pending") {
        alert(t("pendingNotice"));
      }
      router.push(`/${locale}/marketplace/${slug}`);
      router.refresh();
    } catch (error) {
      console.error("Listing submission error:", error);
      alert(`${t("errors.saving")} ${error.message}`);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen py-8 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Store className="w-8 h-8 text-primary" />
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
              <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                <Type className="w-4 h-4 text-primary" />
                {t("titleLabel")}
              </Label>
              <input
                id="title"
                name="title"
                defaultValue={initialListing?.title ?? ""}
                required
                maxLength={120}
                className={inputClass}
                placeholder={t("titlePlaceholder")}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="w-4 h-4 text-primary" />
                {t("priceLabel")}
                <span className="text-xs text-muted-foreground font-normal">
                  {t("priceHint")}
                </span>
              </Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100000"
                    step="0.01"
                    required
                    defaultValue={centsToInput(initialListing?.priceCents)}
                    className={`${inputClass} pl-8`}
                    placeholder="0"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="negotiable"
                    defaultChecked={initialListing?.negotiable ?? false}
                    className="w-4 h-4 accent-primary"
                  />
                  {t("negotiableLabel")}
                </label>
              </div>
            </div>

            {/* Category + condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                  <Tags className="w-4 h-4 text-primary" />
                  {t("categoryLabel")}
                </Label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    defaultValue={initialListing?.category ?? "Other"}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {LISTING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {tc(c)}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition" className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {t("conditionLabel")}
                </Label>
                <div className="relative">
                  <select
                    id="condition"
                    name="condition"
                    defaultValue={initialListing?.condition ?? ""}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    <option value="">{t("conditionNone")}</option>
                    {LISTING_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {tcond(c)}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-primary" />
                {t("descriptionLabel")}
              </Label>
              <textarea
                id="description"
                name="description"
                defaultValue={initialListing?.description ?? ""}
                required
                maxLength={5000}
                rows={7}
                className={`${inputClass} resize-y`}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contactInfo" className="flex items-center gap-2 text-sm font-medium">
                <Contact className="w-4 h-4 text-primary" />
                {t("contactLabel")}
              </Label>
              <input
                id="contactInfo"
                name="contactInfo"
                defaultValue={initialListing?.contactInfo ?? ""}
                required
                maxLength={200}
                className={inputClass}
                placeholder={t("contactPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("contactHint")}</p>
            </div>

            {/* Photos & videos */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <ImagePlus className="w-4 h-4 text-primary" />
                {t("mediaLabel")}
                <span className="text-xs text-muted-foreground font-normal">
                  {t("mediaHint", {
                    max: MAX_LISTING_MEDIA,
                    maxVideos: MAX_LISTING_VIDEOS,
                  })}
                </span>
              </Label>

              {media.length > 0 && (
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {media.map((m, i) => (
                    <li
                      key={m.url}
                      className="relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted/30"
                    >
                      {isVideoMime(m.mimeType) ? (
                        <>
                          <video
                            src={m.url}
                            muted
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                          <Video className="absolute bottom-1.5 left-1.5 w-4 h-4 text-white drop-shadow" />
                        </>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.url}
                          alt={m.fileName ?? ""}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium">
                          {t("cover")}
                        </span>
                      )}
                      <button
                        type="button"
                        title={t("removeMedia")}
                        onClick={() =>
                          setMedia((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                type="button"
                variant="outline"
                disabled={uploading || media.length >= MAX_LISTING_MEDIA}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-dashed"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
                {uploading ? t("uploading") : t("addMedia")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={[...LISTING_IMAGE_TYPES, ...LISTING_VIDEO_TYPES].join(",")}
                className="hidden"
                onChange={onPickFiles}
              />
            </div>

            {/* Terms */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
              <p className="flex items-start gap-2 text-sm text-foreground/90">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                {t("termsSummary")}
              </p>
              <label className="flex items-start gap-2 text-sm font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  required
                  className="w-4 h-4 mt-0.5 accent-primary shrink-0"
                />
                <span>
                  {t.rich("acceptTerms", {
                    terms: (chunks) => (
                      <Link
                        href={`/${locale}/marketplace/terms`}
                        target="_blank"
                        className="text-primary underline underline-offset-2"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                disabled={submitting || uploading}
                className="w-full py-6 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
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
