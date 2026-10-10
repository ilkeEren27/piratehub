import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Clock3, ImageOff, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import CategoryBadge from "@/components/marketplace/CategoryBadge";
import UserAvatar from "@/components/UserAvatar";

export default function ListingCard({ listing, locale }) {
  const t = useTranslations("marketplace");

  return (
    <Card className="animate-fade-in gap-0 p-0 overflow-hidden">
      <Link href={`/${locale}/marketplace/${listing.slug}`} className="flex flex-col h-full">
        <div className="relative aspect-square bg-muted/30">
          {listing.cover?.type === "image" ? (
            <Image
              src={listing.cover.url}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : listing.cover?.type === "video" ? (
            <>
              <video
                src={listing.cover.url}
                muted
                preload="metadata"
                className="w-full h-full object-cover"
              />
              <PlayCircle className="absolute inset-0 m-auto w-12 h-12 text-white/90 drop-shadow-lg" />
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <ImageOff className="w-10 h-10" />
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {listing.sold && (
              <Badge className="bg-foreground text-background">{t("soldBadge")}</Badge>
            )}
            {listing.moderationStatus === "Pending" && (
              <Badge
                variant="outline"
                className="bg-card/90 border-amber-500/40 text-amber-600 dark:text-amber-400"
              >
                {t("pendingBadge")}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-2 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-bold text-primary">
              {listing.priceLabel}
            </span>
            {listing.negotiable && (
              <span className="text-xs text-muted-foreground">{t("obo")}</span>
            )}
          </div>
          <h2 className="font-semibold leading-snug line-clamp-2">{listing.title}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={listing.category} />
            {listing.condition && (
              <Badge variant="secondary">{listing.conditionLabel}</Badge>
            )}
          </div>
          <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 min-w-0">
              <UserAvatar name={listing.sellerName} image={listing.sellerImage} size="xs" />
              <span className="truncate">{listing.sellerName}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock3 className="w-3.5 h-3.5" />
              {listing.timeAgo}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
