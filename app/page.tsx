import { Benefits } from "@/components/landing/benefits";
import { Categories } from "@/components/landing/categories";
import { Faq } from "@/components/landing/faq";
import { FeaturedCourses } from "@/components/landing/featured-courses";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustBar } from "@/components/landing/trust-bar";
import { SiteFooter } from "@/components/site-footer";
import { sampleCourses } from "@/components/courses/course-data";

export default function Home() {
  // Sample catalog until the Convex courses table lands; the layout adapts to 1, 2 or 3+ courses.
  const courses = sampleCourses;

  return (
    <>
      <main className="flex-1">
        <Hero spotlight={courses[0]} />
        <TrustBar />
        <FeaturedCourses courses={courses} />
        <Categories courses={courses} />
        <Benefits />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
