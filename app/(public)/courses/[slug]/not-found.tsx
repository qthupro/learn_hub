import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/landing/section";

export default function CourseNotFound() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-8 max-w-3xl text-5xl leading-[0.92] font-black tracking-[-0.05em] sm:text-7xl">
          This course isn&apos;t here.
        </h1>
        <p className="mt-6 max-w-xl text-lg/relaxed font-medium opacity-80">
          It may have been moved or isn&apos;t published yet. Browse the catalog for something to
          learn today.
        </p>
        <Button
          size="lg"
          className="mt-10 h-13 rounded-full bg-brand px-7 text-base font-bold text-brand-foreground hover:bg-brand/85"
          nativeButton={false}
          render={<Link href="/#courses" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Browse courses
        </Button>
      </div>
    </main>
  );
}
