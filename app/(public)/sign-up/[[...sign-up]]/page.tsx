import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      {/* SignUp reads the URL, so it must stream in instead of blocking prerender. */}
      <Suspense fallback={null}>
        <SignUp />
      </Suspense>
    </div>
  );
}
