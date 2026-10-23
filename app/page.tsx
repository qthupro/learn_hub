import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { ConvexAuthStatus } from "@/components/shared/convex-auth-status";

// Temporary style preview. Replace with the real home page.
function StyleSamples({ idPrefix }: { idPrefix: string }) {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1>Heading 1 — Course catalog</h1>
        <h2>Heading 2 — Chapter overview</h2>
        <h3>Heading 3 — Lesson details</h3>
        <h4>Heading 4 — Section label</h4>
        <p className="max-w-prose text-muted-foreground">
          Learn at your own pace with short, focused video lessons. Track your progress across every chapter and pick up
          exactly where you left off.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h4>Buttons</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h4>Badges</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge className="bg-success text-success-foreground">Published</Badge>
          <Badge className="bg-success text-success-foreground">Ready</Badge>
          <Badge className="bg-info text-info-foreground">Uploading</Badge>
          <Badge className="bg-warning text-warning-foreground">Processing</Badge>
          <Badge variant="destructive">Failed</Badge>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create course</CardTitle>
            <CardDescription>Give your course a clear, descriptive title.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor={`${idPrefix}-course-title`}>Title</Label>
            <Input id={`${idPrefix}-course-title`} placeholder="Intro to TypeScript" />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>

        <div className="flex flex-col justify-center gap-3">
          <h4>Progress</h4>
          <Progress value={64}>
            <ProgressLabel>Course progress</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <ConvexAuthStatus />
        <span className="text-sm text-muted-foreground">Style preview</span>
      </div>

      <StyleSamples idPrefix="light" />

      {/* .dark on a wrapper re-scopes the theme variables, so both modes can be checked side by side. */}
      <div className="dark rounded-xl bg-background p-6 text-foreground md:p-10">
        <StyleSamples idPrefix="dark" />
      </div>
    </main>
  );
}
