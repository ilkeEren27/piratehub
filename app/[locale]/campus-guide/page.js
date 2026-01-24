"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { guideCards } from "@/data/guideCards";
import { useTranslations } from "next-intl";

export default function CampusGuidePage() {
  const t = useTranslations("campusGuide");
  
  return (
    <main className="animate-fade-in">
      <section className="flex flex-col items-center justify-center my-12 md:my-16 px-4 relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-7xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg md:text-xl py-4 max-w-2xl text-center text-foreground/90 leading-relaxed mb-12">
            {t("description")}
          </p>

          {/* Cards Grid - Responsive: 4 columns on desktop, 1 on mobile */}
          <div className="grid justify-center w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {guideCards.map((card) => {
              const cardT = t.raw(`cards.${card.key}`);
              return (
                <Card key={card.key} className="animate-fade-in flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">{cardT.title}</CardTitle>
                    <CardDescription className="text-base">
                      {cardT.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">
                      {cardT.content}
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full text-sm">
                      <Link
                        href={card.href}
                        {...(card.href.startsWith("http") && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                      >
                        {cardT.buttonText}
                      </Link>
                    </Button>
                    {cardT.secondButtonText && card.secondHref && (
                      <Button asChild variant="outline" className="w-full text-sm">
                        <Link
                          href={card.secondHref}
                          {...(card.secondHref.startsWith("http") && {
                            target: "_blank",
                            rel: "noopener noreferrer",
                          })}
                        >
                          {cardT.secondButtonText}
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
