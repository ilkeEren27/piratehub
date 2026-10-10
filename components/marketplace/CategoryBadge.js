import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_STYLES } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export default function CategoryBadge({ category, className }) {
  const t = useTranslations("marketplace.categories");
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Other,
        className
      )}
    >
      {t(category)}
    </Badge>
  );
}
