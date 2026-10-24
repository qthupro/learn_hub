import type { VideoStatus } from "@/convex/lib/validators";

export const videoStatusLabels: Record<VideoStatus, string> = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};
