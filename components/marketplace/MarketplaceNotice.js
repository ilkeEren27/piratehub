import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// The "we only host listings" disclaimer shown on every marketplace page.
export default function MarketplaceNotice({ locale, className }) {
  const t = useTranslations("marketplace");
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground/90",
        className
      )}
    >
      <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p>
        {t("notice")}{" "}
        <Link
          href={`/${locale}/marketplace/terms`}
          className="font-medium text-primary underline underline-offset-2"
        >
          {t("readTerms")}
        </Link>
      </p>
    </div>
  );
}
