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
