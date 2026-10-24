import { Benefits } from "@/components/landing/benefits";
import { Categories } from "@/components/landing/categories";
import { Faq } from "@/components/landing/faq";
import { FeaturedCourses } from "@/components/landing/featured-courses";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Testimonials } from "@/components/landing/testimonials";
import { Ticker } from "@/components/landing/ticker";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <Ticker />
        <FeaturedCourses />
        <Benefits />
        <Categories />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
