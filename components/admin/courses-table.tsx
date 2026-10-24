"use client";

import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { BookOpenIcon, LayersIcon, PencilIcon, PlusIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { levelLabels, statusLabels } from "@/components/admin/course-options";
import { DeleteCourseButton } from "@/components/admin/delete-course-button";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { getCategory } from "@/components/courses/course-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const updatedFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function CoursesTable() {
  const { results, status, loadMore } = usePaginatedQuery(api.courses.listForAdmin, {}, { initialNumItems: PAGE_SIZE });

  if (status === "LoadingFirstPage") {
    return (
      <Card className="gap-0 p-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-4 last:border-b-0">
            <Skeleton className="aspect-video w-24 rounded-md" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <BookOpenIcon aria-hidden className="size-6 text-muted-foreground" />
        <div>
          <p className="font-medium">No courses yet</p>
          <p className="text-sm text-muted-foreground">Create your first course to get started.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/courses/new" />}>
          <PlusIcon data-icon="inline-start" />
          Create course
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Course</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((course) => (
              <TableRow key={course._id}>
                <TableCell className="pl-4">
                  <div className="flex min-w-64 items-center gap-3">
                    <CourseThumbnail
                      title={course.title}
                      category={course.category}
                      thumbnailUrl={course.thumbnailUrl ?? undefined}
                      sizes="96px"
                      className="w-24 shrink-0 rounded-md"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{course.title}</p>
                      <p className="truncate text-xs text-muted-foreground">/{course.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getCategory(course.category).name}</TableCell>
                <TableCell>{levelLabels[course.level]}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPrice(course.priceCents)}</TableCell>
                <TableCell>
                  <Badge
                    variant={course.status === "published" ? "default" : "secondary"}
                    className={cn(
                      course.status === "published" &&
                        "bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300",
                    )}
                  >
                    {statusLabels[course.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {updatedFormat.format(course.updatedAt)}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/courses/${course._id}/edit`} />}
                      aria-label={`Edit ${course.title}`}
                    >
                      <PencilIcon data-icon="inline-start" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/admin/courses/${course._id}/content`} />}
                      aria-label={`Manage content of ${course.title}`}
                    >
                      <LayersIcon data-icon="inline-start" />
                      Content
                    </Button>
                    <DeleteCourseButton courseId={course._id} title={course.title} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {status !== "Exhausted" ? (
        <Button
          variant="outline"
          className="self-center"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(PAGE_SIZE)}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
