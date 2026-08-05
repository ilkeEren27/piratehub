import { setRequestLocale } from "next-intl/server";
import SignUpForm from "@/components/auth/SignUpForm";

export default async function SignUpPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center justify-center my-20 md:my-32 mx-4">
      <SignUpForm />
    </main>
  );
}
