"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { setListingSoldAction } from "@/app/marketplace/_actions";
import { Button } from "@/components/ui/button";

export default function SoldToggle({ listingId, sold }) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await setListingSoldAction(listingId, !sold);
      router.refresh();
    } catch (error) {
      console.error("Mark sold error:", error);
      alert(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={onClick}>
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : sold ? (
        <RotateCcw className="w-4 h-4" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      {sold ? t("markAvailable") : t("markSold")}
    </Button>
  );
}
