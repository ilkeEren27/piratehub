"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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

export default function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) {
      setError(t("errors.mismatch"));
      return;
    }

    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword,
      token,
    });
    setLoading(false);

    if (resetError) {
      if (resetError.code === "INVALID_TOKEN") {
        setError(t("errors.invalidToken"));
      } else {
        setError(resetError.message || t("errors.generic"));
      }
      return;
    }

    setDone(true);
  };

  // Link was invalid/expired, or opened without a token
  if (linkError || !token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("invalidTitle")}</CardTitle>
          <CardDescription>{t("errors.invalidToken")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href={`/${locale}/forgot-password`} className="w-full">
            <Button className="w-full">{t("requestNewLink")}</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("successTitle")}</CardTitle>
          <CardDescription>{t("successBody")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href={`/${locale}/log-in`} className="w-full">
            <Button className="w-full">{t("logIn")}</Button>
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
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
