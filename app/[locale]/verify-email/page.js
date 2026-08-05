import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import VerifyEmail from "@/components/auth/VerifyEmail";

export default async function VerifyEmailPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center justify-center my-20 md:my-32 mx-4">
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </main>
  );
}
