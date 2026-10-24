import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { bunnyEnv, fetchBunnyVideo, hmacSha256Hex, timingSafeEqual } from "./lib/bunny";
import { isBunnyVideoId } from "./lib/validators";

const http = httpRouter();

/**
 * Bunny Stream webhook: POST /bunny/webhook?secret=<BUNNY_WEBHOOK_SECRET>.
 * The URL secret and the body signature are both checked before anything is parsed. The payload
 * only says which video changed; its status is re-fetched from the Bunny API.
 */
http.route({
  path: "/bunny/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = new URL(request.url).searchParams.get("secret") ?? "";
    if (!timingSafeEqual(secret, bunnyEnv.webhookSecret())) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.text();
    const signature = request.headers.get("X-BunnyStream-Signature") ?? "";
    const expected = await hmacSha256Hex(bunnyEnv.readonlyApiKey(), body);
    if (
      request.headers.get("X-BunnyStream-Signature-Version") !== "v1" ||
      request.headers.get("X-BunnyStream-Signature-Algorithm") !== "hmac-sha256" ||
      !timingSafeEqual(signature.toLowerCase(), expected)
    ) {
      return new Response("Invalid signature", { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("VideoLibraryId" in payload) ||
      !("VideoGuid" in payload) ||
      typeof payload.VideoGuid !== "string" ||
      !isBunnyVideoId(payload.VideoGuid)
    ) {
      return new Response("Invalid payload", { status: 400 });
    }
    // Another library's events are acknowledged and ignored.
    if (String(payload.VideoLibraryId) !== bunnyEnv.libraryId()) {
      return new Response(null, { status: 200 });
    }

    const bunnyVideoId = payload.VideoGuid;
    // Throws on Bunny API errors, so the webhook fails and Bunny retries it.
    const state = await fetchBunnyVideo(bunnyVideoId);
    await ctx.runMutation(internal.videos.applyBunnyState, { bunnyVideoId, state });
    return new Response(null, { status: 200 });
  }),
});

export default http;
