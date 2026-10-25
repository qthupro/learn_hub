# Integration notes (verified against official docs)

## Bunny.net Stream
Sources: bunny.net/docs/stream/tus-resumable-uploads.md, bunny.net/docs/stream/token-authentication.md, bunny.net/docs/stream/webhooks.md, Stream API reference.

Env (Convex only): BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY (library API key), BUNNY_STREAM_READONLY_API_KEY, BUNNY_STREAM_TOKEN_KEY (library Security > Token authentication key).

Create video: POST https://video.bunnycdn.com/library/{libraryId}/videos, header AccessKey: <library API key>, JSON body { "title": string }. Response has "guid".
Get video: GET https://video.bunnycdn.com/library/{libraryId}/videos/{videoId}, same header. Fields: "status", "length" (seconds).
Video API status: 0 Created, 1 Uploaded, 2 Processing, 3 Transcoding, 4 Finished, 5 Error, 6 UploadFailed, 7 JitSegmenting, 8 JitPlaylistsCreated.
Our mapping: 0 -> uploading; 1,2,3,7,8 -> processing; 4 -> ready; 5,6 -> failed; unknown -> processing (never ready).

TUS upload: endpoint https://video.bunnycdn.com/tusupload, client tus-js-client.
Headers: AuthorizationSignature, AuthorizationExpire (UNIX seconds, at least 1 hour ahead), VideoId (guid), LibraryId.
Signature = lowercase hex SHA256(library_id + api_key + expiration_time + video_id).
Metadata: filetype (MIME, required), title (required).

Embed playback with token authentication:
https://player.mediadelivery.net/embed/{libraryId}/{videoId}?token={token}&expires={expires}
token = lowercase hex SHA256(token_security_key + video_id + expires), expires in UNIX seconds.

Webhook: POST JSON { "VideoLibraryId": number, "VideoGuid": string, "Status": number }.
Headers: X-BunnyStream-Signature-Version = "v1", X-BunnyStream-Signature-Algorithm = "hmac-sha256", X-BunnyStream-Signature = lowercase hex HMAC-SHA256(raw body, read-only API key).
Verify on the raw body before parsing, constant-time compare.
Webhook Status is a DIFFERENT enum (0 Queued, 1 Processing, 2 Encoding, 3 Finished, 4 Resolution finished, 5 Failed, 6 PresignedUploadStarted, 7 PresignedUploadFinished, 8 PresignedUploadFailed, 9 CaptionsGenerated, 10 TitleOrDescriptionGenerated). Do not use it to set status; re-fetch the video from the API.
Convex HTTP actions URL: https://<deployment>.convex.site — route /bunny/webhook.

Player control (player.js). Source: bunny.net/docs/stream/playback-api.
Package: npm player.js, pinned at 0.1.0 (Bunny also hosts an unpinned playerjs-latest.min.js; we don't use it). It reads window on import, so load it with a dynamic import in the browser. No bundled types; see types/player.js.d.ts.
Usage: new playerjs.Player(iframe); player.on("ready", ...) fires once the player accepts commands. Create the Player before the iframe loads, or the one "ready" message can be missed.
Events: timeupdate { seconds, duration } (Bunny's blog shows it as a JSON string, so accept both), play, pause, ended, seeked, progress, error. Methods include setCurrentTime(seconds), getCurrentTime(cb), getDuration(cb).
Only works inside the embed iframe. Libraries restricted to allowed domains need referrerpolicy="strict-origin-when-cross-origin" on the iframe.
player.js has no destroy method; each Player keeps its window message listener.

## Stripe (Checkout, one-time payments)
Sources: docs.stripe.com/checkout/fulfillment, docs.stripe.com/webhooks.

Env (Convex only): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SITE_URL.
The stripe Node SDK runs only in a "use node" Convex action file (that file can contain only actions).
Create session: stripe.checkout.sessions.create with mode "payment", line_items with price_data (currency "usd", unit_amount from our DB, product_data.name = course title), quantity 1, client_reference_id = our user id, metadata { userId, courseId }, success_url = SITE_URL + "/checkout/success?session_id={CHECKOUT_SESSION_ID}", cancel_url = SITE_URL + "/courses/<slug>". Redirect the browser to session.url.
Fulfillment (per Stripe docs): webhooks are required — the customer may never reach the success page. Also trigger fulfillment from the success page for speed. The fulfill function must be safe to run multiple times and concurrently for the same session; it retrieves the Checkout Session from the API, checks payment_status is not "unpaid", performs fulfillment once and records it.
Events: checkout.session.completed and checkout.session.async_payment_succeeded.
Webhook verification: raw body text + "stripe-signature" header, stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET) inside a Node action; invalid -> 400. Route /stripe/webhook on the Convex HTTP actions URL. The HTTP action reads the body and header and passes both to an internal Node action.
Test card: 4242 4242 4242 4242, any future expiry, any CVC. Local option: stripe listen --forward-to <convex.site URL>/stripe/webhook.
Minimum charge for USD is $0.50.

## dnd-kit (current API)
Source: dndkit.com (Latest docs; the "Legacy" docs cover @dnd-kit/core and @dnd-kit/sortable — do not use those).
Packages: @dnd-kit/react (DragDropProvider, useSortable, onDragEnd with event.canceled and event.operation) and @dnd-kit/helpers (move helper to compute the new order). useSortable takes id and index, optional group for multiple lists; returns ref and handleRef. Check the docs for exact import paths before writing code.

## Test vectors (computed independently with sha256sum / openssl)
- TUS: sha256Hex("12345" + "test-api-key" + "1700000000" + "a1b2c3d4-0000-4000-8000-000000000001") = 9309b856a8f5cbf89aec87a7d50496733dcf4cfea2fea726c2c466ea8ba4e359
- Embed: libraryId "12345", videoId "a1b2c3d4-0000-4000-8000-000000000001", tokenKey "test-token-key", expires 1700003600 -> token = e03aa9fc7f783566a1766503c12012b6a27766ab1502e41a5f7864d40a6006c6
- Webhook HMAC: secret "test-readonly-key", body {"VideoLibraryId":12345,"VideoGuid":"a1b2c3d4-0000-4000-8000-000000000001","Status":3} (exact bytes, no spaces) -> bae7612d6432f7033072b9109294aa54362cd9385d635d2930dd45d4e2afd3db
