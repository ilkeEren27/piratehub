import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/utils/roles";
import ProfileSettings from "@/components/auth/ProfileSettings";

export default async function UserProfilePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/log-in`);

  return (
    <main className="flex justify-center my-8 mx-4">
      <ProfileSettings />
    </main>
  );
}
