import { ConvexError } from "convex/values";

const messages: Record<string, string> = {
  UNAUTHENTICATED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "That item no longer exists.",
  CONFLICT: "That conflicts with existing data.",
  INVALID_INPUT: "Some fields are invalid.",
};

/** A user-facing message for an error thrown by a Convex function. */
export function errorMessage(error: unknown) {
  if (error instanceof ConvexError) {
    const data: unknown = error.data;
    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        return data.message;
      }
      if ("code" in data && typeof data.code === "string" && data.code in messages) {
        return messages[data.code];
      }
    }
  }
  return "Something went wrong. Please try again.";
}

/** The field named by an INVALID_INPUT error, so a form can highlight it. */
export function invalidField(error: unknown): string | null {
  if (error instanceof ConvexError) {
    const data: unknown = error.data;
    if (typeof data === "object" && data !== null && "code" in data && data.code === "INVALID_INPUT") {
      return "field" in data && typeof data.field === "string" ? data.field : null;
    }
  }
  return null;
}
