"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { LogOut } from "lucide-react";

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

export default function ProfileSettings() {
  const t = useTranslations("auth.profile");
  const tRoles = useTranslations("admin.roles");
  const locale = useLocale();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [nameStatus, setNameStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isPending) return null;
  if (!session?.user) return null;

  const user = session.user;
  const roleLabel = user.role ? tRoles(user.role) : tRoles("User");

  const updateName = async (e) => {
    e.preventDefault();
    setNameStatus("");
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name || name === user.name) return;

    setLoading(true);
    const { error } = await authClient.updateUser({ name });
    setLoading(false);
    setNameStatus(error ? error.message : t("nameUpdated"));
    router.refresh();
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus("");
    setPasswordError("");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) {
      setPasswordError(t("errors.mismatch"));
      return;
    }

    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setLoading(false);

    if (error) {
      setPasswordError(
        error.status === 400 || error.code === "INVALID_PASSWORD"
          ? t("errors.wrongPassword")
          : error.message || t("errors.generic")
      );
      return;
    }

    formEl.reset();
    setPasswordStatus(t("passwordChanged"));
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  return (
    <div className="w-full max-w-xl flex flex-col gap-6">
      {/* Account info + name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>
            {user.email} · {roleLabel}
          </CardDescription>
        </CardHeader>
        <form onSubmit={updateName}>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              required
              maxLength={100}
            />
            {nameStatus && <p className="text-sm text-primary">{nameStatus}</p>}
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" disabled={loading}>
              {t("saveName")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>{t("changePasswordTitle")}</CardTitle>
          <CardDescription>{t("changePasswordSubtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={changePassword}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">{t("confirmNewPassword")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {passwordStatus && (
              <p className="text-sm text-primary">{passwordStatus}</p>
            )}
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" disabled={loading}>
              {t("changePassword")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Sign out */}
      <Card>
        <CardContent className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{t("signOutHint")}</p>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
