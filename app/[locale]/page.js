"use client";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Map, CalendarDays, Compass, Users, ArrowRight } from "lucide-react";

const features = [
  { key: "map", href: "/map", Icon: Map },
  { key: "events", href: "/events", Icon: CalendarDays },
  { key: "guide", href: "/campus-guide", Icon: Compass },
  { key: "social", href: "/social", Icon: Users },
];

export default function Home() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <main className="animate-fade-in">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center mt-16 md:mt-28 px-4 text-center">
        <Image
          alt="PirateHub Logo"
          src="/pirate-icon.png"
          width="96"
          height="96"
          priority
          className="mb-8 drop-shadow-lg transition-transform duration-300 hover:scale-110 hover:-rotate-6"
        />
        <h1 className="text-5xl md:text-6xl font-bold mb-6 pb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          {t("welcome")}
        </h1>
        <p className="mt-2 text-lg md:text-xl max-w-2xl text-center text-foreground/90 leading-relaxed">
          {t("description")}
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Link href={`/${locale}/map`}>
            <Button size="lg" className="h-12 px-6 text-base shadow-md">
              <Map className="h-5 w-5" />
              {t("exploreMap")}
            </Button>
          </Link>
          <Link href={`/${locale}/events`}>
            <Button size="lg" variant="outline" className="h-12 px-6 text-base">
              <CalendarDays className="h-5 w-5" />
              {t("browseEvents")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto px-4 my-20 md:my-28">
        {features.map(({ key, href, Icon }) => (
          <Link
            key={key}
            href={`/${locale}${href}`}
            className="group rounded-xl border bg-card/80 backdrop-blur-sm p-6 hover-lift"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 transition-colors duration-200 group-hover:bg-primary/20">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-1.5">
              {t(`features.${key}.title`)}
              <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(`features.${key}.desc`)}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
