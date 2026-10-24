import { GraduationCapIcon } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import { CourseCatalog } from "@/components/courses/course-catalog";
import type { CourseSummary } from "@/components/courses/course-data";
import { FeaturedCourse } from "@/components/courses/featured-course";

/** Picks the layout that best fits the catalog size: spotlight, pair, or searchable grid. */
export function CourseShowcase({ courses }: { courses: CourseSummary[] }) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <GraduationCapIcon aria-hidden className="size-6 text-muted-foreground" />
        <p className="font-semibold">New courses are on the way</p>
        <p className="text-sm text-muted-foreground">Check back soon for our first release.</p>
      </div>
    );
  }

  if (courses.length === 1) {
    return <FeaturedCourse course={courses[0]} />;
  }

  if (courses.length === 2) {
    return (
      <ul className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:gap-8">
        {courses.map((course) => (
          <li key={course.slug} className="flex">
            <CourseCard
              course={course}
              detailed
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full"
            />
          </li>
        ))}
      </ul>
    );
  }

  return <CourseCatalog courses={courses} />;
}
