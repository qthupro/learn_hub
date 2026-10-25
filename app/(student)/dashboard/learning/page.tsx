import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LearningHistory } from "@/components/learn/learning-history";

export const metadata: Metadata = {
  title: "Learning history · LearnHub",
};

export default function LearningHistoryPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <AdminPageHeader title="Learning history" description="Lessons you watched recently. Pick up any of them where you left off." />
      <LearningHistory />
    </div>
  );
}
