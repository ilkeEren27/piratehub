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

export default function CampusGuidePage() {
  return (
    <main className="animate-fade-in">
      <section className="flex flex-col items-center justify-center my-20 md:my-40 px-4 relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full max-w-7xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            Campus Guide
          </h1>
          <p className="mt-4 text-lg md:text-xl py-4 max-w-2xl text-center text-foreground/90 leading-relaxed mb-12">
            Discover essential locations and resources around Whitworth campus.
            Find study spaces, dining options, athletic facilities, and more to
            help you navigate campus life.
          </p>

          {/* Cards Grid - Responsive: 4 columns on desktop, 1 on mobile */}
          <div className="grid justify-center w-full grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {guideCards.map((card) => (
              <Card key={card.title} className="animate-fade-in flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardDescription className="text-base">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {card.content}
                  </p>
                </CardContent>
                <CardFooter className={card.secondButtonText ? "flex gap-2" : ""}>
                  <Button asChild variant="outline" className={card.secondButtonText ? "flex-1" : "w-full"}>
                    <Link
                      href={card.href}
                      {...(card.href.startsWith("http") && {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      })}
                    >
                      {card.buttonText}
                    </Link>
                  </Button>
                  {card.secondButtonText && card.secondHref && (
                    <Button asChild variant="outline" className="flex-1">
                      <Link
                        href={card.secondHref}
                        {...(card.secondHref.startsWith("http") && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                      >
                        {card.secondButtonText}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
