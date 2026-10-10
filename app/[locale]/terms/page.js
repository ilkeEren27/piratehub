import { setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/LegalPage";

// Wording lives in messages/*.json under "terms".
const SECTIONS = [
  "about",
  "eligibility",
  "content",
  "rules",
  "moderation",
  "events",
  "marketplace",
  "thirdParty",
  "copyright",
  "disclaimers",
  "liability",
  "indemnity",
  "termination",
  "changes",
  "contact",
];

export default async function TermsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage namespace="terms" sections={SECTIONS} locale={locale} />;
}
