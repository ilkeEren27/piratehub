import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/utils/roles";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  LISTING_CATEGORIES,
  formatPrice,
  isVideoMime,
} from "@/lib/marketplace";
import { timeAgo } from "@/lib/format";
import { isTrustedUploadUrl } from "@/lib/uploads";
import PageHeader, { PAGE_MARGIN } from "@/components/PageHeader";
import ListingCard from "@/components/marketplace/ListingCard";
import CategoryBadge from "@/components/marketplace/CategoryBadge";
import MarketplaceNotice from "@/components/marketplace/MarketplaceNotice";
import { Button } from "@/components/ui/button";
import { Search, Store, Tag, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SORTS = {
  new: { createdAt: "desc" },
  priceLow: { priceCents: "asc" },
  priceHigh: { priceCents: "desc" },
};

export default async function MarketplacePage({ params, searchParams }) {
  const { locale } = await params;
  const { category, q = "", sort = "new", mine } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("marketplace");

  const user = await getSessionUser();
  const isSignedIn = !!user;
  const isModerator = user?.role === "Admin" || user?.role === "Moderator";

  const activeCategory = LISTING_CATEGORIES.includes(category) ? category : null;
  const activeSort = SORTS[sort] ? sort : "new";
  const query = String(q).trim().slice(0, 100);
  const showMine = mine === "1" && isSignedIn;

  let listings = [];
  try {
    const rows = await prisma.listing.findMany({
      where: {
        AND: [
          { moderationStatus: { not: "Rejected" } },
          // Everyone sees approved listings; sellers also see their own
          // pending listings; moderators see everything except rejected.
          isModerator
            ? {}
            : {
                OR: [
                  { moderationStatus: "Approved" },
                  ...(user ? [{ sellerId: user.id }] : []),
                ],
              },
          // "My listings" also shows sold items so sellers can manage them.
          showMine ? { sellerId: user.id } : { sold: false },
          activeCategory ? { category: activeCategory } : {},
          query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        seller: { select: { name: true, image: true } },
        attachments: {
          select: { url: true, mimeType: true },
          orderBy: { id: "asc" },
          take: 1,
        },
      },
      orderBy: [SORTS[activeSort], { id: "desc" }],
      take: 120,
    });

    const tcond = await getTranslations("marketplace.conditions");
    listings = rows.map((listing) => {
      const first = listing.attachments.find((a) =>
        isTrustedUploadUrl(a.url, "marketplace")
      );
      return {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        priceLabel:
          listing.priceCents === 0 ? t("free") : formatPrice(listing.priceCents, locale),
        negotiable: listing.negotiable,
        category: listing.category,
        condition: listing.condition,
        conditionLabel: listing.condition ? tcond(listing.condition) : null,
        sold: listing.sold,
        moderationStatus: listing.moderationStatus,
        sellerName: listing.seller?.name ?? "Unknown",
        sellerImage: listing.seller?.image ?? null,
        timeAgo: timeAgo(listing.createdAt, locale),
        cover: first
          ? { url: first.url, type: isVideoMime(first.mimeType) ? "video" : "image" }
          : null,
      };
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    listings = [];
  }

  const browseHref = (overrides = {}) => {
    const p = new URLSearchParams();
    const c = "category" in overrides ? overrides.category : activeCategory;
    const m = "mine" in overrides ? overrides.mine : showMine;
    if (c) p.set("category", c);
    if (query) p.set("q", query);
    if (activeSort !== "new") p.set("sort", activeSort);
    if (m) p.set("mine", "1");
    const qs = p.toString();
    return `/${locale}/marketplace${qs ? `?${qs}` : ""}`;
  };

  const sellHref = isSignedIn ? `/${locale}/marketplace/editor` : `/${locale}/log-in`;

  return (
    <main className="animate-fade-in">
      <PageHeader title={t("title")} description={t("description")}>
        <Link href={sellHref}>
          <Button size="lg" className="shadow-md">
            <Tag />
            {t("sellItem")}
          </Button>
        </Link>
      </PageHeader>

      <section className={`mt-8 mb-16 ${PAGE_MARGIN} space-y-6`}>
        <MarketplaceNotice locale={locale} />

        {/* Search + sort (plain GET form so it works without JS) */}
        <form
          action={`/${locale}/marketplace`}
          className="flex flex-col sm:flex-row gap-3"
        >
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          {showMine && <input type="hidden" name="mine" value="1" />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              maxLength={100}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <select
              name="sort"
              defaultValue={activeSort}
              aria-label={t("sortLabel")}
              className="w-full sm:w-auto pl-4 pr-10 py-2.5 bg-card border border-border rounded-xl appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="new">{t("sortNew")}</option>
              <option value="priceLow">{t("sortPriceLow")}</option>
              <option value="priceHigh">{t("sortPriceHigh")}</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button type="submit" className="rounded-xl">
            {t("searchButton")}
          </Button>
        </form>

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href={browseHref({ category: null })}>
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium transition-colors",
                !activeCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {t("allCategories")}
            </span>
          </Link>
          {LISTING_CATEGORIES.map((c) => (
            <Link key={c} href={browseHref({ category: c })}>
              <CategoryBadge
                category={c}
                className={cn(
                  "px-3 py-1 rounded-full text-sm cursor-pointer transition-opacity",
                  activeCategory && activeCategory !== c && "opacity-50 hover:opacity-100"
                )}
              />
            </Link>
          ))}
          {isSignedIn && (
            <Link href={browseHref({ mine: !showMine })} className="sm:ml-auto">
              <span
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium transition-colors",
                  showMine
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {t("myListings")}
              </span>
            </Link>
          )}
        </div>

        {/* Grid */}
        {listings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 rounded-xl border border-dashed bg-card/50 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <Store className="h-7 w-7 text-primary" />
            </div>
            <p className="text-lg text-muted-foreground max-w-md px-4">
              {query || activeCategory ? t("noResults") : t("noListings")}
            </p>
            <Link href={sellHref}>
              <Button>
                <Tag className="w-4 h-4" />
                {t("sellItem")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
