import { Suspense } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { siteNavLinks } from "@/components/site-nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton>
          <Button variant="ghost" className="hidden sm:inline-flex">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton>
          <Button>Get started</Button>
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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {siteNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex h-8 items-center gap-1.5">
          <ThemeToggle />
          {/* Auth state reads the request, so stream it in instead of blocking prerender. */}
          <Suspense fallback={null}>
            <AuthControls />
          </Suspense>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
