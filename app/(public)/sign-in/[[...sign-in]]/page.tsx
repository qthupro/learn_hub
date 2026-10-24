import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      {/* SignIn reads the URL, so it must stream in instead of blocking prerender. */}
      <Suspense fallback={null}>
        <SignIn />
      </Suspense>
    </div>
  );
}
