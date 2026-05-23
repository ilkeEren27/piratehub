import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");
  const locale = useLocale();

  return (
    <main>
      <section className="flex flex-col items-center justify-center mt-16 mx-10 gap-4">
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="text-center text-lg">{t("subtitle")}</p>
        <Image alt="404" src="/not-found.jpeg" width="500" height="500" />
        <Link href={`/${locale}`} className="text-blue-500 underline mt-4">
          <Button>{t("home")}</Button>
        </Link>
      </section>
    </main>
  );
}
