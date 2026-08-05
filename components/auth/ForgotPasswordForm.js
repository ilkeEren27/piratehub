"use client";

import { useState } from "react";
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

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const locale = useLocale();

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();

    setLoading(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
    });
    setLoading(false);
    // Always show success — don't reveal whether the email exists
    setSent(true);
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("sentTitle")}</CardTitle>
          <CardDescription>{t("sentBody")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href={`/${locale}/log-in`} className="w-full">
            <Button variant="outline" className="w-full">
              {t("backToLogin")}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

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
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-6">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
          <Link
            href={`/${locale}/log-in`}
            className="text-sm text-primary underline hover:text-primary/80"
          >
            {t("backToLogin")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
