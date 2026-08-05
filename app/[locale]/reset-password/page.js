import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center justify-center my-20 md:my-32 mx-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
