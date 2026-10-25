"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import type playerjs from "player.js";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type PlayerJs = typeof playerjs;

const SAVE_INTERVAL_MS = 5000;
// timeupdate fires a few times a second; a bigger jump than this is a seek, not watching.
const MAX_TICK_SECONDS = 3;
// Don't resume into the last moments of a video; start it over instead.
const RESTART_WITHIN_END = 0.95;

/** `{ seconds, duration }` from a timeupdate payload, which may arrive as an object or a JSON string. */
function parseTime(data: unknown): { seconds: number; duration: number } | null {
  let value = data;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value !== "object" || value === null || !("seconds" in value) || !("duration" in value)) {
    return null;
  }
  const { seconds, duration } = value;
  return typeof seconds === "number" && typeof duration === "number" && Number.isFinite(seconds) && Number.isFinite(duration)
    ? { seconds, duration }
    : null;
}

/** The point to resume from, or 0 to start at the beginning. */
export function resumePoint(positionSeconds: number, durationSeconds: number | null) {
  if (positionSeconds < 1) {
    return 0;
  }
  return durationSeconds !== null && positionSeconds >= durationSeconds * RESTART_WITHIN_END ? 0 : positionSeconds;
}

/**
 * Connects to a Bunny player iframe through player.js: seeks to `resumeAt` once it's ready, then
 * saves the position and the seconds actually played to Convex every few seconds, on pause and
 * end, when the tab is hidden, and when the lesson closes. Completion is decided on the server.
 *
 * Create the iframe only after `playerjs` has loaded, so the Player exists before the iframe can
 * send its one "ready" message.
 */
export function useWatchProgress({
  iframe,
  playerjs,
  lessonId,
  resumeAt,
}: {
  iframe: HTMLIFrameElement | null;
  playerjs: PlayerJs;
  lessonId: Id<"lessons">;
  resumeAt: number;
}) {
  const save = useMutation(api.progress.saveWatchProgress);
  // Read once per lesson, so a save coming back doesn't seek the video again.
  const [startAt] = useState(resumeAt);

  useEffect(() => {
    if (iframe === null) {
      return;
    }
    const player = new playerjs.Player(iframe);
    let position = startAt;
    let duration = 0;
    let lastTick: number | null = null;
    let unsavedWatched = 0;
    let dirty = false;

    function flush() {
      if (!dirty) {
        return;
      }
      const watchedSeconds = unsavedWatched;
      unsavedWatched = 0;
      dirty = false;
      save({ lessonId, positionSeconds: position, watchedSeconds, durationSeconds: duration }).catch((error: unknown) => {
        // Keep what was watched so the next save retries it.
        unsavedWatched += watchedSeconds;
        dirty = true;
        console.error("Failed to save watch progress", error);
      });
    }

    function onTimeUpdate(data?: unknown) {
      const time = parseTime(data);
      if (time === null) {
        return;
      }
      if (lastTick !== null) {
        const delta = time.seconds - lastTick;
        if (delta > 0 && delta <= MAX_TICK_SECONDS) {
          unsavedWatched += delta;
        }
      }
      lastTick = time.seconds;
      position = time.seconds;
      duration = time.duration;
      dirty = true;
    }

    function onEnded() {
      position = duration;
      flush();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flush();
      }
    }

    player.on("ready", () => {
      if (startAt > 0) {
        player.setCurrentTime(startAt);
      }
      player.on("timeupdate", onTimeUpdate);
      player.on("pause", flush);
      player.on("ended", onEnded);
    });
    const timer = setInterval(flush, SAVE_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      player.off("timeupdate");
      player.off("pause");
      player.off("ended");
      flush();
    };
  }, [iframe, playerjs, lessonId, startAt, save]);
}
