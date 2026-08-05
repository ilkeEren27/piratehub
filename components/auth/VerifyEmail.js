"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { MailCheck, MailWarning, Mail } from "lucide-react";

import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmail() {
  const t = useTranslations("auth.verify");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  const email = searchParams.get("email") || "";
  const linkError = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const resend = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const targetEmail = String(form.get("email") || email).trim();
    if (!targetEmail) return;

    setLoading(true);
    await authClient.sendVerificationEmail({
      email: targetEmail,
      callbackURL: `/${locale}/verify-email`,
    });
    setLoading(false);
    setResent(true);
  };

  if (isPending) return null;

  // Arrived here via a successful verification link (auto signed in)
  if (session?.user?.emailVerified) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <MailCheck className="h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl">{t("successTitle")}</CardTitle>
          <CardDescription>{t("successBody")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href={`/${locale}`} className="w-full">
            <Button className="w-full">{t("continue")}</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Verification link was invalid or expired
  if (linkError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <MailWarning className="h-10 w-10 text-destructive mb-2" />
          <CardTitle className="text-2xl">{t("errorTitle")}</CardTitle>
          <CardDescription>{t("errorBody")}</CardDescription>
        </CardHeader>
        <form onSubmit={resend}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                autoComplete="email"
                required
              />
            </div>
            {resent && <p className="text-sm text-primary">{t("resent")}</p>}
          </CardContent>
          <CardFooter className="mt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("resending") : t("resend")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // Just signed up — waiting for the user to click the emailed link
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Mail className="h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl">{t("checkTitle")}</CardTitle>
        <CardDescription>
          {email ? t("checkBodyWithEmail", { email }) : t("checkBody")}
        </CardDescription>
      </CardHeader>
      {email && (
        <CardFooter className="flex flex-col gap-2">
          {resent ? (
            <p className="text-sm text-primary">{t("resent")}</p>
          ) : (
            <form onSubmit={resend} className="w-full">
              <input type="hidden" name="email" value={email} />
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {loading ? t("resending") : t("resend")}
              </Button>
            </form>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
