import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";

// Shared layout for the legal pages (Terms, Privacy, Copyright, Marketplace
// Terms). The wording lives in messages/*.json under `namespace`:
//   title, updated, summary, sections.<key>.{ heading, body, items? }
// so it can be edited without touching code. `{email}` in any text is
// replaced with LEGAL_CONTACT_EMAIL.
export default async function LegalPage({ namespace, sections, locale }) {
  const t = await getTranslations(namespace);
  const tl = await getTranslations("legal");
  const email = process.env.LEGAL_CONTACT_EMAIL || tl("noContact");

  return (
    <main className="animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 mt-8 md:mt-12 mb-16 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold pb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("updated")}</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="font-medium">{t("summary", { email })}</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-8 space-y-7">
          {sections.map((key, i) => {
            const items = t.has(`sections.${key}.items`)
              ? t.raw(`sections.${key}.items`)
              : null;
            return (
              <section key={key} className="space-y-2">
                <h2 className="text-lg font-semibold">
                  {i + 1}. {t(`sections.${key}.heading`)}
                </h2>
                <p className="text-foreground/85 leading-relaxed">
                  {t(`sections.${key}.body`, { email })}
                </p>
                {items && (
                  <ul className="list-disc pl-5 space-y-1 text-foreground/85">
                    {items.map((item) => (
                      <li key={item}>{item.replace("{email}", email)}</li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href={`/${locale}/terms`} className="text-primary underline underline-offset-2">
            {tl("terms")}
          </Link>
          <Link href={`/${locale}/privacy`} className="text-primary underline underline-offset-2">
            {tl("privacy")}
          </Link>
          <Link href={`/${locale}/copyright`} className="text-primary underline underline-offset-2">
            {tl("copyright")}
          </Link>
          <Link
            href={`/${locale}/marketplace/terms`}
            className="text-primary underline underline-offset-2"
          >
            {tl("marketplaceTerms")}
          </Link>
        </nav>
      </div>
    </main>
  );
}
