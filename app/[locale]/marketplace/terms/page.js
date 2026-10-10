import { setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/LegalPage";

// Wording lives in messages/*.json under "marketplaceTerms".
const SECTIONS = [
  "platform",
  "noPayments",
  "sellers",
  "prohibited",
  "buyers",
  "moderation",
  "liability",
  "changes",
];

export default async function MarketplaceTermsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage namespace="marketplaceTerms" sections={SECTIONS} locale={locale} />
  );
}
