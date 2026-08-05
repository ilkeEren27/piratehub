import EventForm from "@/components/events/EventForm";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/utils/roles";

import { prisma } from "@/lib/db";

export default async function EventEditorPage({ params }) {
  const { id } = await params;
  const idValue = id?.[0]; // slug or id
  const event = idValue
    ? await prisma.event.findFirst({
        where: { OR: [{ id: Number(idValue) || -1 }, { slug: idValue }] },
      })
    : null;

  if (event) {
    const user = await getSessionUser();
    if (!user) notFound();

    const isOwner = event.organizerId === user.id;
    const isModerator = user.role === "Admin" || user.role === "Moderator";
    if (!isOwner && !isModerator) notFound();
  }

  return <EventForm initialEvent={event} />;
}
