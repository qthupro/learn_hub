import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeading } from "@/components/landing/section";

const faqs = [
  {
    question: "Is this really a one-time payment?",
    answer:
      "Yes. Each course has a single price. You pay once at checkout and are never billed again for that course. There are no subscriptions or memberships.",
  },
  {
    question: "What does lifetime access mean?",
    answer:
      "Once you buy a course it stays in your library for as long as LearnHub exists. Rewatch lessons as often as you like, with no expiry date.",
  },
  {
    question: "Do I get future updates to a course?",
    answer:
      "Yes. When an instructor adds or refreshes lessons, the new material appears in your library automatically at no extra cost.",
  },
  {
    question: "Can I learn on my phone?",
    answer:
      "Every lesson streams in a responsive player that works on desktop, tablet and mobile browsers. Your progress syncs across devices.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Checkout is powered by Stripe, so your card details go directly to Stripe and never touch our servers. You'll receive an email receipt for every purchase.",
  },
  {
    question: "Are there free courses?",
    answer:
      "Some courses are free. You can enroll in those with just an account, no payment details required.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you need to know about buying and learning on LearnHub."
          align="left"
        />
        <Accordion className="rounded-2xl border bg-card px-5 shadow-xs sm:px-6">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="py-5 text-base font-semibold tracking-title hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[0.9375rem]/relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
