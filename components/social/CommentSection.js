"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/app/social/_actions";
import VoteButtons from "@/components/social/VoteButtons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Reply, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function CommentForm({ postId, parentId = null, onDone, autoFocus = false }) {
  const t = useTranslations("social");
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("postId", String(postId));
      if (parentId) fd.set("parentId", String(parentId));
      fd.set("content", content);
      await createCommentAction(fd);
      setContent("");
      onDone?.();
      router.refresh();
    } catch (error) {
      console.error("Comment error:", error);
      alert(`${t("errors.commenting")} ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={parentId ? 2 : 3}
        maxLength={5000}
        autoFocus={autoFocus}
        placeholder={parentId ? t("replyPlaceholder") : t("commentPlaceholder")}
        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-muted-foreground/60 resize-none text-sm"
      />
      <div className="flex justify-end gap-2">
        {parentId && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
          {parentId ? t("reply") : t("comment")}
        </Button>
      </div>
    </form>
  );
}

function CommentItem({ comment, postId, currentUser, depth }) {
  const t = useTranslations("social");
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete =
    currentUser.isSignedIn &&
    (currentUser.id === comment.authorId || currentUser.isModerator);

  async function onDelete() {
    if (!window.confirm(t("deleteCommentConfirm"))) return;
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.set("id", String(comment.id));
      await deleteCommentAction(fd);
      router.refresh();
    } catch (error) {
      console.error("Comment deletion error:", error);
      alert(`${t("errors.deletingComment")} ${error.message}`);
      setDeleting(false);
    }
  }

  return (
    <div
      className={cn(
        depth > 0 && "ml-4 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-border/60"
      )}
    >
      <div className="py-3 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {comment.authorName}
          </span>
          <Badge variant="secondary" className="text-xs">
            {comment.authorRole}
          </Badge>
          <span>{comment.timeAgo}</span>
        </div>

        <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed">
          {comment.content}
        </p>

        <div className="flex items-center gap-1 -ml-1">
          <VoteButtons
            kind="comment"
            id={comment.id}
            score={comment.score}
            myVote={comment.myVote}
            isSignedIn={currentUser.isSignedIn}
            horizontal
          />
          {currentUser.isSignedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8"
              onClick={() => setReplying((v) => !v)}
            >
              <Reply className="w-4 h-4" />
              {t("reply")}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive h-8"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {replying && (
          <div className="pt-2">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              autoFocus
              onDone={() => setReplying(false)}
            />
          </div>
        )}
      </div>

      {comment.children.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          postId={postId}
          currentUser={currentUser}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function CommentSection({ postId, comments, currentUser }) {
  const t = useTranslations("social");
  const locale = useLocale();
  const router = useRouter();

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        {t("commentsTitle", { count: comments.total })}
      </h2>

      {currentUser.isSignedIn ? (
        <CommentForm postId={postId} />
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
          {t("signInToComment")}
          <Button size="sm" onClick={() => router.push(`/${locale}/log-in`)}>
            {t("signIn")}
          </Button>
        </div>
      )}

      {comments.tree.length === 0 ? (
        <p className="text-muted-foreground text-sm py-6 text-center">
          {t("noComments")}
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {comments.tree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUser={currentUser}
              depth={0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
