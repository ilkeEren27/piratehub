import { setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/LegalPage";

// Wording lives in messages/*.json under "privacy".
const SECTIONS = [
  "intro",
  "collect",
  "use",
  "sharing",
  "cookies",
  "retention",
  "rights",
  "children",
  "security",
  "changes",
  "contact",
];

export default async function PrivacyPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage namespace="privacy" sections={SECTIONS} locale={locale} />;
}
