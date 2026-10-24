import Image from "next/image";
import { cn } from "@/lib/utils";
import { type CategoryId, getCategory } from "@/components/courses/course-data";

type CourseThumbnailProps = {
  title: string;
  category: CategoryId;
  thumbnailUrl?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/** Course artwork; falls back to the category icon on an ink block when no image is uploaded. */
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
    <div className={cn("@container relative aspect-video overflow-hidden bg-ink", className)}>
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover/course:scale-105"
        />
      ) : (
        <div role="img" aria-label={title} className="absolute inset-0 grid place-items-center text-brand">
          <Icon
            aria-hidden
            className="size-[22cqw] transition-transform duration-700 ease-out motion-safe:group-hover/course:scale-110 motion-safe:group-hover/course:-rotate-6"
            strokeWidth={1.25}
          />
        </div>
      )}
    </div>
  );
}
