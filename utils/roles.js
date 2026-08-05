import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Returns the signed-in user ({ id, email, name, role, ... }) or null.
// The id is the primary key of our own User table, so it can be used
// directly in Prisma queries — no Clerk-id lookup needed anymore.
export const getSessionUser = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
};

export const checkRole = async (role) => {
  const user = await getSessionUser();
  return user?.role === role;
};
