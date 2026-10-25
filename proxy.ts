import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isStudentRoute = createRouteMatcher(["/dashboard(.*)", "/learn(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Signed-out visitors are redirected to the sign-in page and sent back afterwards.
  if (isStudentRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
