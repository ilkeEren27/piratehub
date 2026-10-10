import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/utils/roles";
import { setRequestLocale } from "next-intl/server";
import ListingForm from "@/components/marketplace/ListingForm";

export default async function ListingEditorPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/log-in`);

  let initialListing = null;
  if (slug?.[0]) {
    const listing = await prisma.listing.findUnique({
      where: { slug: slug[0] },
      include: { attachments: { orderBy: { id: "asc" } } },
    });
    if (!listing) redirect(`/${locale}/marketplace`);

    const isOwner = listing.sellerId === user.id;
    const isModerator = user.role === "Admin" || user.role === "Moderator";
    if (!isOwner && !isModerator) redirect(`/${locale}/marketplace`);

    initialListing = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      priceCents: listing.priceCents,
      negotiable: listing.negotiable,
      category: listing.category,
      condition: listing.condition,
      contactInfo: listing.contactInfo,
      media: listing.attachments.map((a) => ({
        url: a.url,
        fileName: a.fileName,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    };
  }

  return <ListingForm initialListing={initialListing} />;
}
