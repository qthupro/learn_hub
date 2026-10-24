import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";

const stats = [
  { value: "60,000+", label: "Learners enrolled" },
  { value: "4.8 / 5", label: "Average course rating" },
  { value: "120+ hrs", label: "Of expert video" },
  { value: "$0", label: "Monthly fees, ever" },
];

const learners = ["AK", "JM", "SR", "LT", "EP"];

export function TrustBar() {
  return (
    <section aria-label="Why learners trust LearnHub" className="border-y bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <AvatarGroup>
            {learners.map((initials) => (
              <Avatar key={initials}>
                <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <div className="text-sm">
            <div className="flex items-center gap-0.5" role="img" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }, (_, index) => (
                <StarIcon key={index} aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-1 text-muted-foreground">Loved by learners worldwide</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 lg:gap-x-12">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-bold tracking-heading tabular-nums">{stat.value}</dd>
              <dd className="text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
