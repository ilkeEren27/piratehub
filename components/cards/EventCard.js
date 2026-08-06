"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Pencil, MapPin, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

// Get event details and render them in a card component
export default function EventCard({
  slug,
  title,
  description,
  image,
  location,
  locationId,
  date,
  organizer,
  organizerRole,
  canEdit = false,
  locale = "en",
}) {
  const t = useTranslations("events");
  const [open, setOpen] = useState(false);
  const hasPhoto = image && image !== "/pirate-icon.png";

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="animate-fade-in hover-lift h-full flex flex-col gap-4 pt-0 overflow-hidden cursor-pointer"
      >
        {/* Image banner - same height on every card so rows stay aligned */}
        {hasPhoto ? (
          <div className="relative w-full aspect-video overflow-hidden">
            <Image
              alt="Event Photo"
              src={image}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full aspect-video bg-primary/5 border-b border-dashed">
            <Image
              alt="Event Photo"
              src="/pirate-icon.png"
              width="72"
              height="72"
              className="opacity-70"
            />
          </div>
        )}

        <CardHeader>
          <CardTitle className="font-bold text-xl">{title}</CardTitle>
          {description && (
            <CardDescription className="text-base line-clamp-4">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0 text-primary" />
            <span className="font-medium text-foreground">{location}</span>
          </p>
          {organizer && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              {t("postedBy")}{" "}
              <span className="font-medium text-foreground">{organizer}</span>{" "}
              <Badge variant="secondary">{organizerRole}</Badge>
            </p>
          )}
        </CardContent>

        {/* mt-auto pins the footer so dates line up across cards */}
        <CardFooter className="mt-auto flex items-center justify-between gap-2 flex-wrap">
          <p className="font-semibold text-primary flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 shrink-0" />
            {date}
          </p>
          {canEdit && slug && (
            <Link
              href={`/${locale}/events/editor/${slug}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4" />
                {t("edit")}
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* Full event details - opens when the card is clicked */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl pr-6">{title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
          </DialogHeader>

          {hasPhoto && (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
              <Image
                alt="Event Photo"
                src={image}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 512px"
              />
            </div>
          )}

          {description && (
            <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {description}
            </p>
          )}

          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 text-primary" />
              {t("hostedIn")}{" "}
              <span className="font-medium text-foreground">{location}</span>
            </p>
            {organizer && (
              <p className="flex items-center gap-2 flex-wrap text-muted-foreground">
                {t("postedBy")}{" "}
                <span className="font-medium text-foreground">{organizer}</span>{" "}
                <Badge variant="secondary">{organizerRole}</Badge>
              </p>
            )}
            <p className="font-semibold text-primary flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 shrink-0" />
              {date}
            </p>
          </div>

          <DialogFooter>
            {canEdit && slug && (
              <Link href={`/${locale}/events/editor/${slug}`}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Pencil className="w-4 h-4" />
                  {t("edit")}
                </Button>
              </Link>
            )}
            <Link href={`/${locale}/map?id=${locationId}`}>
              <Button className="w-full sm:w-auto">{t("showLocation")}</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
