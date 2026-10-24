"use client";

import { useId, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { contentLimits, contentTitleError } from "@/convex/lib/validators";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";

export type ChapterTarget =
  | { kind: "create"; courseId: Id<"courses"> }
  | { kind: "rename"; chapterId: Id<"chapters">; title: string };

/** Mounted only while the dialog is open, so every opening starts from the target's values. */
function ChapterForm({ target, onDone }: { target: ChapterTarget; onDone: () => void }) {
  const id = useId();
  const createChapter = useMutation(api.chapters.create);
  const renameChapter = useMutation(api.chapters.rename);
  const [title, setTitle] = useState(target.kind === "rename" ? target.title : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const titleError = contentTitleError(title);
    if (titleError !== null) {
      setError(titleError);
      return;
    }
    setPending(true);
    try {
      if (target.kind === "create") {
        await createChapter({ courseId: target.courseId, title });
        toast.success("Chapter added");
      } else {
        await renameChapter({ chapterId: target.chapterId, title });
        toast.success("Chapter renamed");
      }
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      toast.error(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{target.kind === "create" ? "Add chapter" : "Rename chapter"}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-title`}>Title</Label>
        <Input
          id={`${id}-title`}
          value={title}
          maxLength={contentLimits.titleMax}
          autoFocus
          placeholder="e.g. Getting started"
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error ? (
          <p id={`${id}-error`} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
          {target.kind === "create" ? "Add chapter" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** `target` stays set while closing so the form doesn't vanish mid-animation. */
export function ChapterDialog({
  target,
  open,
  onOpenChange,
}: {
  target: ChapterTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {target ? <ChapterForm target={target} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
