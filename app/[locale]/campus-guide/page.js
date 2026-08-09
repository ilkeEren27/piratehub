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
import PageHeader, { PAGE_MARGIN } from "@/components/PageHeader";

export default function CampusGuidePage() {
  const t = useTranslations("campusGuide");

  return (
    <main className="animate-fade-in">
      <PageHeader title={t("title")} description={t("description")} />
      <section className="mb-16">
        <div
          className={`grid justify-center mt-10 ${PAGE_MARGIN} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`}
        >
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
      </section>
    </main>
  );
}
