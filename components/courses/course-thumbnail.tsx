import Image from "next/image";
import { cn } from "@/lib/utils";
import { type CategoryId, getCategory } from "@/components/courses/course-data";

const tones: Record<CategoryId, string> = {
  development: "from-indigo-500/20 via-indigo-500/5 to-sky-500/15 text-indigo-600 dark:text-indigo-300",
  design: "from-violet-500/20 via-violet-500/5 to-fuchsia-500/15 text-violet-600 dark:text-violet-300",
  data: "from-sky-500/20 via-sky-500/5 to-cyan-500/15 text-sky-600 dark:text-sky-300",
  ai: "from-purple-500/20 via-indigo-500/5 to-violet-500/15 text-purple-600 dark:text-purple-300",
  business: "from-amber-500/20 via-amber-500/5 to-orange-500/15 text-amber-600 dark:text-amber-300",
  photography: "from-emerald-500/20 via-emerald-500/5 to-teal-500/15 text-emerald-600 dark:text-emerald-300",
};

type CourseThumbnailProps = {
  title: string;
  category: CategoryId;
  thumbnailUrl?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/** Course artwork; falls back to a category-tinted illustration when no image is uploaded. */
export function CourseThumbnail({
  title,
  category,
  thumbnailUrl,
  priority,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
}: CourseThumbnailProps) {
  const Icon = getCategory(category).icon;

  return (
    <div className={cn("relative aspect-video overflow-hidden bg-muted", className)}>
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={title}
          className={cn("absolute inset-0 bg-linear-to-br", tones[category])}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)] dark:opacity-50"
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-background/80 shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm transition-transform duration-500 group-hover/card:scale-105 sm:size-20">
              <Icon className="size-7 sm:size-9" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
