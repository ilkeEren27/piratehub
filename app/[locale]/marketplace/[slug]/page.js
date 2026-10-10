import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/utils/roles";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatPrice, isVideoMime } from "@/lib/marketplace";
import { timeAgo } from "@/lib/format";
import { isTrustedUploadUrl } from "@/lib/uploads";
import ListingGallery from "@/components/marketplace/ListingGallery";
import CategoryBadge from "@/components/marketplace/CategoryBadge";
import MarketplaceNotice from "@/components/marketplace/MarketplaceNotice";
import ReportButton from "@/components/ReportButton";
import SoldToggle from "@/components/marketplace/SoldToggle";
import UserAvatar from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock3,
  Pencil,
  MessageCircle,
  ShieldCheck,
  LogIn,
} from "lucide-react";

export default async function ListingPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplace");
  const tcond = await getTranslations("marketplace.conditions");

  const user = await getSessionUser();
  const isSignedIn = !!user;
  const isModerator = user?.role === "Admin" || user?.role === "Moderator";

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      seller: { select: { id: true, name: true, role: true, image: true } },
      attachments: { orderBy: { id: "asc" } },
    },
  });

  if (!listing) notFound();

  const isOwner = user && listing.sellerId === user.id;
  if (listing.moderationStatus === "Rejected" && !isModerator) notFound();
  if (listing.moderationStatus === "Pending" && !isOwner && !isModerator) {
    notFound();
  }

  const media = listing.attachments
    .filter((a) => isTrustedUploadUrl(a.url, "marketplace"))
    .map((a) => ({
      id: a.id,
      url: a.url,
      type: isVideoMime(a.mimeType) ? "video" : "image",
    }));

  const canEdit = isOwner || isModerator;
  const sellerName = listing.seller?.name ?? "Unknown";

  return (
    <main className="animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 mt-8 md:mt-12 mb-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={`/${locale}/marketplace`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
              {t("backToMarketplace")}
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && <SoldToggle listingId={listing.id} sold={listing.sold} />}
            {canEdit && (
              <Link href={`/${locale}/marketplace/editor/${listing.slug}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4" />
                  {t("edit")}
                </Button>
              </Link>
            )}
            {isSignedIn && !isOwner && <ReportButton kind="listing" id={listing.id} />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 md:gap-8">
          <ListingGallery media={media} title={listing.title} />

          <div className="space-y-5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={listing.category} />
              {listing.condition && (
                <Badge variant="secondary">{tcond(listing.condition)}</Badge>
              )}
              {listing.sold && (
                <Badge className="bg-foreground text-background">{t("soldBadge")}</Badge>
              )}
              {listing.moderationStatus === "Pending" && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                >
                  {t("pendingBadge")}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">
              {listing.title}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                {listing.priceCents === 0
                  ? t("free")
                  : formatPrice(listing.priceCents, locale)}
              </span>
              {listing.negotiable && (
                <span className="text-sm text-muted-foreground">{t("negotiable")}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <UserAvatar name={sellerName} image={listing.seller?.image} size="sm" />
                <span className="font-medium text-foreground">{sellerName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock3 className="w-3.5 h-3.5" />
                {timeAgo(listing.createdAt, locale)}
              </span>
            </div>

            {/* Contact — only for signed-in pirates, to keep it away from scrapers */}
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageCircle className="w-4 h-4 text-primary" />
                {t("contactSeller")}
              </h2>
              {isSignedIn ? (
                <>
                  <p className="font-medium break-words select-all">{listing.contactInfo}</p>
                  <p className="text-xs text-muted-foreground">{t("contactNote")}</p>
                </>
              ) : (
                <Link href={`/${locale}/log-in`}>
                  <Button size="sm" variant="outline">
                    <LogIn className="w-4 h-4" />
                    {t("logInToContact")}
                  </Button>
                </Link>
              )}
            </div>

            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {t("safetyTitle")}
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>{t("safety.meet")}</li>
                <li>{t("safety.inspect")}</li>
                <li>{t("safety.payment")}</li>
                <li>{t("safety.personal")}</li>
                <li>{t("safety.report")}</li>
              </ul>
            </div>
          </div>
        </div>

        <section className="bg-card rounded-2xl border border-border/50 p-5 sm:p-7 space-y-3">
          <h2 className="text-lg font-semibold">{t("descriptionHeading")}</h2>
          <p className="whitespace-pre-line break-words text-foreground/90 leading-relaxed">
            {listing.description}
          </p>
        </section>

        <MarketplaceNotice locale={locale} />
      </div>
    </main>
  );
}
