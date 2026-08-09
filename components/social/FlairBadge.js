import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { FLAIR_STYLES } from "@/lib/flairs";
import { cn } from "@/lib/utils";

export default function FlairBadge({ flair, className }) {
  const t = useTranslations("social.flairs");
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        FLAIR_STYLES[flair] ?? FLAIR_STYLES.General,
        className
      )}
    >
      {t(flair)}
    </Badge>
  );
}
