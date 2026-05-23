import EventForm from "@/components/events/EventForm";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

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
    const user = await currentUser();
    if (!user) notFound();

    const appUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true },
    });
    const isOwner = appUser && event.organizerId === appUser.id;
    const isModerator =
      appUser?.role === "Admin" || appUser?.role === "Moderator";
    if (!isOwner && !isModerator) notFound();
  }

  return <EventForm initialEvent={event} />;
}
