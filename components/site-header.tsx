import { Suspense } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton>
          <Button variant="ghost">Sign in</Button>
        </SignInButton>
        <SignUpButton>
          <Button>Sign up</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <Link href="/" className="font-semibold tracking-tight">
        LearnHub
      </Link>
      <nav className="flex h-8 items-center gap-2">
        {/* Auth state reads the request, so stream it in instead of blocking prerender. */}
        <Suspense fallback={null}>
          <AuthControls />
        </Suspense>
      </nav>
    </header>
  );
}
