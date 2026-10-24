"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { AlertCircleIcon, FileVideoIcon, Loader2Icon, RotateCcwIcon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Upload } from "tus-js-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { videoStatusLabels } from "@/components/admin/video-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/errors";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

type Phase =
  | { kind: "idle" }
  | { kind: "starting"; fileName: string }
  | { kind: "uploading"; fileName: string; percent: number }
  | { kind: "error"; fileName: string; percent: number; message: string; canResume: boolean }
  // The browser sent the whole file; waiting for Bunny to report it.
  | { kind: "sent" };

/** Token-signed Bunny player for a ready video. Keyed by video id, so a new video fetches a new URL. */
function VideoPreview({ videoId, title }: { videoId: Id<"videos">; title: string }) {
  const getPreviewUrl = useAction(api.videos.previewUrl);
  const [url, setUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getPreviewUrl({ videoId })
      .then((next) => active && setUrl(next))
      .catch(() => active && setUrl(null));
    return () => {
      active = false;
    };
  }, [getPreviewUrl, videoId]);

  if (url === undefined) {
    return <Skeleton className="aspect-video w-full rounded-lg" />;
  }
  if (url === null) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
        Preview unavailable
      </div>
    );
  }
  return (
    <iframe
      src={url}
      title={`Preview of ${title}`}
      className="aspect-video w-full rounded-lg border bg-black"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  );
}

/**
 * Uploads a lesson's video to Bunny Stream over TUS, straight from the browser, and shows the
 * video's live status. Starting an upload replaces the current video right away. Leaving while an
 * upload is unfinished cancels it.
 */
export function LessonVideo({
  lessonId,
  lessonTitle,
  onBusyChange,
}: {
  lessonId: Id<"lessons">;
  lessonTitle: string;
  onBusyChange: (busy: boolean) => void;
}) {
  const id = useId();
  const video = useQuery(api.videos.forLesson, { lessonId });
  const createUpload = useAction(api.videos.createUpload);
  const refreshStatus = useAction(api.videos.refreshStatus);
  const cancelUpload = useMutation(api.videos.cancelUpload);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const uploadRef = useRef<Upload | null>(null);
  const videoIdRef = useRef<Id<"videos"> | null>(null);
  const fileRef = useRef<File | null>(null);
  // Bumped on every start and cancel, so callbacks from an abandoned attempt are ignored.
  const attemptRef = useRef(0);

  const busy = phase.kind === "starting" || phase.kind === "uploading" || phase.kind === "error";
  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  /** Stops the transfer and deletes the unfinished video. */
  function abandon() {
    attemptRef.current++;
    void uploadRef.current?.abort();
    uploadRef.current = null;
    const videoId = videoIdRef.current;
    videoIdRef.current = null;
    return videoId === null ? Promise.resolve(null) : cancelUpload({ videoId });
  }

  // Unmounting mid-upload (closing the page, navigating away) cancels the upload.
  const abandonRef = useRef(abandon);
  useEffect(() => {
    abandonRef.current = abandon;
  });
  useEffect(() => () => void abandonRef.current().catch(() => {}), []);

  function startTransfer(upload: Upload, attempt: number, fileName: string) {
    upload.options.onProgress = (sent, total) => {
      if (attemptRef.current === attempt) {
        setPhase({ kind: "uploading", fileName, percent: total > 0 ? Math.round((sent / total) * 100) : 0 });
      }
    };
    upload.options.onError = () => {
      if (attemptRef.current === attempt) {
        setPhase((current) => ({
          kind: "error",
          fileName,
          percent: current.kind === "uploading" ? current.percent : 0,
          message: "The upload was interrupted. Check your connection and retry.",
          canResume: true,
        }));
      }
    };
    upload.options.onSuccess = () => {
      if (attemptRef.current !== attempt) {
        return;
      }
      const videoId = videoIdRef.current;
      uploadRef.current = null;
      videoIdRef.current = null;
      setPhase({ kind: "sent" });
      toast.success("Video uploaded. Bunny Stream is processing it.");
      // The webhook also reports progress; this just picks up the new status sooner.
      if (videoId !== null) {
        refreshStatus({ videoId }).catch(() => {});
      }
    };
    upload.start();
  }

  async function start(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Choose a video file.");
      return;
    }
    await abandon().catch(() => {});
    const attempt = ++attemptRef.current;
    fileRef.current = file;
    setPhase({ kind: "starting", fileName: file.name });

    let credentials;
    try {
      credentials = await createUpload({ lessonId });
    } catch (error) {
      if (attemptRef.current === attempt) {
        setPhase({ kind: "error", fileName: file.name, percent: 0, message: errorMessage(error), canResume: false });
      }
      return;
    }
    if (attemptRef.current !== attempt) {
      // Canceled while the video was being created.
      void cancelUpload({ videoId: credentials.videoId }).catch(() => {});
      return;
    }
    videoIdRef.current = credentials.videoId;
    const upload = new Upload(file, {
      endpoint: credentials.endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      // Credentials live only in this component, so an upload can only resume within it.
      storeFingerprintForResuming: false,
      headers: {
        AuthorizationSignature: credentials.signature,
        AuthorizationExpire: String(credentials.expires),
        VideoId: credentials.bunnyVideoId,
        LibraryId: credentials.libraryId,
      },
      metadata: { filetype: file.type, title: lessonTitle },
    });
    uploadRef.current = upload;
    setPhase({ kind: "uploading", fileName: file.name, percent: 0 });
    startTransfer(upload, attempt, file.name);
  }

  function retry() {
    if (phase.kind !== "error") {
      return;
    }
    const upload = uploadRef.current;
    if (phase.canResume && upload !== null) {
      // Resumes from the last byte Bunny confirmed.
      const attempt = ++attemptRef.current;
      setPhase({ kind: "uploading", fileName: phase.fileName, percent: phase.percent });
      startTransfer(upload, attempt, phase.fileName);
    } else if (fileRef.current !== null) {
      void start(fileRef.current);
    }
  }

  async function cancel() {
    setPhase({ kind: "idle" });
    try {
      await abandon();
      toast("Upload canceled");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void start(file);
    }
  }

  const inputId = `${id}-video`;
  const waitingForBunny = phase.kind === "sent" && video?.status === "uploading";
  const showDropzone = !busy && !waitingForBunny;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={showDropzone ? inputId : undefined}>Video</Label>
        {video && !busy ? (
          <Badge
            variant={video.status === "failed" ? "destructive" : video.status === "ready" ? "secondary" : "outline"}
          >
            {video.status === "processing" || waitingForBunny ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : null}
            {waitingForBunny ? "Finishing upload" : videoStatusLabels[video.status]}
            {video.status === "ready" && video.durationSeconds ? ` · ${formatClock(video.durationSeconds)}` : null}
          </Badge>
        ) : null}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        {video === undefined ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : phase.kind === "starting" || phase.kind === "uploading" || phase.kind === "error" ? (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              <FileVideoIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{phase.fileName}</span>
            </div>
            {phase.kind === "error" ? (
              <p className="flex items-start gap-1.5 text-sm text-destructive">
                <AlertCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {phase.message}
              </p>
            ) : (
              <Progress value={phase.kind === "uploading" ? phase.percent : null}>
                <ProgressLabel className="text-xs font-normal text-muted-foreground">
                  {phase.kind === "starting" ? "Preparing upload…" : "Uploading to Bunny Stream"}
                </ProgressLabel>
                {phase.kind === "uploading" ? <ProgressValue className="text-xs" /> : null}
              </Progress>
            )}
            <div className="flex justify-end gap-2">
              {phase.kind === "error" ? (
                <Button type="button" size="sm" variant="outline" onClick={retry}>
                  <RotateCcwIcon data-icon="inline-start" />
                  Retry
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="ghost" onClick={() => void cancel()}>
                <XIcon data-icon="inline-start" />
                Cancel upload
              </Button>
            </div>
          </div>
        ) : (
          <>
            {video?.status === "ready" ? (
              <VideoPreview key={video._id} videoId={video._id} title={lessonTitle} />
            ) : null}
            {video?.status === "processing" ? (
              <p className="text-xs text-muted-foreground">
                Bunny Stream is encoding the video. This page updates when it&apos;s ready.
              </p>
            ) : null}
            {video?.status === "failed" ? (
              <p className="text-sm text-destructive">{video.errorMessage ?? "The video failed. Upload it again."}</p>
            ) : null}
            {video?.status === "uploading" && !waitingForBunny ? (
              <p className="text-sm text-muted-foreground">
                The last upload didn&apos;t finish. Upload the file again.
              </p>
            ) : null}
            {waitingForBunny ? (
              <p className="text-xs text-muted-foreground">Waiting for Bunny Stream to confirm the upload…</p>
            ) : null}
          </>
        )}
      </div>

      {video !== undefined && showDropzone ? (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 text-center text-sm transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted/50",
            video ? "py-3" : "py-6",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <UploadIcon aria-hidden className="size-5 text-muted-foreground" />
          <span className="font-medium">{video ? "Replace video" : "Drop a video here or click to choose"}</span>
          <span className="text-xs text-muted-foreground">
            {video
              ? "The current video is deleted when the new upload starts."
              : "Large files upload in the background and can resume."}
          </span>
          <input
            id={inputId}
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Allows choosing the same file again.
              event.target.value = "";
              if (file) {
                void start(file);
              }
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
