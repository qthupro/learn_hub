"use client";

import { useId, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  bunnyVideoIdError,
  contentLimits,
  contentTitleError,
  lessonDescriptionError,
  type LessonField,
} from "@/convex/lib/validators";
import type { OutlineLesson } from "@/components/admin/use-outline-mutations";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, invalidField } from "@/lib/errors";

export type LessonTarget =
  | { kind: "create"; chapterId: Id<"chapters">; chapterTitle: string }
  | { kind: "edit"; lesson: OutlineLesson };

type FieldErrors = Partial<Record<LessonField, string>>;

/** Mounted only while the dialog is open, so every opening starts from the target's values. */
function LessonForm({ target, onDone }: { target: LessonTarget; onDone: () => void }) {
  const id = useId();
  const createLesson = useMutation(api.lessons.create);
  const updateLesson = useMutation(api.lessons.update);
  const lesson = target.kind === "edit" ? target.lesson : null;
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [isFreePreview, setIsFreePreview] = useState(lesson?.isFreePreview ?? false);
  const [bunnyVideoId, setBunnyVideoId] = useState(lesson?.bunnyVideoId ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  function clearError(field: LessonField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {
      title: contentTitleError(title) ?? undefined,
      description: lessonDescriptionError(description) ?? undefined,
      bunnyVideoId: bunnyVideoId.trim() ? (bunnyVideoIdError(bunnyVideoId) ?? undefined) : undefined,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      const fields = { title, description, isFreePreview, bunnyVideoId };
      if (target.kind === "create") {
        await createLesson({ chapterId: target.chapterId, ...fields });
        toast.success("Lesson added");
      } else {
        await updateLesson({ lessonId: target.lesson._id, ...fields });
        toast.success("Lesson updated");
      }
      onDone();
    } catch (error) {
      const field = invalidField(error);
      if (field === "title" || field === "description" || field === "bunnyVideoId") {
        setErrors((current) => ({ ...current, [field]: errorMessage(error) }));
      }
      toast.error(errorMessage(error));
      setPending(false);
    }
  }

  const fieldId = (name: string) => `${id}-${name}`;
  const errorText = (field: LessonField) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null;
  const invalidProps = (field: LessonField) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{target.kind === "create" ? `Add lesson to “${target.chapterTitle}”` : "Edit lesson"}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("title")}>Title</Label>
        <Input
          id={fieldId("title")}
          value={title}
          maxLength={contentLimits.titleMax}
          autoFocus
          placeholder="e.g. Setting up your project"
          onChange={(event) => {
            setTitle(event.target.value);
            clearError("title");
          }}
          {...invalidProps("title")}
        />
        {errorText("title")}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldId("description")}>
            Description <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {description.trim().length}/{contentLimits.lessonDescriptionMax}
          </span>
        </div>
        <Textarea
          id={fieldId("description")}
          value={description}
          rows={4}
          className="max-h-60"
          onChange={(event) => {
            setDescription(event.target.value);
            clearError("description");
          }}
          {...invalidProps("description")}
        />
        {errorText("description")}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("video")}>
          Bunny Stream video ID <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={fieldId("video")}
          value={bunnyVideoId}
          spellCheck={false}
          autoComplete="off"
          className="font-mono text-xs md:text-xs"
          placeholder="1b2c3d4e-0000-4000-8000-000000000001"
          onChange={(event) => {
            setBunnyVideoId(event.target.value);
            clearError("bunnyVideoId");
          }}
          {...invalidProps("bunnyVideoId")}
        />
        {errors.bunnyVideoId ? (
          errorText("bunnyVideoId")
        ) : (
          <p className="text-xs text-muted-foreground">Paste the video&apos;s ID from Bunny Stream. Uploading comes later.</p>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={fieldId("preview")}>Free preview</Label>
          <p id={fieldId("preview-hint")} className="text-xs text-muted-foreground">
            Anyone can watch this lesson without enrolling.
          </p>
        </div>
        <Switch
          id={fieldId("preview")}
          checked={isFreePreview}
          onCheckedChange={setIsFreePreview}
          aria-describedby={fieldId("preview-hint")}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
          {target.kind === "create" ? "Add lesson" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** `target` stays set while closing so the form doesn't vanish mid-animation. */
export function LessonDialog({
  target,
  open,
  onOpenChange,
}: {
  target: LessonTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {target ? <LessonForm target={target} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
