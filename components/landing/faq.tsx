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
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered."
          description="Everything you need to know about buying and learning on LearnHub."
          className="lg:sticky lg:top-28 lg:self-start"
        />
        <Accordion className="reveal border-y-2 border-foreground">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question} className="not-last:border-b-2 not-last:border-foreground">
              <AccordionTrigger className="rounded-none py-6 text-lg font-extrabold tracking-title hover:no-underline hover:text-foreground sm:text-xl **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-foreground aria-expanded:**:data-[slot=accordion-trigger-icon]:text-brand">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-base/relaxed font-medium opacity-80 sm:text-lg/relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
