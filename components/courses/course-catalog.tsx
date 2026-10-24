"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpDownIcon, SearchIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseCard } from "@/components/courses/course-card";
import { type CategoryId, type CourseSummary, categories } from "@/components/courses/course-data";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

const comparators: Record<SortValue, (a: CourseSummary, b: CourseSummary) => number> = {
  popular: (a, b) => b.studentCount - a.studentCount,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  newest: (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  "price-asc": (a, b) => a.priceCents - b.priceCents,
  "price-desc": (a, b) => b.priceCents - a.priceCents,
};

/** Searchable, filterable grid used once the catalog has three or more courses. */
export function CourseCatalog({ courses }: { courses: CourseSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [sort, setSort] = useState<SortValue>("popular");
  const deferredQuery = useDeferredValue(query);

  // Only offer categories that actually have courses.
  const availableCategories = useMemo(
    () => categories.filter((item) => courses.some((course) => course.category === item.id)),
    [courses],
  );

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return courses
      .filter((course) => category === "all" || course.category === category)
      .filter(
        (course) =>
          !needle ||
          course.title.toLowerCase().includes(needle) ||
          course.instructor.name.toLowerCase().includes(needle) ||
          course.subtitle.toLowerCase().includes(needle),
      )
      .toSorted(comparators[sort]);
  }, [courses, category, deferredQuery, sort]);

  const reset = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses or instructors"
            aria-label="Search courses"
            className="h-10 pl-9"
          />
        </div>
        <Select
          items={sortOptions}
          value={sort}
          onValueChange={(value) => value && setSort(value)}
        >
          <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Sort courses">
            <ArrowUpDownIcon aria-hidden className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        role="group"
        aria-label="Filter by category"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {[{ id: "all" as const, name: "All courses" }, ...availableCategories].map((item) => {
          const active = category === item.id;
          return (
            <Button
              key={item.id}
              variant={active ? "default" : "outline"}
              size="sm"
              aria-pressed={active}
              onClick={() => setCategory(item.id)}
              className={cn("h-8 shrink-0 rounded-full px-3.5", !active && "text-muted-foreground")}
            >
              {item.name}
            </Button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {results.length} of {courses.length} courses
      </p>

      {results.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((course) => (
            <li key={course.slug} className="flex motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
              <CourseCard course={course} className="w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-muted">
            <SearchXIcon aria-hidden className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">No courses match your search</p>
            <p className="text-sm text-muted-foreground">Try a different keyword or category.</p>
          </div>
          <Button variant="outline" onClick={reset}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
