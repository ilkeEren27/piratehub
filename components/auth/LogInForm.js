"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
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

export default function LogInForm() {
  const t = useTranslations("auth.logIn");
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setVerificationSent(false);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    setLoading(true);
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      if (signInError.status === 403) {
        // Account exists but email is not verified yet
        setUnverifiedEmail(email);
        setError(t("errors.notVerified"));
      } else if (signInError.status === 401) {
        setError(t("errors.invalid"));
      } else {
        setError(signInError.message || t("errors.generic"));
      }
      return;
    }

    router.push(`/${locale}`);
    router.refresh();
  };

  const resendVerification = async () => {
    setLoading(true);
    await authClient.sendVerificationEmail({
      email: unverifiedEmail,
      callbackURL: `/${locale}/verify-email`,
    });
    setLoading(false);
    setVerificationSent(true);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Link
                href={`/${locale}/forgot-password`}
                className="text-xs text-primary underline hover:text-primary/80"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {unverifiedEmail && !verificationSent && (
            <Button
              type="button"
              variant="outline"
              onClick={resendVerification}
              disabled={loading}
            >
              {t("resendVerification")}
            </Button>
          )}
          {verificationSent && (
            <p className="text-sm text-primary">{t("verificationSent")}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-6">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link
              href={`/${locale}/sign-up`}
              className="text-primary underline hover:text-primary/80"
            >
              {t("signUp")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
