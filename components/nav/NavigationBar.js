import Image from "next/image";
import { checkRole } from "@/utils/roles";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { Menu } from "lucide-react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";

export default async function NavigationBar() {
  const isAdmin = await checkRole("Admin");
  return (
    <div>
      {/* Desktop Navigation Bar */}
      <header className="hidden md:flex justify-between items-center my-3 mx-4 px-6 py-3 rounded-xl bg-card/80 backdrop-blur-sm border shadow-sm transition-all duration-200">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Image
            alt="Whitworth Logo"
            src="/whitworth.png"
            width="32"
            height="32"
            className="transition-transform duration-200 hover:scale-110"
          />
          <Link href="/" className="transition-opacity duration-200 hover:opacity-80">
            <h1 className="font-semibold text-2xl whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PirateHub
            </h1>
          </Link>
        </div>
        {/* Middle: Navigation Buttons */}
        <div className="flex justify-center gap-2 flex-none">
          <Link href="/map">
            <Button className="w-20 h-9" variant="ghost">
              Map
            </Button>
          </Link>
          <Link href="/events">
            <Button className="w-20 h-9" variant="ghost">
              Events
            </Button>
          </Link>
          <Link href="/campus-guide">
            <Button className="w-28 h-9" variant="ghost">
              Guide
            </Button>
          </Link>
          <Link href="/social">
            <Button className="w-20 h-9" variant="ghost">
              Social
            </Button>
          </Link>
        </div>
        {/* Right: Auth Buttons */}
        <div className="flex gap-3 flex-1 min-w-0 justify-end">
          <ThemeToggle />
          <SignedOut>
            <SignUpButton>
              <Button>Sign Up</Button>
            </SignUpButton>
            <SignInButton>
              <Button>Login</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            {isAdmin && (
              <Link href="/admin">
                <Button>Admin Panel</Button>
              </Link>
            )}
            <UserButton />
          </SignedIn>
        </div>
      </header>
      {/* Mobile Navigation Bar */}
      <header className="flex md:hidden my-3 justify-between mx-4 px-4 py-3 rounded-xl bg-card/80 backdrop-blur-sm border shadow-sm">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 w-9 flex items-center justify-center transition-transform duration-200 hover:scale-110">
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border shadow-lg rounded-lg">
              <DropdownMenuLabel>
                <p className="font-bold">User</p>
              </DropdownMenuLabel>
              <SignedOut>
                <DropdownMenuItem asChild>
                  <SignUpButton>Sign Up</SignUpButton>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <SignInButton>Login</SignInButton>
                </DropdownMenuItem>
              </SignedOut>
              <SignedIn>
                <DropdownMenuItem asChild>
                  <Link href="/user-profile">Profile</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <SignOutButton />
                </DropdownMenuItem>
              </SignedIn>
              <DropdownMenuLabel>
                <p className="font-bold">Menu</p>
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/map">Map</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events">Events</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/campus-guide">Campus Guide</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/social">Social</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/" className="transition-opacity duration-200 hover:opacity-80">
            <h1 className="font-semibold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">PirateHub</h1>
          </Link>
          <Image
            alt="Whitworth Logo"
            src="/whitworth.png"
            width="32"
            height="32"
            className="transition-transform duration-200 hover:scale-110"
          />
        </div>
      </header>
    </div>
  );
}
