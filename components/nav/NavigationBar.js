"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import {
  Map,
  Calendar,
  BookOpen,
  Users,
  User,
  Shield,
  LogIn,
  UserPlus,
  LogOut,
  Compass,
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import ThemeToggle from "./ThemeToggle";
import LocaleSwitcher from "./LocaleSwitcher";

export default function NavigationBar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role;
  const isAdmin = role === "Admin";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  const userInitial = (user?.name || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div>
      {/* Desktop Navigation Bar */}
      <header className="hidden lg:flex justify-between items-center my-3 mx-4 px-6 py-3 rounded-xl bg-card/80 backdrop-blur-sm border shadow-sm transition-all duration-200">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Image
            alt="PirateHub Logo"
            src="/pirate-icon.png"
            width="32"
            height="32"
            className="transition-transform duration-200 hover:scale-110"
          />
          <Link
            href={`/${locale}`}
            className="transition-opacity duration-200 hover:opacity-80"
          >
            <h1 className="font-bold text-2xl whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PirateHub
            </h1>
          </Link>
        </div>
        {/* Middle: Navigation Buttons */}
        <div className="flex justify-center gap-2 flex-none">
          <Link href={`/${locale}/map`}>
            <Button className="h-9 px-4" variant="ghost">
              <Map className="h-4 w-4 text-primary" />
              {t("map")}
            </Button>
          </Link>
          <Link href={`/${locale}/events`}>
            <Button className="h-9 px-4" variant="ghost">
              <Calendar className="h-4 w-4 text-accent" />
              {t("events")}
            </Button>
          </Link>
          <Link href={`/${locale}/campus-guide`}>
            <Button className="h-9 px-4" variant="ghost">
              <BookOpen className="h-4 w-4 text-primary" />
              {t("guide")}
            </Button>
          </Link>
          <Link href={`/${locale}/social`}>
            <Button className="h-9 px-4" variant="ghost">
              <Users className="h-4 w-4 text-accent" />
              {t("social")}
            </Button>
          </Link>
        </div>
        {/* Right: Auth Buttons */}
        <div className="flex gap-3 flex-1 min-w-0 justify-end">
          <LocaleSwitcher />
          <ThemeToggle />
          {!user ? (
            <>
              <Link href={`/${locale}/sign-up`}>
                <Button>{t("signUp")}</Button>
              </Link>
              <Link href={`/${locale}/log-in`}>
                <Button>{t("login")}</Button>
              </Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <Link href={`/${locale}/admin`}>
                  <Button>{t("adminPanel")}</Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {userInitial}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuLabel className="max-w-48 truncate">
                    {user.name}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link
                      href={`/${locale}/user-profile`}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4 text-primary" />
                      {t("profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 text-destructive" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </header>
      {/* Mobile Navigation Bar */}
      <header className="flex lg:hidden my-3 justify-between mx-4 px-4 py-3 rounded-xl bg-card/80 backdrop-blur-sm border shadow-sm">
        <div className="flex items-center gap-3">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            {/* Animated Hamburger Icon */}
            <DropdownMenuTrigger className="group relative h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-md hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30">
              <div className="flex flex-col justify-center items-center w-5 h-5">
                <span
                  className={`block h-0.5 w-5 bg-gradient-to-r from-primary to-accent rounded-full transform transition-all duration-300 ease-out ${
                    isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-gradient-to-r from-primary to-accent rounded-full my-1 transition-all duration-300 ease-out ${
                    isMenuOpen ? "opacity-0 scale-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-gradient-to-r from-primary to-accent rounded-full transform transition-all duration-300 ease-out ${
                    isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                />
              </div>
            </DropdownMenuTrigger>

            {/* Enhanced Dropdown Menu */}
            <DropdownMenuContent
              className="w-64 p-0 bg-card/95 backdrop-blur-md border border-primary/20 shadow-xl shadow-primary/5 rounded-xl overflow-hidden"
              align="start"
              sideOffset={8}
            >
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 px-4 py-3 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    PirateHub
                  </span>
                </div>
              </div>

              {/* Navigation Section */}
              <div className="p-2">
                <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {t("menu")}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  asChild
                  className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                >
                  <Link
                    href={`/${locale}/map`}
                    className="flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Map className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{t("map")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                >
                  <Link
                    href={`/${locale}/events`}
                    className="flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded-md bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    <span className="font-medium">{t("events")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                >
                  <Link
                    href={`/${locale}/campus-guide`}
                    className="flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{t("campusGuide")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                >
                  <Link
                    href={`/${locale}/social`}
                    className="flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded-md bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    <span className="font-medium">{t("social")}</span>
                  </Link>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-primary/20 to-transparent h-px" />

              {/* User Section */}
              <div className="p-2">
                <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {t("user")}
                </DropdownMenuLabel>
                {!user ? (
                  <>
                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                    >
                      <Link
                        href={`/${locale}/sign-up`}
                        className="flex items-center gap-3"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <UserPlus className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{t("signUp")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                    >
                      <Link
                        href={`/${locale}/log-in`}
                        className="flex items-center gap-3"
                      >
                        <div className="p-1.5 rounded-md bg-accent/10 group-hover:bg-accent/20 transition-colors">
                          <LogIn className="h-4 w-4 text-accent" />
                        </div>
                        <span className="font-medium">{t("login")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      asChild
                      className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                    >
                      <Link
                        href={`/${locale}/user-profile`}
                        className="flex items-center gap-3"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{t("profile")}</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        asChild
                        className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10"
                      >
                        <Link
                          href={`/${locale}/admin`}
                          className="flex items-center gap-3"
                        >
                          <div className="p-1.5 rounded-md bg-accent/10 group-hover:bg-accent/20 transition-colors">
                            <Shield className="h-4 w-4 text-accent" />
                          </div>
                          <span className="font-medium">{t("adminPanel")}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="group cursor-pointer rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-1.5 rounded-md bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                          <LogOut className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="font-medium text-destructive">
                          {t("signOut")}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </div>

              {/* Footer Gradient */}
              <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-30" />
            </DropdownMenuContent>
          </DropdownMenu>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <div className="flex gap-2 items-center">
          <Link
            href={`/${locale}`}
            className="transition-opacity duration-200 hover:opacity-80"
          >
            <h1 className="font-semibold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PirateHub
            </h1>
          </Link>
          <Image
            alt="PirateHub Logo"
            src="/pirate-icon.png"
            width="32"
            height="32"
            className="transition-transform duration-200 hover:scale-110"
          />
        </div>
      </header>
    </div>
  );
}
