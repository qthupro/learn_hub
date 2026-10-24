import { CourseShowcase } from "@/components/courses/course-showcase";
import type { CourseSummary } from "@/components/courses/course-data";
import { Section, SectionHeading } from "@/components/landing/section";

const headings: Record<"one" | "two" | "many", { title: string; description: string }> = {
  one: {
    title: "Our flagship course",
    description: "Everything you need, in one carefully crafted program. Pay once and it's yours.",
  },
  two: {
    title: "Two courses, built to go deep",
    description: "Pick the path that fits your goals. Each is a one-time purchase with lifetime access.",
  },
  many: {
    title: "Find your next course",
    description: "Search, filter and sort the full catalog. Every course is a one-time purchase.",
  },
};

export function FeaturedCourses({ courses }: { courses: CourseSummary[] }) {
  const heading = headings[courses.length <= 1 ? "one" : courses.length === 2 ? "two" : "many"];

  return (
    <Section id="courses">
      <SectionHeading eyebrow="Featured courses" {...heading} className="mb-12 sm:mb-16" />
      <CourseShowcase courses={courses} />
    </Section>
  );
}
