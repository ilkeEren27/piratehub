"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag, Loader2 } from "lucide-react";
import { reportListingAction } from "@/app/marketplace/_actions";
import { reportContentAction } from "@/app/social/_actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Lets a signed-in pirate flag a listing, post or comment for moderators.
// kind: "listing" | "post" | "comment"
export default function ReportButton({ kind, id, compact = false }) {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData(e.currentTarget);
      if (kind === "listing") {
        fd.set("listingId", String(id));
        await reportListingAction(fd);
      } else {
        fd.set("kind", kind);
        fd.set("id", String(id));
        await reportContentAction(fd);
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setDone(false);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title={t("button")}
          className={cn("text-muted-foreground", compact && "h-8")}
        >
          <Flag className="w-4 h-4" />
          {!compact && t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(`title.${kind}`)}</DialogTitle>
          <DialogDescription>{done ? t("thanks") : t("description")}</DialogDescription>
        </DialogHeader>
        {!done && (
          <form onSubmit={onSubmit} className="space-y-4">
            <textarea
              name="reason"
              required
              maxLength={500}
              rows={4}
              placeholder={t("placeholder")}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y placeholder:text-muted-foreground/60"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
