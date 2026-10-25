"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon, UsersIcon } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StudentDetails } from "@/components/admin/student-details";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatUsd } from "@/lib/format";
import { cn, initials } from "@/lib/utils";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type Sort = "joined" | "name" | "courses" | "spent";
type Order = "asc" | "desc";

// Names read best A–Z; numbers and dates biggest or newest first.
const defaultOrder: Record<Sort, Order> = { name: "asc", joined: "desc", courses: "desc", spent: "desc" };

function SortHeader({
  label,
  column,
  sort,
  order,
  disabled,
  onSort,
  className,
}: {
  label: string;
  column: Sort;
  sort: Sort;
  order: Order;
  disabled: boolean;
  onSort: (column: Sort) => void;
  className?: string;
}) {
  const active = !disabled && column === sort;
  const Icon = !active ? ArrowUpDownIcon : order === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <TableHead
      className={className}
      aria-sort={active ? (order === "asc" ? "ascending" : "descending") : undefined}
    >
      <Button
        variant="ghost"
        size="sm"
        className="-mx-2 h-7 px-2 font-medium"
        disabled={disabled}
        title={disabled ? "Search results are sorted by relevance" : undefined}
        onClick={() => onSort(column)}
      >
        {label}
        <Icon data-icon="inline-end" className={cn(!active && "text-muted-foreground/60")} />
      </Button>
    </TableHead>
  );
}

/** Paginated, searchable, sortable list of students; a row opens their details. Admin only. */
export function StudentsTable() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("joined");
  const [order, setOrder] = useState<Order>("desc");
  // Cursors of the pages visited so far; the last is the current page (null = first page).
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [selected, setSelected] = useState<Id<"users"> | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCursors([null]);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const searching = search !== "";
  const result = useQuery(api.students.list, {
    paginationOpts: { numItems: PAGE_SIZE, cursor: cursors[cursors.length - 1] },
    search: searching ? search : undefined,
    sort,
    order,
  });
  // Keep showing the last page while the next loads, so typing or paging doesn't flash a skeleton.
  const [lastResult, setLastResult] = useState(result);
  if (result !== undefined && result !== lastResult) {
    setLastResult(result);
  }
  const data = result ?? lastResult;
  const loading = result === undefined;

  function onSort(column: Sort) {
    setOrder(column === sort ? (order === "asc" ? "desc" : "asc") : defaultOrder[column]);
    setSort(column);
    setCursors([null]);
  }

  function openStudent(userId: Id<"users">) {
    setSelected(userId);
    setSheetOpen(true);
  }

  const pageIndex = cursors.length - 1;
  const firstRow = pageIndex * PAGE_SIZE + 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search students"
          className="pl-8"
        />
      </div>

      <div className={cn("rounded-xl bg-card ring-1 ring-foreground/10 transition-opacity", loading && data && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Student" column="name" className="pl-4" {...{ sort, order, onSort }} disabled={searching} />
              <SortHeader label="Joined" column="joined" {...{ sort, order, onSort }} disabled={searching} />
              <SortHeader label="Courses" column="courses" {...{ sort, order, onSort }} disabled={searching} />
              <TableHead>Avg. progress</TableHead>
              <SortHeader label="Total spent" column="spent" className="pr-4 text-right [&_button]:-mr-2" {...{ sort, order, onSort }} disabled={searching} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data === undefined
              ? Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i} aria-hidden>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-44" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-2 w-28" /></TableCell>
                    <TableCell className="pr-4"><Skeleton className="ml-auto h-4 w-14" /></TableCell>
                  </TableRow>
                ))
              : data.page.map((student) => (
                  <TableRow key={student._id} className="cursor-pointer" onClick={() => openStudent(student._id)}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {student.imageUrl ? <AvatarImage src={student.imageUrl} alt="" /> : null}
                          <AvatarFallback>{initials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          {/* The keyboard target; clicking anywhere on the row does the same. */}
                          <button
                            type="button"
                            className="block max-w-56 truncate rounded-sm text-left font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                            onClick={(event) => {
                              event.stopPropagation();
                              openStudent(student._id);
                            }}
                          >
                            {student.name}
                          </button>
                          <p className="max-w-56 truncate text-xs text-muted-foreground">{student.email ?? "No email"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(student.joinedAt)}</TableCell>
                    <TableCell className="tabular-nums">{student.enrolledCourseCount}</TableCell>
                    <TableCell>
                      {student.averageProgress === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="flex w-36 items-center gap-2">
                          <Progress value={student.averageProgress} aria-label={`${student.name} average progress`} className="flex-1" />
                          <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{student.averageProgress}%</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">{formatUsd(student.totalSpentCents)}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {data !== undefined && data.page.length === 0 ? (
          <div className="p-4 pt-0">
            <EmptyState icon={UsersIcon}>
              {searching ? `No students match “${search}”.` : "No students have signed up yet."}
            </EmptyState>
          </div>
        ) : null}
      </div>

      {data !== undefined && (data.page.length > 0 || pageIndex > 0) ? (
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="text-muted-foreground tabular-nums">
            {data.page.length === 0
              ? `Page ${pageIndex + 1}`
              : `Showing ${firstRow}–${firstRow + data.page.length - 1}`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex === 0 || loading}
              onClick={() => setCursors(cursors.slice(0, -1))}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.isDone || loading}
              onClick={() => setCursors([...cursors, data.continueCursor])}
            >
              Next
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          {/* Kept after closing so the content doesn't vanish during the exit animation. */}
          {selected ? <StudentDetails key={selected} userId={selected} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
