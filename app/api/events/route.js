import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { published: true },
      include: { organizer: { select: { name: true, role: true } } },
      orderBy: { startsAt: "asc" },
    });

    return Response.json(
      {
        success: true,
        events,
        count: events.length,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to fetch events",
        events: [],
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
