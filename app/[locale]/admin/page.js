import { redirect } from "next/navigation";
import Link from "next/link";
import { checkRole } from "@/utils/roles";
import { SearchUsers } from "@/components/admin/SearchUsers";
import { clerkClient } from "@clerk/nextjs/server";
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

  const client = await clerkClient();
  const users = query
    ? (await client.users.getUserList({ query })).data
    : (await client.users.getUserList()).data;

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
        const primaryEmail =
          user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId
          )?.emailAddress || "";

        const currentRole = user.publicMetadata?.role ?? "User";
        const roleLabel = t.has(`roles.${currentRole}`)
          ? t(`roles.${currentRole}`)
          : currentRole;

        return (
          <div key={user.id}>
            {/* Desktop */}
            <div className="hidden md:flex items-start justify-between border-b py-4 gap-6">
              {/* LEFT: avatar + details */}
              <div className="flex my-4 mx-4 gap-4 min-w-0">
                <Image
                  src={user.imageUrl}
                  alt={t("profilePicture")}
                  width={75}
                  height={75}
                  className="rounded-md object-cover"
                />
                <div className="min-w-0 align-center">
                  <h1>
                    <span className="font-medium truncate">{t("name")}: </span>
                    {user.firstName} {user.lastName}
                  </h1>
                  <div>
                    <span className="font-medium truncate">{t("email")}: </span>
                    {primaryEmail}
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
                <Image
                  src={user.imageUrl}
                  alt={t("profilePicture")}
                  width={75}
                  height={75}
                  className="rounded-md object-cover"
                />
                <div className="min-w-0 align-center">
                  <h1>
                    <span className="font-medium truncate">{t("name")}: </span>
                    {user.firstName} {user.lastName}
                  </h1>
                  <div>
                    <span className="font-medium truncate">{t("email")}: </span>
                    {primaryEmail}
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
