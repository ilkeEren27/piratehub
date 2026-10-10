"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageOff, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// media: [{ id, url, type: "image" | "video", fileName }]
export default function ListingGallery({ media, title }) {
  const t = useTranslations("marketplace");
  const [active, setActive] = useState(0);
  const current = media[active];

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 aspect-square sm:aspect-[4/3] rounded-2xl border border-border/50 bg-muted/30 text-muted-foreground">
        <ImageOff className="w-10 h-10" />
        <span className="text-sm">{t("noPhotos")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden rounded-2xl border border-border/50 bg-black/90">
        {current.type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={title}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("showMedia", { number: i + 1 })}
              className={cn(
                "relative w-16 h-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === active
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {m.type === "video" ? (
                <>
                  <video src={m.url} muted preload="metadata" className="w-full h-full object-cover" />
                  <PlayCircle className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
