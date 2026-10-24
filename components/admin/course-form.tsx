"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  courseFieldError,
  courseLimits,
  type CourseCategory,
  type CourseField,
  type CourseLevel,
  type CourseStatus,
} from "@/convex/lib/validators";
import { categoryOptions, levelOptions, statusOptions } from "@/components/admin/course-options";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";

type EditableCourse = Doc<"courses"> & { thumbnailUrl: string | null };

/** keep: leave the stored image alone; new: upload this file; remove: clear it. */
type ThumbnailState = { kind: "keep" } | { kind: "new"; file: File; previewUrl: string } | { kind: "remove" };

type FieldErrors = Partial<Record<CourseField, string>>;

/** "12.5" → 1250. NaN for anything that isn't a plain non-negative amount. */
function dollarsToCents(price: string) {
  const trimmed = price.trim();
  return /^\d+(\.\d{1,2})?$/.test(trimmed) ? Math.round(Number(trimmed) * 100) : Number.NaN;
}

function centsToDollars(cents: number) {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

function isInvalidInput(data: unknown): data is { code: "INVALID_INPUT"; field: CourseField } {
  return typeof data === "object" && data !== null && "code" in data && data.code === "INVALID_INPUT" && "field" in data;
}

/**
 * A data URL for previewing a local image. Unlike an object URL it needs no revoking, so it
 * survives Cache Components hiding and re-showing the page with <Activity>.
 */
function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * The create form. Cache Components keeps a visited page's state alive, so it is keyed on
 * bfcacheId: a fresh navigation to the page starts empty, while browser back/forward still
 * restores an unsaved draft.
 */
export function CreateCourseForm() {
  const { bfcacheId } = useRouter();
  return <CourseForm key={bfcacheId} />;
}

export function CourseForm({ course }: { course?: EditableCourse }) {
  const router = useRouter();
  const id = useId();
  const generateUploadUrl = useMutation(api.courses.generateThumbnailUploadUrl);
  const createCourse = useMutation(api.courses.create);
  const updateCourse = useMutation(api.courses.update);

  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [price, setPrice] = useState(course ? centsToDollars(course.priceCents) : "0");
  const [category, setCategory] = useState<CourseCategory>(course?.category ?? "development");
  const [level, setLevel] = useState<CourseLevel>(course?.level ?? "beginner");
  const [status, setStatus] = useState<CourseStatus>(course?.status ?? "draft");
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({ kind: "keep" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const previewUrl =
    thumbnail.kind === "new" ? thumbnail.previewUrl : thumbnail.kind === "keep" ? (course?.thumbnailUrl ?? null) : null;

  /** Back to an empty form, so returning to the create page after saving starts fresh. */
  function resetForm() {
    setTitle("");
    setDescription("");
    setPrice("0");
    setCategory("development");
    setLevel("beginner");
    setStatus("draft");
    setThumbnail({ kind: "keep" });
    setErrors({});
  }

  function clearError(field: CourseField) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function chooseFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, thumbnail: "The thumbnail must be an image." }));
      return;
    }
    if (file.size > courseLimits.thumbnailMaxBytes) {
      setErrors((current) => ({ ...current, thumbnail: "The thumbnail must be 2 MB or smaller." }));
      return;
    }
    try {
      const previewUrl = await readAsDataUrl(file);
      clearError("thumbnail");
      setThumbnail({ kind: "new", file, previewUrl });
    } catch {
      setErrors((current) => ({ ...current, thumbnail: "That image couldn't be read. Try another file." }));
    }
  }

  async function uploadThumbnail(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) {
      throw new Error("Thumbnail upload failed");
    }
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = dollarsToCents(price);
    const nextErrors: FieldErrors = {
      title: courseFieldError("title", title) ?? undefined,
      description: courseFieldError("description", description) ?? undefined,
      priceCents: courseFieldError("priceCents", priceCents) ?? undefined,
      thumbnail: errors.thumbnail,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      const fields = { title, description, priceCents, category, level, status };
      const uploadedId = thumbnail.kind === "new" ? await uploadThumbnail(thumbnail.file) : undefined;
      if (course) {
        await updateCourse({
          courseId: course._id,
          ...fields,
          thumbnailId: thumbnail.kind === "remove" ? null : uploadedId,
        });
        // The saved image now comes back as the course's thumbnailUrl.
        setThumbnail({ kind: "keep" });
        toast.success("Course updated");
      } else {
        await createCourse({ ...fields, thumbnailId: uploadedId });
        resetForm();
        toast.success("Course created");
      }
      router.push("/admin/courses");
    } catch (error) {
      if (error instanceof ConvexError && isInvalidInput(error.data)) {
        const { field } = error.data;
        setErrors((current) => ({ ...current, [field]: errorMessage(error) }));
      }
      toast.error(errorMessage(error));
    } finally {
      // Cleared on success too: the page stays alive in the background and must not come back stuck.
      setPending(false);
    }
  }

  const fieldId = (name: string) => `${id}-${name}`;
  const errorId = (field: CourseField) => `${id}-${field}-error`;
  const errorText = (field: CourseField) =>
    errors[field] ? (
      <p id={errorId(field)} className="text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>What students see in the catalog.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId("title")}>Title</Label>
            <Input
              id={fieldId("title")}
              value={title}
              maxLength={courseLimits.titleMax}
              onChange={(event) => {
                setTitle(event.target.value);
                clearError("title");
              }}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? errorId("title") : undefined}
              placeholder="e.g. Modern React from Zero to Production"
            />
            {errorText("title")}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={fieldId("description")}>Description</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {description.trim().length}/{courseLimits.descriptionMax}
              </span>
            </div>
            <Textarea
              id={fieldId("description")}
              value={description}
              rows={6}
              className="min-h-32"
              onChange={(event) => {
                setDescription(event.target.value);
                clearError("description");
              }}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? errorId("description") : undefined}
              placeholder="What will students learn, and who is it for?"
            />
            {errorText("description")}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={fieldId("category")}>Category</Label>
              <Select items={categoryOptions} value={category} onValueChange={(value) => value && setCategory(value)}>
                <SelectTrigger id={fieldId("category")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={fieldId("level")}>Level</Label>
              <Select items={levelOptions} value={level} onValueChange={(value) => value && setLevel(value)}>
                <SelectTrigger id={fieldId("level")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Drafts are hidden from students.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor={fieldId("status")}>Status</Label>
              <Select items={statusOptions} value={status} onValueChange={(value) => value && setStatus(value)}>
                <SelectTrigger id={fieldId("status")} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={fieldId("price")}>Price (USD)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id={fieldId("price")}
                  inputMode="decimal"
                  value={price}
                  className="pl-6 tabular-nums"
                  onChange={(event) => {
                    setPrice(event.target.value);
                    clearError("priceCents");
                  }}
                  aria-invalid={Boolean(errors.priceCents)}
                  aria-describedby={errors.priceCents ? errorId("priceCents") : `${id}-price-hint`}
                />
              </div>
              {errors.priceCents ? (
                errorText("priceCents")
              ) : (
                <p id={`${id}-price-hint`} className="text-xs text-muted-foreground">
                  0 for a free course, otherwise $0.50–$1,000.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thumbnail</CardTitle>
            <CardDescription>16:9 image, up to 2 MB.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
              {previewUrl ? (
                // A local blob preview can't go through next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Thumbnail preview" className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                  <ImageIcon aria-hidden className="size-5" />
                  No thumbnail
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                nativeButton={false}
                render={<label htmlFor={fieldId("thumbnail")} />}
              >
                <UploadIcon data-icon="inline-start" />
                {previewUrl ? "Replace" : "Upload"}
              </Button>
              {previewUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove thumbnail"
                  onClick={() => {
                    setThumbnail(course?.thumbnailId ? { kind: "remove" } : { kind: "keep" });
                    clearError("thumbnail");
                  }}
                >
                  <Trash2Icon />
                </Button>
              ) : null}
            </div>
            <input
              id={fieldId("thumbnail")}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-invalid={Boolean(errors.thumbnail)}
              aria-describedby={errors.thumbnail ? errorId("thumbnail") : undefined}
              onChange={(event) => {
                void chooseFile(event.target.files?.[0]);
                // Allows picking the same file again after removing it.
                event.target.value = "";
              }}
            />
            {errorText("thumbnail")}
          </CardContent>
        </Card>

        <div className="flex gap-2 lg:flex-col">
          <Button type="submit" disabled={pending} className="flex-1 lg:flex-none">
            {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
            {course ? "Save changes" : "Create course"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 lg:flex-none"
            nativeButton={false}
            render={<Link href="/admin/courses" />}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
