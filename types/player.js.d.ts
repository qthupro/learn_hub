// player.js 0.1.0 ships no types. Only the parts the lesson player uses, per
// https://bunny.net/docs/stream/playback-api.
declare module "player.js" {
  type PlayerEvent = "ready" | "play" | "pause" | "ended" | "seeked" | "timeupdate" | "progress" | "error";

  interface Player {
    /** `timeupdate` passes `{ seconds, duration }`; Bunny's blog shows it as a JSON string too. */
    on(event: PlayerEvent, callback: (data?: unknown) => void): boolean;
    off(event: PlayerEvent, callback?: (data?: unknown) => void): boolean;
    setCurrentTime(seconds: number): void;
  }

  const playerjs: { Player: new (iframe: HTMLIFrameElement) => Player };
  export default playerjs;
}
