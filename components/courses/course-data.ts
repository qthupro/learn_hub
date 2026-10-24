import type { LucideIcon } from "lucide-react";
import type { CourseCategory } from "@/convex/lib/validators";
import {
  BrainCircuitIcon,
  BriefcaseIcon,
  CameraIcon,
  ChartLineIcon,
  CodeXmlIcon,
  PaletteIcon,
} from "lucide-react";

/** Category ids are owned by the Convex schema. */
export type CategoryId = CourseCategory;

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
  icon: LucideIcon;
};

export const categories: Category[] = [
  {
    id: "development",
    name: "Development",
    description: "Web, mobile and backend engineering",
    icon: CodeXmlIcon,
  },
  {
    id: "design",
    name: "Design",
    description: "Product, UI and visual design",
    icon: PaletteIcon,
  },
  {
    id: "data",
    name: "Data",
    description: "Analytics, SQL and visualization",
    icon: ChartLineIcon,
  },
  {
    id: "ai",
    name: "AI & Machine Learning",
    description: "LLMs, models and applied AI",
    icon: BrainCircuitIcon,
  },
  {
    id: "business",
    name: "Business",
    description: "Strategy, marketing and leadership",
    icon: BriefcaseIcon,
  },
  {
    id: "photography",
    name: "Photography",
    description: "Shooting, lighting and editing",
    icon: CameraIcon,
  },
];

export function getCategory(id: CategoryId) {
  return categories.find((category) => category.id === id) ?? categories[0];
}

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type CourseChapter = {
  title: string;
  lessons: string[];
};

/** Presentation shape for the public catalog. Swap the sample data for a Convex query once courses exist. */
export type CourseSummary = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: { name: string; title: string };
  category: CategoryId;
  level: CourseLevel;
  priceCents: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  durationMinutes: number;
  thumbnailUrl?: string;
  publishedAt: string;
  curriculum: CourseChapter[];
};

export function lessonCount(course: CourseSummary) {
  return course.curriculum.reduce((total, chapter) => total + chapter.lessons.length, 0);
}

export const sampleCourses: CourseSummary[] = [
  {
    slug: "modern-react-from-zero",
    title: "Modern React from Zero to Production",
    subtitle: "Build fast, accessible apps with React 19 and Next.js.",
    description:
      "A practical, project-driven path through components, server rendering, data fetching and deployment. You'll ship three real apps and learn the patterns senior engineers use every day.",
    instructor: { name: "Maya Chen", title: "Staff Frontend Engineer" },
    category: "development",
    level: "Beginner",
    priceCents: 8900,
    rating: 4.9,
    reviewCount: 2140,
    studentCount: 18400,
    durationMinutes: 1260,
    publishedAt: "2026-08-12",
    curriculum: [
      {
        title: "Foundations",
        lessons: ["How React renders", "Components and props", "State and events"],
      },
      {
        title: "Server Components",
        lessons: ["The client/server boundary", "Fetching data on the server", "Streaming with Suspense"],
      },
      {
        title: "Shipping to production",
        lessons: ["Performance budgets", "Accessibility audits", "Deploying your app"],
      },
    ],
  },
  {
    slug: "interface-design-systems",
    title: "Interface Design Systems",
    subtitle: "Design consistent, scalable product interfaces.",
    description:
      "Learn to build a design system from tokens to components, document it, and hand it off to engineering without losing fidelity.",
    instructor: { name: "Daniel Okafor", title: "Principal Product Designer" },
    category: "design",
    level: "Intermediate",
    priceCents: 6900,
    rating: 4.8,
    reviewCount: 980,
    studentCount: 7200,
    durationMinutes: 780,
    publishedAt: "2026-06-02",
    curriculum: [
      { title: "Design tokens", lessons: ["Color systems", "Type scales", "Spacing and layout"] },
      { title: "Components", lessons: ["Anatomy of a button", "States and variants"] },
      { title: "Handoff", lessons: ["Documentation that gets read", "Working with engineers"] },
    ],
  },
  {
    slug: "sql-for-analysts",
    title: "SQL for Data Analysts",
    subtitle: "Answer real business questions with confident SQL.",
    description:
      "From your first SELECT to window functions and query optimization, using realistic datasets drawn from product analytics.",
    instructor: { name: "Priya Raman", title: "Analytics Lead" },
    category: "data",
    level: "Beginner",
    priceCents: 4900,
    rating: 4.7,
    reviewCount: 1530,
    studentCount: 12900,
    durationMinutes: 540,
    publishedAt: "2026-03-18",
    curriculum: [
      { title: "Querying basics", lessons: ["SELECT and WHERE", "Sorting and limiting", "Aggregations"] },
      { title: "Joining data", lessons: ["Inner and outer joins", "Subqueries and CTEs"] },
      { title: "Advanced analysis", lessons: ["Window functions", "Cohort analysis"] },
    ],
  },
  {
    slug: "applied-llm-engineering",
    title: "Applied LLM Engineering",
    subtitle: "Build reliable AI features that users trust.",
    description:
      "Prompting, retrieval, evaluation and tool use. Design AI features that hold up in production, with tests to prove it.",
    instructor: { name: "Lucas Moreau", title: "ML Engineer" },
    category: "ai",
    level: "Advanced",
    priceCents: 12900,
    rating: 4.9,
    reviewCount: 640,
    studentCount: 5100,
    durationMinutes: 960,
    publishedAt: "2026-09-30",
    curriculum: [
      { title: "Working with models", lessons: ["Prompt design", "Structured outputs", "Tool use"] },
      { title: "Retrieval", lessons: ["Embeddings", "Chunking strategies", "Ranking"] },
      { title: "Evaluation", lessons: ["Building eval sets", "Regression testing"] },
    ],
  },
  {
    slug: "product-marketing-playbook",
    title: "The Product Marketing Playbook",
    subtitle: "Position, launch and grow products people want.",
    description:
      "A complete framework for positioning, messaging and launches, with templates you can reuse on your next release.",
    instructor: { name: "Sofia Lindqvist", title: "VP of Marketing" },
    category: "business",
    level: "Intermediate",
    priceCents: 5900,
    rating: 4.6,
    reviewCount: 410,
    studentCount: 3800,
    durationMinutes: 420,
    publishedAt: "2026-01-22",
    curriculum: [
      { title: "Positioning", lessons: ["Know your customer", "Competitive framing"] },
      { title: "Launches", lessons: ["Launch tiers", "Messaging that converts", "Measuring impact"] },
    ],
  },
  {
    slug: "natural-light-photography",
    title: "Natural Light Photography",
    subtitle: "Shoot striking portraits with the light you have.",
    description:
      "Understand light, composition and editing so every shot looks intentional, whether you use a phone or a full-frame camera.",
    instructor: { name: "Kenji Watanabe", title: "Editorial Photographer" },
    category: "photography",
    level: "Beginner",
    priceCents: 3900,
    rating: 4.8,
    reviewCount: 760,
    studentCount: 6400,
    durationMinutes: 360,
    publishedAt: "2026-05-09",
    curriculum: [
      { title: "Seeing light", lessons: ["Direction and quality", "Golden hour", "Open shade"] },
      { title: "Editing", lessons: ["Color grading basics", "Building a preset"] },
    ],
  },
];
