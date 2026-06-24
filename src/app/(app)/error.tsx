"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <div className="eyebrow mb-2">Error</div>
        <p className="serif" style={{ fontSize: 24 }}>
          Something went <em style={{ fontStyle: "italic" }}>wrong.</em>
        </p>
        <p className="small muted mt-1">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button variant="magenta" className="mt-4" onClick={reset}>
          Try Again
        </Button>
      </Card>
    </div>
  );
}
