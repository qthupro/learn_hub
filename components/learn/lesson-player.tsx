"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAction } from "convex/react";
import { VideoOffIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { LearningLesson } from "@/components/learn/learning-course";
import { Skeleton } from "@/components/ui/skeleton";
import { resumePoint, useWatchProgress } from "@/hooks/use-watch-progress";

type PlayerJs = typeof import("player.js").default;

function PlayerFrame({ children }: { children: ReactNode }) {
  return (
    // Edge to edge under the navbar and beside the sidebar.
    <div className="w-full bg-black">
      {/* 16:9 at full width, but never taller than the space below the navbar: on very wide
          screens the sides fill with black instead. */}
      <div className="relative mx-auto aspect-video w-full max-w-[calc((100svh-var(--header-height))*16/9)]">
        {children}
      </div>
    </div>
  );
}

function PlayerMessage({ children }: { children: ReactNode }) {
  return (
    <PlayerFrame>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/80">
        <VideoOffIcon aria-hidden className="size-6" />
        {children}
      </div>
    </PlayerFrame>
  );
}

const iframeProps = {
  className: "absolute inset-0 size-full",
  allow: "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture",
  allowFullScreen: true,
  // Bunny's docs require it for libraries that restrict playback to allowed domains.
  referrerPolicy: "strict-origin-when-cross-origin",
} as const;

/** The player iframe with watch progress tracking attached. */
function TrackedPlayer({ url, playerjs, lesson }: { url: string; playerjs: PlayerJs; lesson: LearningLesson }) {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  useWatchProgress({
    iframe,
    playerjs,
    lessonId: lesson._id,
    resumeAt: resumePoint(lesson.positionSeconds, lesson.durationSeconds),
  });
  return (
    <PlayerFrame>
      <iframe ref={setIframe} src={url} title={lesson.title} {...iframeProps} />
    </PlayerFrame>
  );
}

type Loaded = { url: string; playerjs: PlayerJs | null };

/** Fetches a short-lived signed Bunny URL and player.js together. Key by lesson id. */
function SignedPlayer({ lesson }: { lesson: LearningLesson }) {
  const getUrl = useAction(api.videos.lessonPlaybackUrl);
  const [loaded, setLoaded] = useState<Loaded | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    Promise.all([
      getUrl({ lessonId: lesson._id }),
      // Loaded in the browser only: it touches window as soon as it's imported. Playback still
      // works without it, just untracked.
      import("player.js").then(
        (module) => module.default,
        (error: unknown) => {
          console.error("Failed to load player.js", error);
          return null;
        },
      ),
    ])
      .then(([url, playerjs]) => active && setLoaded({ url, playerjs }))
      .catch(() => active && setLoaded(null));
    return () => {
      active = false;
    };
  }, [getUrl, lesson._id]);

  if (loaded === undefined) {
    return (
      <PlayerFrame>
        <Skeleton className="absolute inset-0 rounded-none bg-white/10" />
      </PlayerFrame>
    );
  }
  if (loaded === null) {
    return <PlayerMessage>This video couldn&apos;t be loaded. Please refresh the page to try again.</PlayerMessage>;
  }
  if (loaded.playerjs === null) {
    return (
      <PlayerFrame>
        <iframe src={loaded.url} title={lesson.title} {...iframeProps} />
      </PlayerFrame>
    );
  }
  return <TrackedPlayer url={loaded.url} playerjs={loaded.playerjs} lesson={lesson} />;
}

/** A 16:9 player that fills the content width and records watch progress. */
export function LessonPlayer({ lesson }: { lesson: LearningLesson }) {
  if (!lesson.hasVideo) {
    return <PlayerMessage>The video for this lesson is on its way. Check back soon.</PlayerMessage>;
  }
  return <SignedPlayer key={lesson._id} lesson={lesson} />;
}
