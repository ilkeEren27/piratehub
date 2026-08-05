import { redirect } from "next/navigation";
import Link from "next/link";
import { checkRole } from "@/utils/roles";
import { SearchUsers } from "@/components/admin/SearchUsers";
import { prisma } from "@/lib/db";
import { setRole } from "./_actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Gavel } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

const ROLE_VALUES = ["User", "ClubLeader", "ASWU", "Moderator", "Faculty", "Admin"];

function Avatar({ user, alt }) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={alt}
        width={75}
        height={75}
        className="rounded-md object-cover"
      />
    );
  }
  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-[75px] h-[75px] shrink-0 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-3xl font-semibold">
      {initial}
    </div>
  );
}

export default async function AdminDashboard({ searchParams, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  // Guard: only admins
  if (!(await checkRole("Admin"))) {
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

        return (
          <div key={user.id}>
            {/* Desktop */}
            <div className="hidden md:flex items-start justify-between border-b py-4 gap-6">
              {/* LEFT: avatar + details */}
              <div className="flex my-4 mx-4 gap-4 min-w-0">
                <Avatar user={user} alt={t("profilePicture")} />
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
              </div>
            </div>
            {/* Mobile*/}
            <div className="md:hidden">
              <div className="flex my-4 mx-4 gap-4 min-w-0">
                <Avatar user={user} alt={t("profilePicture")} />
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
              </div>
            </div>
          </div>
        );
      })}
    </main>
  );
}
