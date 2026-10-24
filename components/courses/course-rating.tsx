import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CourseRatingProps = {
  rating: number;
  reviewCount?: number;
  className?: string;
};

export function CourseRating({ rating, reviewCount, className }: CourseRatingProps) {
  const filled = Math.round(rating);

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", className)}>
      <span className="font-semibold tabular-nums">{rating.toFixed(1)}</span>
      <span className="flex" role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            aria-hidden
            className={cn(
              "size-3.5",
              index < filled ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40",
            )}
          />
        ))}
      </span>
      {reviewCount !== undefined && (
        <span className="text-muted-foreground tabular-nums">
          ({reviewCount.toLocaleString("en-US")})
        </span>
      )}
    </div>
  );
}
