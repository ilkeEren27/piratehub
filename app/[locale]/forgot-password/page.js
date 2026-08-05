import { setRequestLocale } from "next-intl/server";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center justify-center my-20 md:my-32 mx-4">
      <ForgotPasswordForm />
    </main>
  );
}
