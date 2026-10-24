import { QuoteIcon, StarIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Section, SectionHeading } from "@/components/landing/section";
import { initials } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "I bought the React course two years ago and still go back to it before every new project. Not paying monthly for that is a relief.",
    name: "Aisha Karim",
    role: "Frontend Developer",
  },
  {
    quote:
      "The design systems course is the most practical thing I've watched. Clear, calm and straight to the point.",
    name: "Jonas Meyer",
    role: "Product Designer",
  },
  {
    quote:
      "I paused learning for six months after a new job. When I came back, everything was still there, including the updated lessons.",
    name: "Sara Rossi",
    role: "Data Analyst",
  },
  {
    quote:
      "Progress tracking keeps me honest. I finish courses here, which I can't say about any subscription I've had.",
    name: "Liam Tran",
    role: "Software Engineer",
  },
  {
    quote:
      "Our team expensed individual courses instead of seats. Simple receipts, no renewals to chase.",
    name: "Elena Popescu",
    role: "Engineering Manager",
  },
  {
    quote:
      "Video quality is excellent and the player is fast even on my phone during my commute.",
    name: "Marcus Lee",
    role: "Marketing Lead",
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials" className="bg-muted/30">
      <SectionHeading
        eyebrow="Testimonials"
        title="Learners who stopped renting their education"
        className="mb-12 sm:mb-16"
      />
      <ul className="gap-6 sm:columns-2 lg:columns-3">
        {testimonials.map((item) => (
          <li
            key={item.name}
            className="mb-6 break-inside-avoid rounded-2xl border bg-card p-6 shadow-xs"
          >
            <figure className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5" role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon key={index} aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <QuoteIcon aria-hidden className="size-5 text-muted-foreground/30" />
              </div>
              <blockquote className="text-[0.9375rem]/relaxed text-pretty text-foreground/90">“{item.quote}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="text-xs font-medium">{initials(item.name)}</AvatarFallback>
                </Avatar>
                <div className="text-sm leading-tight">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-muted-foreground">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
