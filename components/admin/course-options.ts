import { categories } from "@/components/courses/course-data";
import type { CourseLevel, CourseStatus } from "@/convex/lib/validators";

export const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }));

export const levelLabels: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const levelOptions = Object.entries(levelLabels).map(([value, label]) => ({
  value: value as CourseLevel,
  label,
}));

export const statusLabels: Record<CourseStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
  value: value as CourseStatus,
  label,
}));
