import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { CourseDetail, CourseDetailSkeleton } from "@/components/courses/course-detail";
import { SiteFooter } from "@/components/site-footer";

// Shared by the metadata and the page so each request queries Convex once. Course data is live,
// so it is always fetched at request time; connection() also keeps the Convex client's
// Math.random() out of prerendering.
const loadCourse = cache(async (slug: string) => {
  await connection();
  return await preloadQuery(api.courses.getPublishedBySlug, { slug });
});

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = preloadedQueryResult(await loadCourse(slug));
  if (course === null) {
    return { title: "Course not found" };
  }
  return { title: course.title, description: course.description.slice(0, 160) };
}

async function CourseLoader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const preloaded = await loadCourse(slug);
  // Drafts come back as null too, so they 404 exactly like unknown slugs.
  if (preloadedQueryResult(preloaded) === null) {
    notFound();
  }
  return <CourseDetail preloaded={preloaded} />;
}

export default function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  return (
    <>
      <main className="flex-1">
        {/* The slug is only known at request time. */}
        <Suspense fallback={<CourseDetailSkeleton />}>
          <CourseLoader params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
