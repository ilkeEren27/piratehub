import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
          {/* Each page renders its own <main>. */}
          <div className="flex-1">
            {children}
            <Analytics />
          </div>
          <Footer messages={messages} locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function Footer({ messages, locale }) {
  const f = messages.footer ?? {};
  const links = [
    { href: `/${locale}/terms`, label: f.terms },
    { href: `/${locale}/privacy`, label: f.privacy },
    { href: `/${locale}/copyright`, label: f.copyright },
    { href: `/${locale}/marketplace/terms`, label: f.marketplaceTerms },
  ];

  return (
    <footer className="w-full py-8 px-6 flex flex-col items-center gap-3 border-t mt-12 bg-card/50 backdrop-blur-sm text-center">
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="max-w-2xl text-xs text-muted-foreground">{f.disclaimer}</p>
      <p className="text-muted-foreground">
        {f.madeBy || "Made by"}{" "}
        <a
          className="underline text-primary hover:text-primary/80 transition-colors duration-200 font-medium"
          href="https://ilkeeren.dev"
        >
          Eren
        </a>{" "}
        {f.with || "with"} <span className="text-primary">❤️</span>
      </p>
    </footer>
  );
}
