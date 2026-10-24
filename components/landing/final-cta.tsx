import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center shadow-sm sm:px-12">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,color-mix(in_oklch,var(--brand)_16%,transparent),transparent)]"
        />
        <h2 className="mx-auto max-w-2xl text-3xl sm:text-4xl">
          Invest in a skill once. Benefit from it for good.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg/relaxed text-muted-foreground">
          Create a free account to save courses, then buy only what you&apos;ll actually use.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="h-11 px-5 text-base"
            nativeButton={false}
            render={<Link href="/#courses" />}
          >
            Explore courses
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-5 text-base"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            Create free account
          </Button>
        </div>
      </div>
    </section>
  );
}
