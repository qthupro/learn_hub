import { AsteriskIcon } from "lucide-react";

const promises = [
  "No subscriptions",
  "Lifetime access",
  "Free course updates",
  "Learn at your own pace",
  "HD on any device",
  "Secure Stripe checkout",
];

// Each half repeats the list so it stays wider than very wide screens; otherwise a gap shows before the loop wraps.
const half = [...promises, ...promises];

/** Accent band of scrolling promises. Pauses on hover; runs slower for visitors who prefer reduced motion. */
export function Ticker() {
  return (
    <section aria-label="What every course includes" className="overflow-hidden bg-brand py-5 text-brand-foreground">
      <div className="flex w-max animate-marquee [will-change:translate] hover:[animation-play-state:paused] motion-reduce:[animation-duration:240s]">
        {/* The animation shifts by exactly one half, so both halves must be identical. The copy is hidden from assistive tech. */}
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center">
            {half.map((promise, index) => (
              <li
                key={index}
                aria-hidden={(copy === 0 && index >= promises.length) || undefined}
                className="flex items-center gap-6 pr-6 text-xl font-black tracking-[-0.03em] whitespace-nowrap uppercase sm:gap-8 sm:pr-8 sm:text-3xl"
              >
                {promise}
                <AsteriskIcon aria-hidden className="size-6 sm:size-8" strokeWidth={3} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
