"use client";

import { Suspense, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { PageViewTracker } from "@/components/providers/page-view-tracker";
import { useStoreUser } from "@/hooks/use-store-user";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL. Run `npx convex dev` to create .env.local, or set it in your environment.",
  );
}

const convex = new ConvexReactClient(convexUrl);

function StoreUser() {
  useStoreUser();
  return null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <StoreUser />
      {/* usePathname suspends while prerendering dynamic routes. */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </ConvexProviderWithClerk>
  );
}
