import { setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/LegalPage";

// Wording lives in messages/*.json under "copyrightPolicy".
const SECTIONS = [
  "intro",
  "courseMaterials",
  "notice",
  "agent",
  "counter",
  "repeat",
  "misrepresentation",
];

export default async function CopyrightPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage namespace="copyrightPolicy" sections={SECTIONS} locale={locale} />;
}
