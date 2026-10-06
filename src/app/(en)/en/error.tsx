"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import ErrorScreen from "@/components/ErrorScreen";

export default function PageError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  // The data is fetched on the server, so the page is asked for again before the error is cleared
  return (
    <ErrorScreen
      locale="en"
      reset={() =>
        startTransition(() => {
          router.refresh();
          reset();
        })
      }
    />
  );
}
