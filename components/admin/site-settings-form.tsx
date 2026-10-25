"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { refreshSiteSettings } from "@/app/admin/settings/actions";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  siteImageError,
  siteSettingsFieldError,
  siteSettingsLimits,
  type SiteSettingsField,
} from "@/convex/lib/validators";
import { AdminLoading } from "@/components/admin/admin-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage, invalidField } from "@/lib/errors";
import type { SiteSettings } from "@/lib/site-settings";

type ImageKind = "logo" | "favicon";

/** keep: leave the stored image alone; new: upload this file; remove: clear it. */
type ImageState = { kind: "keep" } | { kind: "new"; file: File; contentType: string; previewUrl: string } | { kind: "remove" };

type FieldErrors = Partial<Record<SiteSettingsField, string>>;

const accept: Record<ImageKind, string> = {
  logo: siteSettingsLimits.logoTypes.join(","),
  favicon: [...siteSettingsLimits.faviconTypes, ".ico"].join(","),
};

/** Some systems report no type for .ico files; treat those as icons. */
function contentTypeOf(file: File) {
  return file.type || (file.name.toLowerCase().endsWith(".ico") ? "image/x-icon" : "");
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** The Settings page: loads the current settings, then shows the form. Admin only. */
export function SiteSettingsForm() {
  const settings = useQuery(api.settings.get);
  if (settings === undefined) {
    return <AdminLoading className="min-h-64" />;
  }
  return <SettingsForm initial={settings} />;
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const fieldId = useId();
  const generateUploadUrl = useMutation(api.settings.generateUploadUrl);
  const update = useMutation(api.settings.update);

  // The last saved values; the form is dirty when it differs from these.
  const [saved, setSaved] = useState(initial);
  const [siteName, setSiteName] = useState(initial.siteName);
  const [description, setDescription] = useState(initial.description);
  const [images, setImages] = useState<Record<ImageKind, ImageState>>({ logo: { kind: "keep" }, favicon: { kind: "keep" } });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const savedUrl: Record<ImageKind, string | null> = { logo: saved.logoUrl, favicon: saved.faviconUrl };
  function previewOf(kind: ImageKind) {
    const image = images[kind];
    return image.kind === "new" ? image.previewUrl : image.kind === "keep" ? savedUrl[kind] : null;
  }

  const dirty =
    siteName.trim() !== saved.siteName ||
    description.trim() !== saved.description ||
    images.logo.kind !== "keep" ||
    images.favicon.kind !== "keep";

  function setError(field: SiteSettingsField, message: string | undefined) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  async function chooseFile(kind: ImageKind, file: File | undefined) {
    if (!file) {
      return;
    }
    const contentType = contentTypeOf(file);
    const error = siteImageError(kind, { type: contentType, size: file.size });
    if (error !== null) {
      setError(kind, error);
      return;
    }
    try {
      const previewUrl = await readAsDataUrl(file);
      setError(kind, undefined);
      setImages((current) => ({ ...current, [kind]: { kind: "new", file, contentType, previewUrl } }));
    } catch {
      setError(kind, "That image couldn't be read. Try another file.");
    }
  }

  async function upload(image: Extract<ImageState, { kind: "new" }>): Promise<Id<"_storage">> {
    const response = await fetch(await generateUploadUrl(), {
      method: "POST",
      headers: { "Content-Type": image.contentType },
      body: image.file,
    });
    if (!response.ok) {
      throw new Error("Image upload failed");
    }
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  /** What to send for an image: undefined keeps it, null removes it, an id replaces it. */
  async function imageChange(kind: ImageKind) {
    const image = images[kind];
    return image.kind === "new" ? await upload(image) : image.kind === "remove" ? null : undefined;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors: FieldErrors = {
      siteName: siteSettingsFieldError("siteName", siteName) ?? undefined,
      description: siteSettingsFieldError("description", description) ?? undefined,
    };
    if (fieldErrors.siteName || fieldErrors.description) {
      setErrors((current) => ({ ...current, ...fieldErrors }));
      return;
    }

    setPending(true);
    try {
      const [logoId, faviconId] = await Promise.all([imageChange("logo"), imageChange("favicon")]);
      await update({ siteName, description, logoId, faviconId });
      // Convex has the change; clear the server's cached copy so server-rendered metadata follows.
      // Open pages already pick the change up live, so a failure here only delays fresh loads.
      const refreshed = await refreshSiteSettings().catch(() => false);
      setSaved({
        siteName: siteName.trim(),
        description: description.trim(),
        logoUrl: previewOf("logo"),
        faviconUrl: previewOf("favicon"),
      });
      setImages({ logo: { kind: "keep" }, favicon: { kind: "keep" } });
      setErrors({});
      if (refreshed) {
        toast.success("Settings saved");
      } else {
        toast.warning("Settings saved", {
          description: "Page titles and the favicon in newly loaded pages may take up to an hour to update.",
        });
      }
    } catch (error) {
      const field = invalidField(error);
      if (field === "siteName" || field === "description" || field === "logo" || field === "favicon") {
        setError(field, errorMessage(error));
      } else {
        toast.error(errorMessage(error));
      }
    } finally {
      setPending(false);
    }
  }

  function errorText(field: SiteSettingsField) {
    return errors[field] ? (
      <p id={`${fieldId}-${field}-error`} className="text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null;
  }

  function imageField(kind: ImageKind, label: string, hint: string, preview: ReactNode) {
    const url = previewOf(kind);
    const inputId = `${fieldId}-${kind}`;
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Label htmlFor={inputId}>{label}</Label>
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        </div>
        {preview}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" nativeButton={false} render={<label htmlFor={inputId} />}>
            <UploadIcon data-icon="inline-start" />
            {url ? "Replace" : "Upload"}
          </Button>
          {url ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Remove ${label.toLowerCase()}`}
              onClick={() => {
                setImages((current) => ({ ...current, [kind]: savedUrl[kind] ? { kind: "remove" } : { kind: "keep" } }));
                setError(kind, undefined);
              }}
            >
              <Trash2Icon />
            </Button>
          ) : null}
        </div>
        <input
          id={inputId}
          type="file"
          accept={accept[kind]}
          className="sr-only"
          aria-invalid={Boolean(errors[kind])}
          aria-describedby={errors[kind] ? `${fieldId}-${kind}-error` : undefined}
          onChange={(event) => {
            void chooseFile(kind, event.target.files?.[0]);
            // Allows picking the same file again after removing it.
            event.target.value = "";
          }}
        />
        {errorText(kind)}
      </div>
    );
  }

  const logoUrl = previewOf("logo");
  const faviconUrl = previewOf("favicon");
  const previewName = siteName.trim() || saved.siteName;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Shown in the site header and footer, browser tabs and search results.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${fieldId}-siteName`}>Site name</Label>
            <Input
              id={`${fieldId}-siteName`}
              value={siteName}
              maxLength={siteSettingsLimits.siteNameMax}
              aria-invalid={Boolean(errors.siteName)}
              aria-describedby={errors.siteName ? `${fieldId}-siteName-error` : undefined}
              onChange={(event) => {
                setSiteName(event.target.value);
                setError("siteName", undefined);
              }}
            />
            {errorText("siteName")}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <Label htmlFor={`${fieldId}-description`}>Website description</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {description.trim().length}/{siteSettingsLimits.descriptionMax}
              </span>
            </div>
            <Textarea
              id={`${fieldId}-description`}
              value={description}
              rows={3}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={`${fieldId}-description-hint${errors.description ? ` ${fieldId}-description-error` : ""}`}
              onChange={(event) => {
                setDescription(event.target.value);
                setError("description", undefined);
              }}
            />
            <p id={`${fieldId}-description-hint`} className="text-sm text-muted-foreground">
              Used as the page description for search engines and in the footer. Leave empty to use the default.
            </p>
            {errorText("description")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Previews update as you pick files; nothing changes on the site until you save.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
          {imageField(
            "logo",
            "Logo",
            "PNG, JPEG or WebP, up to 1 MB. Shown 28px tall beside the site name.",
            // A mock of the header, so the logo is judged at its real size.
            <div className="flex h-16 items-center gap-2 rounded-lg border bg-background px-4">
              {logoUrl ? (
                // A local data URL preview can't go through next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" className="h-7 w-auto max-w-28 object-contain" />
              ) : (
                <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <ImageIcon aria-hidden className="size-4" />
                </span>
              )}
              <span className="truncate text-[1.0625rem] font-bold tracking-heading">{previewName}</span>
            </div>,
          )}
          {imageField(
            "favicon",
            "Favicon",
            "PNG or ICO, up to 256 KB. Square, at least 32×32, works best.",
            // A mock browser tab, so the icon is judged at 16px.
            <div className="flex h-16 items-end rounded-lg border bg-muted px-3">
              <div className="flex h-10 max-w-full items-center gap-2 rounded-t-lg bg-background px-3 text-sm">
                {faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faviconUrl} alt="Favicon preview" className="size-4 shrink-0 object-contain" />
                ) : (
                  // The default favicon, until one is uploaded.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/favicon.ico" alt="Default favicon" className="size-4 shrink-0" />
                )}
                <span className="truncate">{previewName}</span>
              </div>
            </div>,
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : null}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
