"use client";

import { use, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Accessibility } from "@dnd-kit/dom";
import { OptimisticSortingPlugin } from "@dnd-kit/dom/sortable";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragDropEventHandlers,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import {
  ArrowLeftIcon,
  EyeIcon,
  GripVerticalIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { contentLimits } from "@/convex/lib/validators";
import { AdminLoading } from "@/components/admin/admin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChapterDialog, type ChapterTarget } from "@/components/admin/chapter-dialog";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { LessonDialog, type LessonTarget } from "@/components/admin/lesson-dialog";
import {
  useOutlineMutations,
  type Outline,
  type OutlineChapter,
  type OutlineLesson,
} from "@/components/admin/use-outline-mutations";
import { videoStatusLabels } from "@/components/admin/video-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

type DialogState<T> = { target: T | null; open: boolean };
type DeleteTarget = { kind: "chapter"; chapter: OutlineChapter } | { kind: "lesson"; lesson: OutlineLesson };

/** Lesson ids per chapter id: the shape `move()` from @dnd-kit/helpers works with for grouped lists. */
type LessonGroups = Record<string, string[]>;

type ProviderPlugins = NonNullable<ComponentProps<typeof DragDropProvider>["plugins"]>;

/** Data attached to each sortable, so screen reader announcements can use titles instead of ids. */
type SortableData = { label: string };

// Lower than lessons (Normal = 2), so a lesson dragged over a chapter's lessons lands between them
// rather than on the chapter itself. Equivalent to CollisionPriority.Low from @dnd-kit/abstract.
const CHAPTER_COLLISION_PRIORITY = 1;

type SortablePlugins = NonNullable<Parameters<typeof useSortable>[0]["plugins"]>;

// dnd-kit's optimistic sorting moves DOM nodes itself during a drag. React renders every move from
// the draft instead, so it is turned off: otherwise a save that fails after the drop re-renders the
// old order over nodes React no longer owns, and React throws while placing them.
const sortablePlugins: SortablePlugins = (defaults) =>
  defaults.filter((plugin) => plugin !== OptimisticSortingPlugin);

const screenReaderInstructions = {
  draggable:
    "To pick up this item, press Space or Enter. Use the arrow keys to move it, press Space or Enter to drop it, " +
    "or press Escape to cancel.",
};

function labelOf(entity: { data?: unknown } | null | undefined) {
  const data = entity?.data as Partial<SortableData> | undefined;
  return data?.label ?? "item";
}

function DragHandle({ label, handleRef }: { label: string; handleRef: (element: Element | null) => void }) {
  return (
    <button
      ref={handleRef}
      type="button"
      aria-label={`Drag to reorder ${label}`}
      className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
    >
      <GripVerticalIcon className="size-4" />
    </button>
  );
}

function RowActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center">
      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${label}`} onClick={onEdit}>
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${label}`}
        onClick={onDelete}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

function SortableLesson({
  lesson,
  index,
  chapterId,
  onEdit,
  onDelete,
}: {
  lesson: OutlineLesson;
  index: number;
  chapterId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const label = `lesson ${lesson.title}`;
  const { ref, handleRef, isDragSource } = useSortable<SortableData>({
    id: lesson._id,
    index,
    group: chapterId,
    type: "lesson",
    accept: "lesson",
    plugins: sortablePlugins,
    data: { label: `Lesson “${lesson.title}”` },
  });

  return (
    <li
      ref={ref}
      className={cn(
        "flex items-center gap-2 border-b bg-card py-2 pr-2 pl-2 last:border-b-0",
        isDragSource && "relative z-10 rounded-md opacity-80 shadow-md ring-1 ring-ring/40",
      )}
    >
      <DragHandle label={label} handleRef={handleRef} />
      <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{index + 1}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <span className="truncate text-sm font-medium">{lesson.title}</span>
        <div className="flex shrink-0 gap-1.5">
          {lesson.isFreePreview ? (
            <Badge variant="secondary">
              <EyeIcon data-icon="inline-start" />
              Free preview
            </Badge>
          ) : null}
          {lesson.videoStatus ? (
            <Badge variant={lesson.videoStatus === "failed" ? "destructive" : "outline"}>
              <VideoIcon data-icon="inline-start" />
              {lesson.videoStatus === "ready"
                ? "Video"
                : `Video: ${videoStatusLabels[lesson.videoStatus].toLowerCase()}`}
            </Badge>
          ) : null}
        </div>
      </div>
      <RowActions label={label} onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}

function SortableChapter({
  chapter,
  index,
  children,
  onRename,
  onDelete,
  onAddLesson,
  canAddLesson,
}: {
  chapter: OutlineChapter;
  index: number;
  children: ReactNode;
  onRename: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  canAddLesson: boolean;
}) {
  const label = `chapter ${chapter.title}`;
  // The chapter is a sortable among chapters and also the drop target for lessons, which is what
  // lets a lesson be dropped into an empty chapter.
  const { ref, handleRef, isDragSource } = useSortable<SortableData>({
    id: chapter._id,
    index,
    type: "chapter",
    accept: ["chapter", "lesson"],
    collisionPriority: CHAPTER_COLLISION_PRIORITY,
    plugins: sortablePlugins,
    data: { label: `Chapter “${chapter.title}”` },
  });

  return (
    <li ref={ref} className={cn(isDragSource && "relative z-10 opacity-80")}>
      <Card className={cn("gap-0 py-0", isDragSource && "shadow-lg ring-ring/40")}>
        <CardHeader className="flex flex-row items-center gap-2 border-b py-3! pr-2 pl-2">
          <DragHandle label={label} handleRef={handleRef} />
          <span className="text-xs font-medium text-muted-foreground tabular-nums">Chapter {index + 1}</span>
          <h3 className="min-w-0 flex-1 truncate font-semibold">{chapter.title}</h3>
          <RowActions label={label} onEdit={onRename} onDelete={onDelete} />
        </CardHeader>
        <CardContent className="px-0">
          {children}
          <div className="border-t px-2 py-2">
            <Button variant="ghost" size="sm" disabled={!canAddLesson} onClick={onAddLesson}>
              <PlusIcon data-icon="inline-start" />
              Add lesson
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function OutlineEditor({ outline }: { outline: Outline }) {
  const { reorderChapters, moveLesson, removeChapter, removeLesson } = useOutlineMutations();
  const [chapterDialog, setChapterDialog] = useState<DialogState<ChapterTarget>>({ target: null, open: false });
  const [lessonDialog, setLessonDialog] = useState<DialogState<LessonTarget>>({ target: null, open: false });
  const [deleteDialog, setDeleteDialog] = useState<DialogState<DeleteTarget>>({ target: null, open: false });
  const { course, chapters } = outline;
  const lessonCount = chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);

  const savedGroups = useMemo<LessonGroups>(
    () => Object.fromEntries(chapters.map((chapter) => [chapter._id, chapter.lessons.map((lesson) => lesson._id)])),
    [chapters],
  );
  const lessonsById = useMemo(
    () => new Map(chapters.flatMap((chapter) => chapter.lessons).map((lesson) => [lesson._id as string, lesson])),
    [chapters],
  );

  const savedChapterIds = useMemo(() => chapters.map((chapter) => chapter._id as string), [chapters]);
  const chaptersById = useMemo(() => new Map(chapters.map((chapter) => [chapter._id as string, chapter])), [chapters]);

  // While something is dragged, the order lives in this draft; otherwise the saved outline is shown.
  // React renders every move (see sortablePlugins), so a failed save simply re-renders the saved
  // order. The ref mirrors the draft so onDragEnd reads the latest value synchronously.
  type Draft = { kind: "chapters"; chapterIds: string[] } | { kind: "lessons"; groups: LessonGroups };
  const [draft, setDraftState] = useState<Draft | null>(null);
  const draftRef = useRef<Draft | null>(null);
  function setDraft(next: Draft | null) {
    draftRef.current = next;
    setDraftState(next);
  }
  const chapterOrder = draft?.kind === "chapters" ? draft.chapterIds : savedChapterIds;

  /**
   * Drops the draft once dnd-kit has finished the drop animation. During a pointer drag's drop
   * animation the dragged element is held outside its list, and React throws if it moves that
   * element back in, as it does when the order snaps back after a cancel or a fast failed save.
   */
  function clearDraftAfterDrop(source: { isDropping: boolean }) {
    const finished = draftRef.current;
    const check = () => {
      if (source.isDropping) {
        requestAnimationFrame(check);
      } else if (draftRef.current === finished) {
        setDraft(null);
      }
    };
    requestAnimationFrame(check);
  }
  const lessonGroups = draft?.kind === "lessons" ? draft.groups : savedGroups;

  // Chapter titles for announcements, read through a ref so the plugin config stays stable.
  const chapterTitlesRef = useRef(new Map<string, string>());
  useEffect(() => {
    chapterTitlesRef.current = new Map(chapters.map((chapter) => [chapter._id, chapter.title]));
  }, [chapters]);

  const plugins = useMemo<ProviderPlugins>(
    () => (defaults) => [
      ...defaults.filter((plugin) => plugin !== Accessibility),
      Accessibility.configure({
        screenReaderInstructions,
        announcements: {
          dragstart: ({ operation: { source } }: DragStartEvent) => (source ? `Picked up ${labelOf(source)}.` : undefined),
          dragover: ({ operation: { source, target } }: DragOverEvent) =>
            source && target && source.id !== target.id ? `${labelOf(source)} is over ${labelOf(target)}.` : undefined,
          dragend: ({ operation: { source }, canceled }: DragEndEvent) => {
            if (!source) {
              return undefined;
            }
            if (canceled) {
              return `Cancelled. ${labelOf(source)} was returned to its original position.`;
            }
            if (!isSortable(source)) {
              return `${labelOf(source)} was dropped.`;
            }
            const chapterTitle = source.group ? chapterTitlesRef.current.get(String(source.group)) : undefined;
            return chapterTitle
              ? `${labelOf(source)} was dropped at position ${source.index + 1} in chapter “${chapterTitle}”.`
              : `${labelOf(source)} was dropped at position ${source.index + 1}.`;
          },
        },
      }),
    ],
    [],
  );

  /** Runs a mutation; the optimistic update already shows the result, so only failures are reported. */
  async function run(action: Promise<null>, success?: string) {
    try {
      await action;
      if (success) {
        toast.success(success);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const onDragStart: DragDropEventHandlers["onDragStart"] = (event) => {
    const type = event.operation.source?.type;
    if (type === "chapter") {
      setDraft({ kind: "chapters", chapterIds: savedChapterIds });
    } else if (type === "lesson") {
      setDraft({ kind: "lessons", groups: savedGroups });
    }
  };

  const onDragOver: DragDropEventHandlers["onDragOver"] = (event) => {
    const current = draftRef.current;
    if (current?.kind === "chapters") {
      setDraft({ kind: "chapters", chapterIds: move(current.chapterIds, event) });
    } else if (current?.kind === "lessons") {
      setDraft({ kind: "lessons", groups: move(current.groups, event) });
    }
  };

  // Each save starts right away: its optimistic update applies synchronously, so the saved outline
  // already shows the new order when the draft goes away. If the save fails, Convex rolls the
  // update back and the old order returns once the draft is cleared.
  const onDragEnd: DragDropEventHandlers["onDragEnd"] = (event) => {
    const current = draftRef.current;
    const { source } = event.operation;
    if (!event.canceled && source && current?.kind === "chapters") {
      if (current.chapterIds.join() !== savedChapterIds.join()) {
        void run(reorderChapters({ courseId: course._id, chapterIds: current.chapterIds as Id<"chapters">[] }));
      }
    } else if (!event.canceled && source && current?.kind === "lessons") {
      const groups = current.groups;
      const lessonId = String(source.id);
      const chapterId = Object.keys(groups).find((id) => groups[id].includes(lessonId));
      const changed =
        chapterId !== undefined &&
        (!savedGroups[chapterId]?.includes(lessonId) || groups[chapterId].join() !== savedGroups[chapterId].join());
      if (chapterId !== undefined && changed) {
        void run(
          moveLesson({
            lessonId: lessonId as Id<"lessons">,
            chapterId: chapterId as Id<"chapters">,
            lessonIds: groups[chapterId] as Id<"lessons">[],
          }),
        );
      }
    }
    if (source) {
      clearDraftAfterDrop(source);
    } else {
      setDraft(null);
    }
  };

  function confirmDelete() {
    const target = deleteDialog.target;
    if (target?.kind === "chapter") {
      void run(removeChapter({ chapterId: target.chapter._id }), `Deleted chapter "${target.chapter.title}"`);
    } else if (target?.kind === "lesson") {
      void run(removeLesson({ lessonId: target.lesson._id }), `Deleted lesson "${target.lesson.title}"`);
    }
  }

  const addChapter = () => setChapterDialog({ target: { kind: "create", courseId: course._id }, open: true });
  const canAddChapter = chapters.length < contentLimits.chaptersPerCourse;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Course content"
        description={`${course.title} · ${plural(chapters.length, "chapter")}, ${plural(lessonCount, "lesson")}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href={`/admin/courses/${course._id}/edit`} />}>
              <PencilIcon data-icon="inline-start" />
              Edit details
            </Button>
            <Button onClick={addChapter} disabled={!canAddChapter}>
              <PlusIcon data-icon="inline-start" />
              Add chapter
            </Button>
          </div>
        }
      />

      {chapters.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <LayersIcon aria-hidden className="size-6 text-muted-foreground" />
          <div>
            <p className="font-medium">No chapters yet</p>
            <p className="text-sm text-muted-foreground">Chapters group the lessons of this course.</p>
          </div>
          <Button onClick={addChapter}>
            <PlusIcon data-icon="inline-start" />
            Add chapter
          </Button>
        </div>
      ) : (
        <DragDropProvider plugins={plugins} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
          <p className="-mt-2 text-sm text-muted-foreground">
            Drag the handles to reorder chapters and lessons, or move lessons between chapters.
          </p>
          <ol className="flex flex-col gap-4">
            {chapterOrder.map((chapterId, chapterIndex) => {
              const chapter = chaptersById.get(chapterId);
              if (!chapter) {
                return null;
              }
              const lessonIds = lessonGroups[chapter._id] ?? [];
              return (
                <SortableChapter
                  key={chapter._id}
                  chapter={chapter}
                  index={chapterIndex}
                  canAddLesson={lessonIds.length < contentLimits.lessonsPerChapter}
                  onRename={() =>
                    setChapterDialog({
                      target: { kind: "rename", chapterId: chapter._id, title: chapter.title },
                      open: true,
                    })
                  }
                  onDelete={() => setDeleteDialog({ target: { kind: "chapter", chapter }, open: true })}
                  onAddLesson={() =>
                    setLessonDialog({
                      target: { kind: "create", chapterId: chapter._id, chapterTitle: chapter.title },
                      open: true,
                    })
                  }
                >
                  {lessonIds.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground">
                      No lessons yet. Add one, or drag a lesson here.
                    </p>
                  ) : (
                    <ol>
                      {lessonIds.map((lessonId, lessonIndex) => {
                        const lesson = lessonsById.get(lessonId);
                        return lesson ? (
                          <SortableLesson
                            key={lesson._id}
                            lesson={lesson}
                            index={lessonIndex}
                            chapterId={chapter._id}
                            onEdit={() => setLessonDialog({ target: { kind: "edit", lesson }, open: true })}
                            onDelete={() => setDeleteDialog({ target: { kind: "lesson", lesson }, open: true })}
                          />
                        ) : null;
                      })}
                    </ol>
                  )}
                </SortableChapter>
              );
            })}
          </ol>
        </DragDropProvider>
      )}

      <ChapterDialog
        target={chapterDialog.target}
        open={chapterDialog.open}
        onOpenChange={(open) => setChapterDialog((current) => ({ ...current, open }))}
      />
      <LessonDialog
        target={lessonDialog.target}
        open={lessonDialog.open}
        onOpenChange={(open) => setLessonDialog((current) => ({ ...current, open }))}
      />
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((current) => ({ ...current, open }))}
        title={deleteDialog.target?.kind === "chapter" ? "Delete this chapter?" : "Delete this lesson?"}
        description={
          deleteDialog.target?.kind === "chapter" ? (
            <>
              &ldquo;{deleteDialog.target.chapter.title}&rdquo; and its{" "}
              {plural(deleteDialog.target.chapter.lessons.length, "lesson")} will be permanently deleted. This can&apos;t
              be undone.
            </>
          ) : deleteDialog.target?.kind === "lesson" ? (
            <>
              &ldquo;{deleteDialog.target.lesson.title}&rdquo; will be permanently deleted. This can&apos;t be undone.
            </>
          ) : null
        }
        confirmLabel={deleteDialog.target?.kind === "chapter" ? "Delete chapter" : "Delete lesson"}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export function CourseOutline({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const outline = useQuery(api.chapters.outlineForAdmin, { courseId });

  if (outline === undefined) {
    return <AdminLoading className="min-h-64" />;
  }
  if (outline === null) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="font-medium">Course not found</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/courses" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to courses
        </Button>
      </div>
    );
  }
  return <OutlineEditor outline={outline} />;
}
