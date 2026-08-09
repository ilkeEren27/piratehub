"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { votePostAction, voteCommentAction } from "@/app/social/_actions";
import { cn } from "@/lib/utils";

// Optimistic up/down vote control. `kind` is "post" or "comment".
export default function VoteButtons({
  kind = "post",
  id,
  score,
  myVote = 0,
  isSignedIn = false,
  horizontal = false,
}) {
  const router = useRouter();
  const locale = useLocale();
  const [optimistic, setOptimistic] = useState({ score, myVote });
  const [, startTransition] = useTransition();

  async function vote(value) {
    if (!isSignedIn) {
      router.push(`/${locale}/log-in`);
      return;
    }

    const prev = optimistic;
    const next =
      prev.myVote === value
        ? { score: prev.score - value, myVote: 0 }
        : { score: prev.score - prev.myVote + value, myVote: value };
    setOptimistic(next);

    try {
      const action = kind === "comment" ? voteCommentAction : votePostAction;
      await action(id, value);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Vote error:", error);
      setOptimistic(prev);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center",
        horizontal ? "flex-row gap-0.5" : "flex-col gap-0.5"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Upvote"
        onClick={() => vote(1)}
        className={cn(
          "p-1 rounded-lg transition-colors hover:bg-primary/10",
          optimistic.myVote === 1
            ? "text-primary"
            : "text-muted-foreground hover:text-primary"
        )}
      >
        <ArrowBigUp
          className={cn("w-5 h-5", optimistic.myVote === 1 && "fill-current")}
        />
      </button>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums min-w-5 text-center",
          optimistic.myVote === 1 && "text-primary",
          optimistic.myVote === -1 && "text-destructive"
        )}
      >
        {optimistic.score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        onClick={() => vote(-1)}
        className={cn(
          "p-1 rounded-lg transition-colors hover:bg-destructive/10",
          optimistic.myVote === -1
            ? "text-destructive"
            : "text-muted-foreground hover:text-destructive"
        )}
      >
        <ArrowBigDown
          className={cn("w-5 h-5", optimistic.myVote === -1 && "fill-current")}
        />
      </button>
    </div>
  );
}
