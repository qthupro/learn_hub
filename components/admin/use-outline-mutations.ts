"use client";

import { useMutation } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";

export type Outline = NonNullable<FunctionReturnType<typeof api.chapters.outlineForAdmin>>;
export type OutlineChapter = Outline["chapters"][number];
export type OutlineLesson = OutlineChapter["lessons"][number];

/** Applies `update` to every cached outline, so the editor changes before the server confirms. */
function updateOutlines(localStore: OptimisticLocalStore, update: (outline: Outline) => Outline) {
  for (const { args, value } of localStore.getAllQueries(api.chapters.outlineForAdmin)) {
    if (value) {
      localStore.setQuery(api.chapters.outlineForAdmin, args, update(value));
    }
  }
}

function sortByIds<T extends { _id: string }>(items: T[], ids: string[]) {
  return ids.map((id) => items.find((item) => item._id === id)).filter((item): item is T => item !== undefined);
}

/** Outline mutations whose results show up immediately; Convex rolls them back if they fail. */
export function useOutlineMutations() {
  const reorderChapters = useMutation(api.chapters.reorder).withOptimisticUpdate((localStore, { courseId, chapterIds }) =>
    updateOutlines(localStore, (outline) =>
      outline.course._id === courseId ? { ...outline, chapters: sortByIds(outline.chapters, chapterIds) } : outline,
    ),
  );

  const moveLesson = useMutation(api.lessons.move).withOptimisticUpdate(
    (localStore, { lessonId, chapterId, lessonIds }) =>
      updateOutlines(localStore, (outline) => {
        const lessons = outline.chapters.flatMap((chapter) => chapter.lessons);
        if (!lessons.some((lesson) => lesson._id === lessonId)) {
          return outline;
        }
        return {
          ...outline,
          chapters: outline.chapters.map((chapter) =>
            chapter._id === chapterId
              ? { ...chapter, lessons: sortByIds(lessons, lessonIds) }
              : { ...chapter, lessons: chapter.lessons.filter((lesson) => lesson._id !== lessonId) },
          ),
        };
      }),
  );

  const removeChapter = useMutation(api.chapters.remove).withOptimisticUpdate((localStore, { chapterId }) =>
    updateOutlines(localStore, (outline) => ({
      ...outline,
      chapters: outline.chapters.filter((chapter) => chapter._id !== chapterId),
    })),
  );

  const removeLesson = useMutation(api.lessons.remove).withOptimisticUpdate((localStore, { lessonId }) =>
    updateOutlines(localStore, (outline) => ({
      ...outline,
      chapters: outline.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.filter((lesson) => lesson._id !== lessonId),
      })),
    })),
  );

  return { reorderChapters, moveLesson, removeChapter, removeLesson };
}
