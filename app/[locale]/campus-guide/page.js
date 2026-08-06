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
      <section className="flex flex-col items-center justify-center my-12 md:my-16 px-4">
        <div className="flex flex-col items-center w-full max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-center">
            {t("title")}
          </h1>
          <p className="mt-2 text-lg md:text-xl max-w-2xl text-center text-muted-foreground leading-relaxed mb-8">
            {t("description")}
          </p>

          {/* Cards Grid - Responsive: 4 columns on desktop, 1 on mobile */}
          <div className="grid justify-center w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {guideCards.map((card) => {
              const cardT = t.raw(`cards.${card.key}`);
              return (
                <Card key={card.key} className="animate-fade-in hover-lift flex flex-col">
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
                    <Button asChild className="w-full text-sm">
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
