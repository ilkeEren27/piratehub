import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { moderateEventAction } from "@/app/events/_actions";
import { Button } from "@/components/ui/button";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ModerationPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderation");

  if (!(await checkRole("Admin")) && !(await checkRole("Moderator"))) {
    redirect(`/${locale}`);
  }

  const pendingEvents = await prisma.event.findMany({
    where: { moderationStatus: "Pending" },
    include: { organizer: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const dateLocale = locale === "es" ? "es-ES" : "en-US";

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {pendingEvents.length === 0 ? (
        <p className="text-muted-foreground">{t("noEvents")}</p>
      ) : (
        <div className="space-y-4">
          {pendingEvents.map((event) => (
            <div
              key={event.id}
              className="border border-border rounded-xl p-5 bg-card space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h2 className="font-semibold text-lg truncate">{event.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("by")} {event.organizer?.name ?? t("unknownOrganizer")} &middot;{" "}
                    {event.organizer?.email ?? ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startsAt).toLocaleDateString(dateLocale, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" "}{t("at")}{" "}
                    {event.location}
                  </p>
                  {event.description && (
                    <p className="text-sm mt-2 text-foreground/80 line-clamp-3">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <form action={moderateEventAction}>
                    <input type="hidden" name="id" value={event.id} />
                    <input type="hidden" name="status" value="Approved" />
                    <Button type="submit" size="sm" className="w-24 bg-green-600 hover:bg-green-700 text-white">
                      {t("approve")}
                    </Button>
                  </form>
                  <form action={moderateEventAction}>
                    <input type="hidden" name="id" value={event.id} />
                    <input type="hidden" name="status" value="Rejected" />
                    <Button type="submit" size="sm" variant="destructive" className="w-24">
                      {t("reject")}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
