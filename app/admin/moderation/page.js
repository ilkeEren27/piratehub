import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { prisma } from "@/lib/db";
import { moderateEventAction } from "@/app/events/_actions";
import { Button } from "@/components/ui/button";

export default async function ModerationPage() {
  if (!(await checkRole("Admin")) && !(await checkRole("Moderator"))) {
    redirect("/");
  }

  const pendingEvents = await prisma.event.findMany({
    where: { moderationStatus: "Pending" },
    include: { organizer: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Event Moderation Queue</h1>

      {pendingEvents.length === 0 ? (
        <p className="text-muted-foreground">No events pending review.</p>
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
                    By {event.organizer?.name ?? "Unknown"} &middot;{" "}
                    {event.organizer?.email ?? ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startsAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" "}at{" "}
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
                      Approve
                    </Button>
                  </form>
                  <form action={moderateEventAction}>
                    <input type="hidden" name="id" value={event.id} />
                    <input type="hidden" name="status" value="Rejected" />
                    <Button type="submit" size="sm" variant="destructive" className="w-24">
                      Reject
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
