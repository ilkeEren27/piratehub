import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import NavigationBar from "@/components/nav/NavigationBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PirateHub",
  description: "Campus Hub for Whitworth Pirates",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <NavigationBar />
          <main className="flex-1">
            {children}
            <Analytics />
          </main>
          <footer className="w-full py-8 flex items-center justify-center border-t mt-12 bg-card/50 backdrop-blur-sm">
            <p className="text-center text-muted-foreground">
              Made by{" "}
              <a 
                className="underline text-primary hover:text-primary/80 transition-colors duration-200 font-medium" 
                href="https://ilkeeren.dev"
              >
                Eren
              </a>{" "}
              with <span className="text-primary">❤️</span>
            </p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
