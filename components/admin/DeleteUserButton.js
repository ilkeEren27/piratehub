"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

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

function ConfirmButton({ label, pendingLabel }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function DeleteUserButton({
  userId,
  action,
  triggerClassName,
  labels,
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className={triggerClassName}>
          <Trash2 className="w-4 h-4" />
          {labels.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await action(formData);
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={userId} />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {labels.cancel}
            </Button>
            <ConfirmButton
              label={labels.confirm}
              pendingLabel={labels.pending}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
