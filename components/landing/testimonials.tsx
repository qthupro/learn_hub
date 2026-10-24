import { Section, SectionHeading } from "@/components/landing/section";

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

function Byline({ name, role }: { name: string; role: string }) {
  return (
    <figcaption className="text-sm">
      <span className="font-black">{name}</span>
      <span className="opacity-80"> · {role}</span>
    </figcaption>
  );
}

export function Testimonials() {
  const [lead, ...rest] = testimonials;

  return (
    <Section id="testimonials" tone="brand">
      <SectionHeading eyebrow="Testimonials" title="Learners who stopped renting their education." className="mb-16 sm:mb-20" />

      <figure className="reveal max-w-5xl space-y-6">
        <blockquote className="text-3xl leading-[1.1] font-black tracking-[-0.035em] text-balance sm:text-5xl">
          “{lead.quote}”
        </blockquote>
        <Byline name={lead.name} role={lead.role} />
      </figure>

      <ul className="mt-20 grid gap-x-12 gap-y-12 sm:mt-24 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((item) => (
          <li key={item.name} className="reveal border-t-2 border-brand-foreground pt-6">
            <figure className="space-y-5">
              <blockquote className="text-lg/relaxed font-semibold">“{item.quote}”</blockquote>
              <Byline name={item.name} role={item.role} />
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
