import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/utils/roles";
import { SearchUsers } from "@/components/admin/SearchUsers";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { prisma } from "@/lib/db";
import { setRole, deleteUser } from "./_actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import { Gavel } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

const ROLE_VALUES = ["User", "ClubLeader", "ASWU", "Moderator", "Faculty", "Admin"];

// Same avatar as everywhere else on the site (a plain <img>), so an odd
// image URL can never crash the admin panel.
function Avatar({ user }) {
  return (
    <UserAvatar
      name={user.name || user.email}
      image={user.image}
      size="lg"
      className="rounded-md"
    />
  );
}

export default async function AdminDashboard({ searchParams, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  // Guard: only admins
  const sessionUser = await getSessionUser();
  if (sessionUser?.role !== "Admin") {
    redirect(`/${locale}`);
  }

  // Next.js 15: searchParams is a Promise
  const resolvedParams = (await searchParams) || {};
  const query = resolvedParams.search || "";

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <div className="flex justify-end my-4 mx-4">
        <Link href={`/${locale}/admin/moderation`}>
          <Button>
            <Gavel className="w-4 h-4" />
            {t("moderationQueue")}
          </Button>
        </Link>
      </div>
      <SearchUsers />

      {users.map((user) => {
        const currentRole = user.role ?? "User";
        const roleLabel = t.has(`roles.${currentRole}`)
          ? t(`roles.${currentRole}`)
          : currentRole;
        // Admins can delete anyone but themselves.
        const canDelete = user.id !== sessionUser.id;
        const deleteLabels = {
          trigger: t("deleteUser"),
          title: t("deleteUserTitle"),
          description: t("deleteUserDescription", { name: user.name }),
          cancel: t("cancel"),
          confirm: t("confirmDelete"),
          pending: t("deleting"),
        };

        return (
          <div key={user.id}>
            {/* Desktop */}
            <div className="hidden md:flex items-start justify-between border-b py-4 gap-6">
              {/* LEFT: avatar + details */}
              <div className="flex my-4 mx-4 gap-4 min-w-0">
                <Avatar user={user} />
                <div className="min-w-0 align-center">
                  <h1>
                    <span className="font-medium truncate">{t("name")}: </span>
                    {user.name}
                  </h1>
                  <div>
                    <span className="font-medium truncate">{t("email")}: </span>
                    {user.email}
                  </div>
                  <div>
                    <span className="font-medium truncate">{t("role")}: </span>
                    {roleLabel}
                  </div>
                </div>
              </div>

              {/* RIGHT: actions (fixed, no shrink) */}
              <div className="flex flex-col gap-2 shrink-0 items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-40 h-8">
                      {t("setRole")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {ROLE_VALUES.map((roleValue) => (
                      <form key={roleValue} action={setRole}>
                        <input type="hidden" value={user.id} name="id" />
                        <input type="hidden" value={roleValue} name="role" />
                        <DropdownMenuItem asChild>
                          <button type="submit" className="w-full text-left">
                            {t(`roles.${roleValue}`)}
                          </button>
                        </DropdownMenuItem>
                      </form>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {canDelete && (
                  <DeleteUserButton
                    userId={user.id}
                    action={deleteUser}
                    triggerClassName="w-40 h-8"
                    labels={deleteLabels}
                  />
                )}
              </div>
            </div>
            {/* Mobile*/}
            <div className="md:hidden">
              <div className="flex my-4 mx-4 gap-4 min-w-0">
                <Avatar user={user} />
                <div className="min-w-0 align-center">
                  <h1>
                    <span className="font-medium truncate">{t("name")}: </span>
                    {user.name}
                  </h1>
                  <div>
                    <span className="font-medium truncate">{t("email")}: </span>
                    {user.email}
                  </div>
                  <div>
                    <span className="font-medium truncate">{t("role")}: </span>
                    {roleLabel}
                  </div>
                </div>
              </div>

              {/* RIGHT: actions (fixed, no shrink) */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-88 h-8">
                      {t("setRole")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {ROLE_VALUES.map((roleValue) => (
                      <form key={roleValue} action={setRole}>
                        <input type="hidden" value={user.id} name="id" />
                        <input type="hidden" value={roleValue} name="role" />
                        <DropdownMenuItem asChild>
                          <button type="submit" className="w-full text-left">
                            {t(`roles.${roleValue}`)}
                          </button>
                        </DropdownMenuItem>
                      </form>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {canDelete && (
                  <DeleteUserButton
                    userId={user.id}
                    action={deleteUser}
                    triggerClassName="w-88 h-8"
                    labels={deleteLabels}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </main>
  );
}
