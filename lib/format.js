import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

export function timeAgo(date, locale = "en") {
  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
    locale: locale === "es" ? es : undefined,
  });
}
