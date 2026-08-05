import { setRequestLocale } from "next-intl/server";
import LogInForm from "@/components/auth/LogInForm";

export default async function LogInPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center justify-center my-20 md:my-32 mx-4">
      <LogInForm />
    </main>
  );
}
