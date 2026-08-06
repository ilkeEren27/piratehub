"use client";

import InstagramFeed from "@/components/social/InstagramFeed";
import { useTranslations } from "next-intl";

export default function SocialPage() {
  const t = useTranslations("social");
  
  return (
    <main className="animate-fade-in">
      <section className="flex flex-col items-center justify-center mt-12 md:mt-16 mx-4 sm:mx-10 mb-16 gap-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 pb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("description")}
          </p>
        </div>
        <InstagramFeed />
      </section>
    </main>
  );
}
