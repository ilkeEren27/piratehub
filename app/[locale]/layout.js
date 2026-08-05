import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import "../globals.css";
import NavigationBar from "@/components/nav/NavigationBar";
import { routing } from "@/i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  
  return {
    title: messages.metadata?.title || "PirateHub",
    description: messages.metadata?.description || "Campus Hub for Pirates",
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <NextIntlClientProvider messages={messages}>
          <NavigationBar />
          <main className="flex-1">
            {children}
            <Analytics />
          </main>
          <Footer messages={messages} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function Footer({ messages }) {
  return (
    <footer className="w-full py-8 flex items-center justify-center border-t mt-12 bg-card/50 backdrop-blur-sm">
      <p className="text-center text-muted-foreground">
        {messages.footer?.madeBy || "Made by"}{" "}
        <a 
          className="underline text-primary hover:text-primary/80 transition-colors duration-200 font-medium" 
          href="https://ilkeeren.dev"
        >
          Eren
        </a>{" "}
        {messages.footer?.with || "with"} <span className="text-primary">❤️</span>
      </p>
    </footer>
  );
}
