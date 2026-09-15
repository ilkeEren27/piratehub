"use server";

// Server actions for Admin user-role management.
// Roles now live only in our own database (Better Auth session reads them
// from the User table), so there is no external service to keep in sync.

import { revalidatePath } from "next/cache";

import { checkRole, getSessionUser } from "@/utils/roles";
import { prisma } from "@/lib/db";

// Normalize an arbitrary role value into a known enum value
const toRole = (val) => {
  if (!val) return "User";
  const s = String(val).toLowerCase();
  if (s === "admin") return "Admin";
  if (s === "faculty") return "Faculty";
  if (s === "moderator" || s === "mod") return "Moderator";
  if (s === "aswu") return "ASWU";
  if (s === "clubleader" || s === "club_leader" || s === "club-leader")
    return "ClubLeader";
  if (s === "user") return "User";
  return "User";
};

// Action: set a user's role (Admin-only)
export async function setRole(formData) {
  if (!(await checkRole("Admin"))) {
    return { message: "Not Authorized" };
  }

  try {
    const userId = formData.get("id");
    const role = toRole(formData.get("role"));

    const result = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return { message: `Role set to ${result.role}.` };
  } catch (err) {
    console.error("Error setting role:", err);
    return { message: String(err) };
  }
}

// Action: reset a user's role back to "User" (Admin-only)
export async function removeRole(formData) {
  if (!(await checkRole("Admin"))) {
    return { message: "Not Authorized" };
  }

  try {
    const userId = formData.get("id");

    await prisma.user.update({
      where: { id: userId },
      data: { role: "User" },
    });

    return { message: "Role reset to User." };
  } catch (err) {
    console.error("Error resetting role:", err);
    return { message: String(err) };
  }
}

// Action: permanently delete a user (Admin-only)
// Prisma cascades remove the user's sessions, accounts, posts, comments and
// votes; events they organized are kept with a null organizer.
export async function deleteUser(formData) {
  const sessionUser = await getSessionUser();
  if (sessionUser?.role !== "Admin") {
    return { message: "Not Authorized" };
  }

  try {
    const userId = formData.get("id");

    // An admin must not delete their own account out from under themselves.
    if (userId === sessionUser.id) {
      return { message: "You cannot delete your own account." };
    }

    const deleted = await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/[locale]/admin", "page");

    return { message: `Deleted ${deleted.email}.` };
  } catch (err) {
    console.error("Error deleting user:", err);
    return { message: String(err) };
  }
}
