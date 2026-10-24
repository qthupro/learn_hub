import type { VideoStatus } from "./validators";

// Bunny Stream API helpers. See docs/integrations.md. Keys come from Convex env only and must
// never be returned to the browser; only signatures derived from them are.

const API_BASE = "https://video.bunnycdn.com";
export const TUS_ENDPOINT = `${API_BASE}/tusupload`;

/** How long a TUS upload signature stays valid. Bunny wants at least an hour. */
export const UPLOAD_SIGNATURE_TTL_SECONDS = 2 * 60 * 60;
/** How long an admin preview embed URL stays valid. */
export const PREVIEW_TOKEN_TTL_SECONDS = 6 * 60 * 60;
/** How long a public free preview embed URL stays valid; long enough to watch one lesson. */
export const FREE_PREVIEW_TOKEN_TTL_SECONDS = 2 * 60 * 60;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Convex environment variable ${name}`);
  }
  return value;
}

export const bunnyEnv = {
  libraryId: () => requireEnv("BUNNY_STREAM_LIBRARY_ID"),
  apiKey: () => requireEnv("BUNNY_STREAM_API_KEY"),
  readonlyApiKey: () => requireEnv("BUNNY_STREAM_READONLY_API_KEY"),
  tokenKey: () => requireEnv("BUNNY_STREAM_TOKEN_KEY"),
  webhookSecret: () => requireEnv("BUNNY_WEBHOOK_SECRET"),
};

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

/** Compares two strings without returning early on the first differing character. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Headers the browser sends to the TUS endpoint for one video. */
export async function signUpload(videoId: string) {
  const libraryId = bunnyEnv.libraryId();
  const expires = Math.floor(Date.now() / 1000) + UPLOAD_SIGNATURE_TTL_SECONDS;
  const signature = await sha256Hex(libraryId + bunnyEnv.apiKey() + expires + videoId);
  return { endpoint: TUS_ENDPOINT, libraryId, videoId, signature, expires };
}

/** A token-authenticated player URL. Never stored. */
export async function signedEmbedUrl(videoId: string, ttlSeconds = PREVIEW_TOKEN_TTL_SECONDS) {
  const libraryId = bunnyEnv.libraryId();
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = await sha256Hex(bunnyEnv.tokenKey() + videoId + expires);
  return `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
}

function videoUrl(videoId?: string) {
  const base = `${API_BASE}/library/${bunnyEnv.libraryId()}/videos`;
  return videoId === undefined ? base : `${base}/${encodeURIComponent(videoId)}`;
}

function apiHeaders() {
  return { AccessKey: bunnyEnv.apiKey(), Accept: "application/json", "Content-Type": "application/json" };
}

export async function createBunnyVideo(title: string): Promise<string> {
  const response = await fetch(videoUrl(), { method: "POST", headers: apiHeaders(), body: JSON.stringify({ title }) });
  if (!response.ok) {
    throw new Error(`Bunny create video failed with HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("guid" in body) || typeof body.guid !== "string") {
    throw new Error("Bunny create video returned no guid");
  }
  return body.guid;
}

/** Deletes a video from the library. A video that is already gone counts as deleted. */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const response = await fetch(videoUrl(videoId), { method: "DELETE", headers: apiHeaders() });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Bunny delete video failed with HTTP ${response.status}`);
  }
}

export type BunnyVideoState = { status: VideoStatus; durationSeconds?: number };

/** Maps the Stream API's numeric video status. Unknown values never count as ready. */
function mapApiStatus(status: number): VideoStatus {
  switch (status) {
    case 0:
      return "uploading";
    case 4:
      return "ready";
    case 5:
    case 6:
      return "failed";
    default:
      return "processing";
  }
}

/** The video's authoritative state from the Stream API, or null if Bunny doesn't have it. */
export async function fetchBunnyVideo(videoId: string): Promise<BunnyVideoState | null> {
  const response = await fetch(videoUrl(videoId), { headers: apiHeaders() });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Bunny get video failed with HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("status" in body) || typeof body.status !== "number") {
    throw new Error("Bunny get video returned no status");
  }
  const length = "length" in body && typeof body.length === "number" && body.length > 0 ? body.length : undefined;
  return { status: mapApiStatus(body.status), durationSeconds: length };
}
