"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";

export function DeleteCourseButton({ courseId, title }: { courseId: Id<"courses">; title: string }) {
  const [open, setOpen] = useState(false);
  // Drops the row from every loaded page right away; Convex rolls this back if the delete fails.
  const removeCourse = useMutation(api.courses.remove).withOptimisticUpdate((localStore, args) => {
    for (const { args: queryArgs, value } of localStore.getAllQueries(api.courses.listForAdmin)) {
      if (value !== undefined) {
        localStore.setQuery(api.courses.listForAdmin, queryArgs, {
          ...value,
          page: value.page.filter((course) => course._id !== args.courseId),
        });
      }
    }
  });

  async function confirmDelete() {
    try {
      await removeCourse({ courseId });
      toast.success(`Deleted "${title}"`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${title}`}
        onClick={() => setOpen(true)}
      >
        <Trash2Icon />
      </Button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this course?"
        description={
          <>
            &ldquo;{title}&rdquo;, its thumbnail, and all of its chapters and lessons will be permanently deleted.
            This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete course"
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
