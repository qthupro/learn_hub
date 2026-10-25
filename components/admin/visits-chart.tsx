"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";

const ranges = [7, 30, 90] as const;
type Range = (typeof ranges)[number];

const chartConfig = {
  visits: { label: "Visits", color: "var(--chart-visits)" },
} satisfies ChartConfig;

// Days are UTC dates, so format them in UTC too, or they shift a day west of Greenwich.
const shortDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

function dayLabel(day: string, format: Intl.DateTimeFormat) {
  return format.format(Date.parse(`${day}T00:00:00Z`));
}

/** Daily unique page visits for the last 7, 30 or 90 days. Render inside AdminGate; the query is admin only. */
export function VisitsChart() {
  const [range, setRange] = useState<Range>(30);
  // Queries can't read the clock, so the client supplies today (UTC).
  const [endDay] = useState(() => new Date().toISOString().slice(0, 10));
  const data = useQuery(api.visits.daily, { endDay, days: range });
  const total = data?.reduce((sum, point) => sum + point.visits, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visits</CardTitle>
        <CardDescription>
          {total === undefined ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <>
              <span className="font-medium text-foreground tabular-nums">{formatNumber(total)}</span> unique page visits
              in the last {range} days
            </>
          )}
        </CardDescription>
        <CardAction>
          <div role="group" aria-label="Date range" className="flex rounded-lg bg-muted p-0.5">
            {ranges.map((days) => (
              <Button
                key={days}
                size="sm"
                variant={days === range ? "outline" : "ghost"}
                aria-pressed={days === range}
                className="h-7 border-transparent px-2.5 aria-pressed:bg-background aria-pressed:shadow-sm"
                onClick={() => setRange(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {data === undefined ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full" aria-hidden>
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-visits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-visits)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-visits)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(day: string) => dayLabel(day, shortDay)}
                />
                <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickCount={4} />
                <ChartTooltip
                  cursor
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelFormatter={(_, payload) => {
                        const day: unknown = payload[0]?.payload?.day;
                        return typeof day === "string" ? dayLabel(day, longDay) : null;
                      }}
                    />
                  }
                />
                <Area
                  dataKey="visits"
                  type="monotone"
                  stroke="var(--color-visits)"
                  strokeWidth={2}
                  fill="url(#fill-visits)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </AreaChart>
            </ChartContainer>
            {/* The same numbers for screen readers, since the chart itself is only visual. */}
            <table className="sr-only">
              <caption>Unique page visits per day, last {range} days</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Visits</th>
                </tr>
              </thead>
              <tbody>
                {data.map((point) => (
                  <tr key={point.day}>
                    <td>{dayLabel(point.day, longDay)}</td>
                    <td>{point.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
